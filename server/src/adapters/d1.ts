import type { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

type QueryExecutor = Pool | PoolConnection;
type ExecuteParams = any[];

interface D1RunResult {
  success: boolean;
  meta: {
    changes: number;
    last_row_id: number;
  };
}

function rewriteDateFunctions(sql: string): string {
  return sql
    .replace(/datetime\('now'\s*,\s*'-(\d+)\s+days?'\)/gi, 'DATE_SUB(NOW(), INTERVAL $1 DAY)')
    .replace(/datetime\('now'\)/gi, 'NOW()')
    .replace(/date\('now'\)/gi, 'CURDATE()');
}

function rewriteJsonAggregates(sql: string): string {
  return sql
    .replace(/json_group_array\s*\(/gi, 'JSON_ARRAYAGG(')
    .replace(/json_object\s*\(/gi, 'JSON_OBJECT(');
}

function rewriteInsertSyntax(sql: string): string {
  return sql.replace(/INSERT\s+OR\s+IGNORE/gi, 'INSERT IGNORE');
}

function rewriteSystemSettingKey(sql: string): string {
  if (!/\bsystem_settings\b/i.test(sql)) return sql;
  return sql
    .replace(/\bORDER\s+BY\s+key\b/gi, 'ORDER BY `key`')
    .replace(/\bWHERE\s+key\b/gi, 'WHERE `key`')
    .replace(/\bSET\s+key\b/gi, 'SET `key`');
}

function normalizeSql(sql: string): string {
  return rewriteSystemSettingKey(rewriteInsertSyntax(rewriteJsonAggregates(rewriteDateFunctions(sql))));
}

function normalizeDateTimeParam(value: string): string {
  const match = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})(?:\.\d+)?Z?$/);
  if (!match) return value;
  return `${match[1]} ${match[2]}`;
}

function normalizeParams(params: unknown[]): unknown[] {
  return params.map((value) => {
    if (value === undefined) return null;
    if (typeof value === 'boolean') return value ? 1 : 0;
    if (typeof value === 'string') return normalizeDateTimeParam(value);
    return value;
  });
}

export class MySqlD1PreparedStatement {
  private params: unknown[] = [];

  constructor(
    private readonly executor: QueryExecutor,
    private readonly rawSql: string,
  ) {}

  bind(...params: unknown[]): MySqlD1PreparedStatement {
    const next = new MySqlD1PreparedStatement(this.executor, this.rawSql);
    next.params = normalizeParams(params);
    return next;
  }

  get sql(): string {
    return normalizeSql(this.rawSql);
  }

  get values(): unknown[] {
    return this.params;
  }

  async first<T = Record<string, unknown>>(): Promise<T | null> {
    const [rows] = await this.executor.execute<RowDataPacket[]>(this.sql, this.params as ExecuteParams);
    return (rows[0] as T | undefined) ?? null;
  }

  async all<T = Record<string, unknown>>(): Promise<{ results: T[] }> {
    const [rows] = await this.executor.execute<RowDataPacket[]>(this.sql, this.params as ExecuteParams);
    return { results: rows as T[] };
  }

  async run(): Promise<D1RunResult> {
    const [result] = await this.executor.execute<ResultSetHeader>(this.sql, this.params as ExecuteParams);
    return {
      success: true,
      meta: {
        changes: result.affectedRows ?? 0,
        last_row_id: result.insertId ?? 0,
      },
    };
  }
}

export class MySqlD1Database {
  constructor(private readonly pool: Pool) {}

  prepare(sql: string): MySqlD1PreparedStatement {
    return new MySqlD1PreparedStatement(this.pool, sql);
  }

  async batch(statements: MySqlD1PreparedStatement[]): Promise<D1RunResult[]> {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const results: D1RunResult[] = [];
      for (const statement of statements) {
        const [result] = await connection.execute<ResultSetHeader>(statement.sql, statement.values as ExecuteParams);
        results.push({
          success: true,
          meta: {
            changes: result.affectedRows ?? 0,
            last_row_id: result.insertId ?? 0,
          },
        });
      }
      await connection.commit();
      return results;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

export function createD1Database(pool: Pool): D1Database {
  return new MySqlD1Database(pool) as unknown as D1Database;
}
