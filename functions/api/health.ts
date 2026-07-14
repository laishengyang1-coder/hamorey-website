// ============================================================
// 和膜 HAMOREY — 健康检查 API
// GET /api/health
// ============================================================

interface Env {
  DB: D1Database;
  R2: R2Bucket;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;
  const timestamp = new Date().toISOString();

  let dbStatus: 'ok' | 'error' = 'ok';

  if (env.DB) {
    try {
      await env.DB.prepare('SELECT 1 as test').first();
    } catch {
      dbStatus = 'error';
    }
  } else {
    dbStatus = 'error';
  }

  const status = dbStatus === 'ok' ? 'ok' : 'degraded';

  return new Response(
    JSON.stringify({
      code: 'OK',
      message: '',
      data: {
        status,
        timestamp,
        services: {
          db: dbStatus,
        },
      },
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
    },
  );
};
