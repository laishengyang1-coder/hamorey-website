// ============================================================
// SPA fallback: 所有未被具体 API Function 匹配的路由 → index.html
// 优先级最低，具体路由（如 /api/admin/*）优先匹配
// ============================================================

interface Env {
  ASSETS: { fetch: (req: Request) => Promise<Response> };
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const response = await env.ASSETS.fetch(request);

  if (response.status === 404) {
    const isStaticFile = url.pathname.startsWith('/assets/') || /\/[^/]+\.[^/]+$/.test(url.pathname);

    // API 和静态文件缺失时必须保留真实 404，不能返回 HTML。
    if (url.pathname.startsWith('/api/') || isStaticFile) {
      return response;
    }

    return env.ASSETS.fetch(new URL('/index.html', request.url));
  }

  return response;
};
