import { Router } from 'express';
import { createCosClient, hasCosConfig } from '../cos.js';
import { pingDatabase } from '../db.js';
import { env } from '../env.js';

export const healthRouter = Router();

healthRouter.get('/health', async (_req, res) => {
  const checks: Record<string, 'ok' | 'missing' | 'error'> = {
    api: 'ok',
    mysql: 'ok',
    cos: hasCosConfig() ? 'ok' : 'missing',
  };

  try {
    await pingDatabase();
  } catch (error) {
    checks.mysql = 'error';
  }

  if (hasCosConfig()) {
    const cos = createCosClient();
    checks.cos = cos ? 'ok' : 'error';
  }

  const healthy = checks.mysql === 'ok';
  res.status(healthy ? 200 : 503).json({
    ok: healthy,
    service: 'hamorey-api',
    env: env.NODE_ENV,
    checks,
    time: new Date().toISOString(),
  });
});
