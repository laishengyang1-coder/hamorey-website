import { createCosClient } from './cos.js';
import { pool } from './db.js';
import { env } from './env.js';
import { createD1Database } from './adapters/d1.js';
import { CosR2Bucket, MissingR2Bucket } from './adapters/r2.js';

export function createCloudflareEnv(): Record<string, unknown> {
  const cos = createCosClient();

  return {
    DB: createD1Database(pool),
    R2: cos && env.COS_BUCKET
      ? new CosR2Bucket(cos, env.COS_BUCKET, env.COS_REGION)
      : new MissingR2Bucket(),
    SITE_URL: env.SITE_URL,
    BRAND_NAME: env.BRAND_NAME,
    R2_PUBLIC_BASE_URL: env.R2_PUBLIC_BASE_URL || '',
    NODE_ENV: env.NODE_ENV,
  };
}

/**
 * 单例：整个进程共享一份 Cloudflare 兼容环境（DB / R2）。
 * function-router 与后台定时任务（自动审核等）都从这里取，
 * 避免重复创建 MySQL 连接池。
 */
export const apiEnv = createCloudflareEnv();
