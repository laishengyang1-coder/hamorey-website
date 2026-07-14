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

const PASSWORD_ITERATIONS = 100_000;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function derivePassword(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt.buffer as ArrayBuffer, iterations },
    key,
    256,
  );
  return new Uint8Array(bits);
}

/** Create a salted password hash while keeping the existing TEXT database column. */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const derived = await derivePassword(password, salt, PASSWORD_ITERATIONS);
  return `pbkdf2$${PASSWORD_ITERATIONS}$${bytesToBase64(salt)}$${bytesToBase64(derived)}`;
}

/** Verify PBKDF2 hashes and legacy SHA-256 hashes during migration. */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash.startsWith('pbkdf2$')) return (await sha256(password)) === storedHash;

  const [, iterationsValue, saltValue, hashValue] = storedHash.split('$');
  const iterations = Number(iterationsValue);
  if (!iterations || !saltValue || !hashValue) return false;

  const actual = await derivePassword(password, base64ToBytes(saltValue), iterations);
  const expected = base64ToBytes(hashValue);
  if (actual.length !== expected.length) return false;

  let difference = 0;
  for (let i = 0; i < actual.length; i++) difference |= actual[i] ^ expected[i];
  return difference === 0;
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
                         WHEN change_type IN ('deduct', 'revoke', 'freeze') THEN -points_change
                         ELSE 0 END), 0) AS available,
       COALESCE(SUM(CASE WHEN change_type = 'freeze' THEN frozen_change
                         WHEN change_type IN ('release', 'deduct') THEN -frozen_change
                         ELSE 0 END), 0) AS frozen
     FROM points_ledger WHERE organization_id = ?`,
    organizationId,
  );
  return row ?? { available: 0, frozen: 0 };
}

/** Resolve an address owned by an organization, supporting the mini program's `default` alias. */
export async function resolveOrganizationAddress(
  db: D1Database,
  organizationId: string,
  requestedId: string,
): Promise<{ id: string } | null> {
  if (requestedId === 'default') {
    return queryFirst<{ id: string }>(
      db,
      `SELECT id FROM addresses WHERE organization_id = ? ORDER BY is_default DESC, created_at DESC LIMIT 1`,
      organizationId,
    );
  }
  return queryFirst<{ id: string }>(
    db,
    `SELECT id FROM addresses WHERE id = ? AND organization_id = ?`,
    requestedId,
    organizationId,
  );
}

/** Validate warranty photo ownership and existence before linking files to a record. */
export async function validateWarrantyPhotoKeys(
  bucket: R2Bucket,
  organizationId: string,
  keys: string[],
): Promise<string | null> {
  if (keys.length > 6) return '施工照片最多上传 6 张';
  if (new Set(keys).size !== keys.length) return '施工照片不能重复';

  const prefix = `warranty-photos/${organizationId}/`;
  if (keys.some((key) => !key.startsWith(prefix) || key.includes('..'))) {
    return '施工照片不属于当前门店';
  }

  const objects = await Promise.all(keys.map((key) => bucket.head(key)));
  if (objects.some((object) => !object)) return '部分施工照片不存在，请重新上传';
  return null;
}

// ============================================================
// 第三阶段新增：组织级联删除（清理门店/省代及其关联数据）
// ============================================================

/**
 * 递归级联删除组织及其所有关联数据
 * 适用于总部管理员清理门店/省代数据
 * 注意：此操作会删除质保记录、积分、兑换、质保码划拨等，不可恢复
 */
export async function deleteOrganizationWithDependencies(
  db: D1Database,
  orgId: string,
): Promise<void> {
  const org = await queryFirst<{ id: string; type: string }>(
    db,
    `SELECT id, type FROM organizations WHERE id = ?`,
    orgId,
  );
  if (!org) return;

  // 1. 如果是省代，先递归删除其下所有门店
  if (org.type === 'PROVINCE') {
    const childStores = await queryAll<{ id: string }>(
      db,
      `SELECT id FROM organizations WHERE parent_id = ?`,
      orgId,
    );
    for (const store of childStores) {
      await deleteOrganizationWithDependencies(db, store.id);
    }
  }

  // 2. 删除该组织的用户及其会话
  const users = await queryAll<{ id: string }>(
    db,
    `SELECT id FROM users WHERE organization_id = ?`,
    orgId,
  );
  const userIds = users.map((u) => u.id);
  if (userIds.length > 0) {
    const placeholders = userIds.map(() => '?').join(',');
    await execute(db, `DELETE FROM sessions WHERE user_id IN (${placeholders})`, ...userIds);
    await execute(db, `DELETE FROM users WHERE organization_id = ?`, orgId);
  }

  // 3. 删除门店质保记录及其子表（仅门店/省代都可能有记录，按字段过滤）
  const recordIds = await queryAll<{ id: string }>(
    db,
    `SELECT id FROM warranty_records WHERE store_id = ? OR province_org_id = ?`,
    orgId,
    orgId,
  );
  const recordIdList = recordIds.map((r) => r.id);
  if (recordIdList.length > 0) {
    const placeholders = recordIdList.map(() => '?').join(',');
    await execute(db, `DELETE FROM warranty_photos WHERE warranty_record_id IN (${placeholders})`, ...recordIdList);
    await execute(db, `DELETE FROM warranty_audit_logs WHERE warranty_record_id IN (${placeholders})`, ...recordIdList);
    await execute(db, `DELETE FROM certificate_files WHERE warranty_record_id IN (${placeholders})`, ...recordIdList);
    await execute(db, `DELETE FROM warranty_records WHERE id IN (${placeholders})`, ...recordIdList);
  }

  // 4. 删除积分流水、兑换单及明细、收货地址
  await execute(db, `DELETE FROM points_ledger WHERE organization_id = ?`, orgId);

  const redemptionIds = await queryAll<{ id: string }>(
    db,
    `SELECT id FROM redemptions WHERE organization_id = ?`,
    orgId,
  );
  const redemptionIdList = redemptionIds.map((r) => r.id);
  if (redemptionIdList.length > 0) {
    const placeholders = redemptionIdList.map(() => '?').join(',');
    await execute(db, `DELETE FROM redemption_items WHERE redemption_id IN (${placeholders})`, ...redemptionIdList);
    await execute(db, `DELETE FROM redemptions WHERE id IN (${placeholders})`, ...redemptionIdList);
  }
  await execute(db, `DELETE FROM addresses WHERE organization_id = ?`, orgId);

  // 5. 删除质保码流转记录和质保码归属
  await execute(db, `DELETE FROM code_allocations WHERE from_org_id = ? OR to_org_id = ?`, orgId, orgId);
  await execute(db, `DELETE FROM warranty_codes WHERE owner_org_id = ?`, orgId);

  // 6. 删除门店公开资料
  await execute(db, `DELETE FROM store_public_profiles WHERE organization_id = ?`, orgId);

  // 7. 最后删除组织本身
  await execute(db, `DELETE FROM organizations WHERE id = ?`, orgId);
}
