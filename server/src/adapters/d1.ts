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

function rewriteScalarMinMax(sql: string): string {
  const functionPattern = /\b(MIN|MAX)\s*\(/gi;
  let result = '';
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = functionPattern.exec(sql)) !== null) {
    const openParen = functionPattern.lastIndex - 1;
    let depth = 1;
    let quote = '';
    let hasTopLevelComma = false;
    let index = openParen + 1;

    for (; index < sql.length && depth > 0; index += 1) {
      const char = sql[index];
      if (quote) {
        if (char === quote && sql[index - 1] !== '\\') quote = '';
        continue;
      }
      if (char === '\'' || char === '"' || char === '`') {
        quote = char;
      } else if (char === '(') {
        depth += 1;
      } else if (char === ')') {
        depth -= 1;
      } else if (char === ',' && depth === 1) {
        hasTopLevelComma = true;
      }
    }

    if (!hasTopLevelComma || depth !== 0) continue;
    result += sql.slice(cursor, match.index);
    result += match[1].toUpperCase() === 'MIN' ? 'LEAST(' : 'GREATEST(';
    result += sql.slice(openParen + 1, index);
    cursor = index;
    functionPattern.lastIndex = index;
  }

  return result ? result + sql.slice(cursor) : sql;
}

function rewriteInsertSyntax(sql: string): string {
  return sql.replace(/INSERT\s+OR\s+IGNORE/gi, 'INSERT IGNORE');
}

function rewriteCollations(sql: string): string {
  // Imported TencentDB tables already use a case-insensitive utf8mb4 collation.
  return sql.replace(/\s+COLLATE\s+NOCASE\b/gi, '');
}

function rewriteSystemSettingKey(sql: string): string {
  if (!/\bsystem_settings\b/i.test(sql)) return sql;
  return sql
    .replace(/\bORDER\s+BY\s+key\b/gi, 'ORDER BY `key`')
    .replace(/\bWHERE\s+key\b/gi, 'WHERE `key`')
    .replace(/\bSET\s+key\b/gi, 'SET `key`');
}

function normalizeSql(sql: string): string {
  return rewriteSystemSettingKey(
    rewriteCollations(
      rewriteInsertSyntax(rewriteScalarMinMax(rewriteJsonAggregates(rewriteDateFunctions(sql)))),
    ),
  );
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

function inlinePaginationParams(sql: string, params: unknown[]): { sql: string; params: unknown[] } {
  const placeholderPositions: number[] = [];
  let quote = '';

  for (let index = 0; index < sql.length; index += 1) {
    const char = sql[index];
    if (quote) {
      if (char === quote && sql[index - 1] !== '\\') quote = '';
      continue;
    }
    if (char === '\'' || char === '"' || char === '`') {
      quote = char;
      continue;
    }
    if (char === '?') placeholderPositions.push(index);
  }

  let nextSql = sql;
  const nextParams = [...params];
  for (let index = placeholderPositions.length - 1; index >= 0; index -= 1) {
    const position = placeholderPositions[index];
    const prefix = sql.slice(0, position);
    if (!/\b(?:LIMIT|OFFSET)\s*$/i.test(prefix)) continue;

    const value = Number(params[index]);
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error('Pagination parameters must be non-negative integers');
    }

    nextSql = `${nextSql.slice(0, position)}${value}${nextSql.slice(position + 1)}`;
    nextParams.splice(index, 1);
  }

  return { sql: nextSql, params: nextParams };
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

  get execution(): { sql: string; params: unknown[] } {
    return inlinePaginationParams(this.sql, this.params);
  }

  async first<T = Record<string, unknown>>(): Promise<T | null> {
    const { sql, params } = this.execution;
    const [rows] = await this.executor.execute<RowDataPacket[]>(sql, params as ExecuteParams);
    return (rows[0] as T | undefined) ?? null;
  }

  async all<T = Record<string, unknown>>(): Promise<{ results: T[] }> {
    const { sql, params } = this.execution;
    const [rows] = await this.executor.execute<RowDataPacket[]>(sql, params as ExecuteParams);
    return { results: rows as T[] };
  }

  async run(): Promise<D1RunResult> {
    const { sql, params } = this.execution;
    const [result] = await this.executor.execute<ResultSetHeader>(sql, params as ExecuteParams);
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
        const { sql, params } = statement.execution;
        const [result] = await connection.execute<ResultSetHeader>(sql, params as ExecuteParams);
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
