// ============================================================
// 和膜 HAMOREY — D1 查询工具函数（Workers 端）
// 供 functions/api/ 下各路由文件共享引用
// 第二阶段增强：SHA-256 哈希、Session Token 管理、认证校验
// ============================================================

/** 生成 UUID */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * 执行单条查询并返回第一行
 */
export async function queryFirst<T = unknown>(
  db: D1Database,
  sql: string,
  ...params: unknown[]
): Promise<T | null> {
  const stmt = db.prepare(sql).bind(...params);
  return stmt.first<T>();
}

/**
 * 执行查询并返回所有结果
 */
export async function queryAll<T = unknown>(
  db: D1Database,
  sql: string,
  ...params: unknown[]
): Promise<T[]> {
  const stmt = db.prepare(sql).bind(...params);
  const result = await stmt.all<T>();
  return result.results ?? [];
}

/**
 * 执行 INSERT/UPDATE/DELETE
 */
export async function execute(
  db: D1Database,
  sql: string,
  ...params: unknown[]
): Promise<D1Result> {
  const stmt = db.prepare(sql).bind(...params);
  return stmt.run();
}

/**
 * 批量执行多条 SQL（用于事务）
 */
export async function batch(
  db: D1Database,
  statements: Array<{ sql: string; params: unknown[] }>,
): Promise<D1Result[]> {
  const prepared = statements.map((s) => db.prepare(s.sql).bind(...s.params));
  return db.batch(prepared);
}

/**
 * 安全的 LIKE 查询参数（转义特殊字符）
 */
export function escapeLike(input: string): string {
  return input.replace(/[%_\\]/g, '\\$&');
}

/**
 * 分页参数解析
 */
export function parsePagination(url: URL): { page: number; pageSize: number; offset: number } {
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const pageSize = Math.min(50, Math.max(1, parseInt(url.searchParams.get('pageSize') || '20', 10)));
  const offset = (page - 1) * pageSize;
  return { page, pageSize, offset };
}

// ============================================================
// 第二阶段新增：SHA-256 密码哈希
// ============================================================

/**
 * SHA-256 哈希（使用 Web Crypto API，Workers 环境原生支持）
 * 生产环境建议后续加 salt
 */
export async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================
// 第二阶段新增：Session Token 管理
// ============================================================

/** Session 过期时间（24 小时） */
const SESSION_TTL_HOURS = 24;

/**
 * 生成 Session Token（UUID）
 */
export function generateSessionToken(): string {
  return crypto.randomUUID();
}

/**
 * 创建 Session
 */
export async function createSession(
  db: D1Database,
  userId: string,
  ipAddress: string,
  userAgent: string,
): Promise<{ token: string; expiresAt: string }> {
  const id = generateId();
  const token = generateSessionToken();
  const expiresAt = new Date(
    Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000,
  ).toISOString();
  await execute(
    db,
    `INSERT INTO sessions (id, user_id, token, ip_address, user_agent, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
    id,
    userId,
    token,
    ipAddress,
    userAgent,
    expiresAt,
  );
  return { token, expiresAt };
}

/**
 * 验证 Session Token，返回用户信息
 * 如果 token 无效或过期，返回 null
 */
export async function validateSession(
  db: D1Database,
  token: string,
): Promise<{
  userId: string;
  username: string;
  role: string;
  orgId: string;
  orgType: string;
  orgName: string;
} | null> {
  const session = await queryFirst<{
    user_id: string;
    expires_at: string;
  }>(
    db,
    `SELECT user_id, expires_at FROM sessions WHERE token = ?`,
    token,
  );

  if (!session) return null;

  // 检查是否过期
  if (new Date(session.expires_at) < new Date()) {
    // 清理过期 session
    await execute(db, `DELETE FROM sessions WHERE token = ?`, token);
    return null;
  }

  // 查询用户和组织信息
  const user = await queryFirst<{
    id: string;
    username: string;
    role: string;
    organization_id: string;
  }>(
    db,
    `SELECT u.id, u.username, u.role, u.organization_id
     FROM users u WHERE u.id = ? AND u.status = 'active'`,
    session.user_id,
  );

  if (!user) return null;

  const org = await queryFirst<{
    id: string;
    type: string;
    name: string;
  }>(
    db,
    `SELECT id, type, name FROM organizations WHERE id = ? AND status = 'active'`,
    user.organization_id,
  );

  if (!org) return null;

  return {
    userId: user.id,
    username: user.username,
    role: user.role,
    orgId: org.id,
    orgType: org.type,
    orgName: org.name,
  };
}

/**
 * 删除 Session（登出）
 */
export async function deleteSession(db: D1Database, token: string): Promise<void> {
  await execute(db, `DELETE FROM sessions WHERE token = ?`, token);
}

/**
 * 清理所有过期 session
 */
export async function cleanExpiredSessions(db: D1Database): Promise<void> {
  await execute(
    db,
    `DELETE FROM sessions WHERE expires_at < datetime('now')`,
  );
}

// ============================================================
// 第二阶段新增：认证上下文类型
// ============================================================

export interface AuthContext {
  userId: string;
  username: string;
  role: string;
  orgId: string;
  orgType: string;
  orgName: string;
}

/**
 * 从 context.data 中提取认证用户信息
 * 用于 API handler 中获取中间件注入的 currentUser
 */
export function getAuthUser(data: Record<string, unknown>): AuthContext | undefined {
  return (data as Record<string, unknown> & { currentUser?: AuthContext }).currentUser;
}

// ============================================================
// 第二阶段新增：操作日志记录
// ============================================================

/**
 * 记录操作日志
 */
export async function writeOperationLog(
  db: D1Database,
  userId: string | null,
  action: string,
  targetType: string | null,
  targetId: string | null,
  detail: unknown,
  ipAddress: string,
): Promise<void> {
  const id = generateId();
  await execute(
    db,
    `INSERT INTO operation_logs (id, user_id, action, target_type, target_id, detail_json, ip_address, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    id,
    userId,
    action,
    targetType,
    targetId,
    detail ? JSON.stringify(detail) : null,
    ipAddress,
  );
}

// ============================================================
// 第二阶段新增：积分流水记录
// ============================================================

/**
 * 写入积分流水
 */
export async function writePointsLedger(
  db: D1Database,
  organizationId: string,
  changeType: string,
  pointsChange: number,
  frozenChange: number,
  relatedType: string | null,
  relatedId: string | null,
  reason: string | null,
  operatorUserId: string | null,
): Promise<string> {
  const id = generateId();
  await execute(
    db,
    `INSERT INTO points_ledger (id, organization_id, change_type, points_change, frozen_change, related_type, related_id, reason, operator_user_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    id,
    organizationId,
    changeType,
    pointsChange,
    frozenChange,
    relatedType,
    relatedId,
    reason,
    operatorUserId,
  );
  return id;
}

/**
 * 获取组织当前积分余额（从流水汇总）
 */
export async function getOrgPoints(
  db: D1Database,
  organizationId: string,
): Promise<{ available: number; frozen: number }> {
  const row = await queryFirst<{ available: number; frozen: number }>(
    db,
    `SELECT
       COALESCE(SUM(CASE WHEN change_type IN ('award', 'adjust', 'release') THEN points_change
                         WHEN change_type IN ('deduct', 'revoke') THEN -points_change
                         ELSE 0 END), 0) AS available,
       COALESCE(SUM(CASE WHEN change_type = 'freeze' THEN frozen_change
                         WHEN change_type IN ('release', 'deduct') THEN -frozen_change
                         ELSE 0 END), 0) AS frozen
     FROM points_ledger WHERE organization_id = ?`,
    organizationId,
  );
  return row ?? { available: 0, frozen: 0 };
}
