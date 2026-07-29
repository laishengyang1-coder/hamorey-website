import cors from 'cors';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { corsOrigins, env } from './env.js';
import { handleFunctionRequest } from './function-router.js';
import { healthRouter } from './routes/health.js';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', env.TRUST_PROXY_HOPS);
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || corsOrigins.length === 0 || corsOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('CORS origin is not allowed'));
  },
}));

const loginRateLimiter = rateLimit({
  windowMs: env.LOGIN_RATE_LIMIT_WINDOW_MS,
  limit: env.LOGIN_RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: (request) => request.method === 'OPTIONS',
  handler: (_request, response) => {
    response.status(429).json({
      ok: false,
      error: '登录尝试过于频繁，请稍后再试',
      message: '登录尝试过于频繁，请稍后再试',
    });
  },
});

// Login is public by design, so protect it separately from authenticated APIs.
app.use('/api/auth/login', loginRateLimiter);
app.use('/api', healthRouter);
app.use('/api', handleFunctionRequest);

app.use(express.json({ limit: '2mb' }));

app.use((_req, res) => {
  res.status(404).json({ ok: false, error: '接口不存在' });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[hamorey-api] request failed', err);
  res.status(500).json({ ok: false, error: '服务器内部错误' });
});

app.listen(env.PORT, () => {
  console.log(`[hamorey-api] listening on ${env.PORT}`);
});
