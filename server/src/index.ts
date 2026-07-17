import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { corsOrigins, env } from './env.js';
import { healthRouter } from './routes/health.js';

const app = express();

app.disable('x-powered-by');
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
app.use(express.json({ limit: '2mb' }));

app.use('/api', healthRouter);

app.use((_req, res) => {
  res.status(404).json({ ok: false, error: '接口不存在' });
});

app.listen(env.PORT, () => {
  console.log(`[hamorey-api] listening on ${env.PORT}`);
});
