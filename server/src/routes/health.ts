import { Router } from 'express';
import { env } from '../env.js';
import { getServiceHealth } from '../service-health.js';

export const healthRouter = Router();

healthRouter.get('/health', async (_req, res, next) => {
  try {
    const result = await getServiceHealth();
    res.status(result.ok ? 200 : 503).set('Cache-Control', 'no-store').json({
      ...result, service: 'hamorey-api', env: env.NODE_ENV, time: new Date().toISOString(),
    });
  } catch (err) { next(err); }
});
