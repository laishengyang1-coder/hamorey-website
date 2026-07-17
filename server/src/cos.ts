import COS from 'cos-nodejs-sdk-v5';
import { env } from './env.js';

export function hasCosConfig(): boolean {
  return Boolean(env.COS_SECRET_ID && env.COS_SECRET_KEY && env.COS_BUCKET && env.COS_REGION);
}

export function createCosClient(): COS | null {
  if (!hasCosConfig()) return null;

  return new COS({
    SecretId: env.COS_SECRET_ID,
    SecretKey: env.COS_SECRET_KEY,
  });
}
