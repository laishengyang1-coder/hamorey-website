// ============================================================
// SPA fallback: 所有未被具体 API Function 匹配的路由 → index.html
// 优先级最低，具体路由（如 /api/admin/*）优先匹配
// ============================================================

interface Env {
  ASSETS: { fetch: (req: Request) => Promise<Response> };
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  // 尝试从静态资源服务请求
  const response = await env.ASSETS.fetch(request);
  if (response.status === 404) {
    // SPA 回退：未知路由返回 index.html，由 React Router 处理
    return env.ASSETS.fetch(new URL('/index.html', request.url));
  }
  return response;
};
