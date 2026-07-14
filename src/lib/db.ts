// ============================================================
// 和膜 HAMOREY — D1 数据库操作封装
// 用于 Cloudflare Workers (functions/api/*) 环境
// ============================================================

/** D1 数据库绑定接口 */
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
  exec(query: string): Promise<D1ExecResult>;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  all<T = unknown>(): Promise<D1Result<T>>;
  run<T = unknown>(): Promise<D1Result<T>>;
}

export interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  meta?: Record<string, unknown>;
}

export interface D1ExecResult {
  count: number;
  duration: number;
}

/** Cloudflare Pages Function 上下文中的环境变量 */
export interface AppEnv {
  DB: D1Database;
  R2: R2Bucket;
  SITE_URL: string;
  BRAND_NAME: string;
}

// ============================================================
// 查询工具函数
// ============================================================

/**
 * 执行单条查询并返回第一行结果
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
 * 执行 INSERT/UPDATE/DELETE 并返回元数据
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
 * 生成 UUID（Cloudflare Workers 环境兼容）
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * 构建分页 SQL 片段
 */
export function paginationClause(page: number, pageSize: number): { offset: number; limit: number; clause: string } {
  const offset = (page - 1) * pageSize;
  const limit = pageSize;
  return {
    offset,
    limit,
    clause: `LIMIT ${limit} OFFSET ${offset}`,
  };
}

/**
 * 安全的 LIKE 查询参数（转义 % 和 _）
 */
export function escapeLike(input: string): string {
  return input.replace(/[%_\\]/g, '\\$&');
}
