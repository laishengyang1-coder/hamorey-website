// ============================================================
// 和膜 HAMOREY — Cloudflare Pages Functions 全局中间件
// 第二阶段增强：CORS + 认证（Auth）+ 角色权限（RBAC）
// ============================================================

import {
  validateSession,
  cleanExpiredSessions,
  type AuthContext,
} from './_lib';

interface Env {
  DB: D1Database;
  R2: R2Bucket;
  SITE_URL: string;
  BRAND_NAME: string;
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// ============================================================
// 公开路由匹配（不需要认证）
// ============================================================
const PUBLIC_PATHS = new Set([
  '/api/auth/login',
  '/api/stores',
  '/api/warranty-search',
  '/api/partner-leads',
  '/api/contact',
  '/api/health',
]);

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.has(pathname) || pathname.startsWith('/api/public/');
}

// ============================================================
// 角色路由映射
// ============================================================
const ROLE_PATH_MAP: Array<{ prefix: string; role: string }> = [
  { prefix: '/api/admin/', role: 'HQ_ADMIN' },
  { prefix: '/api/province/', role: 'PROVINCE' },
  { prefix: '/api/store/', role: 'STORE' },
];

// ============================================================
// 扩展 Data 类型以包含认证上下文
// ============================================================
declare global {
  interface PagesFunctionData {
    currentUser?: AuthContext;
  }
}

// ============================================================
// 响应工具函数
// ============================================================

/** JSON 响应工具 */
export function jsonResponse(
  data: unknown,
  status: number = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
    ...CORS_HEADERS,
    ...extraHeaders,
  };
  return new Response(JSON.stringify(data), { status, headers });
}

/** 成功响应 */
export function ok<T>(data: T, message: string = ''): Response {
  return jsonResponse({ code: 'OK', message, data });
}

/** 错误响应 */
export function error(
  message: string,
  status: number = 400,
  data: unknown = null,
): Response {
  return jsonResponse({ code: 'ERROR', message, data }, status);
}

/** 校验错误响应 */
export function validationError(
  errors: Array<{ field: string; message: string }>,
): Response {
  return jsonResponse(
    {
      code: 'ERROR',
      message: '输入校验失败',
      data: { errors },
    },
    400,
  );
}

/** 获取客户端 IP */
export function getClientIP(request: { headers: { get(name: string): string | null } }): string {
  const headers = request.headers;
  return (
    headers.get('CF-Connecting-IP') ||
    headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

// ============================================================
// Pages Functions 中间件
// ============================================================

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
};

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 处理 CORS 预检
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  try {
    // === 认证检查 ===
    // 公开路由直接放行
    if (isPublicPath(pathname)) {
      // 对于公开 API，仍然尝试解析 token（方便 API 内部按需使用）
      const authHeader = request.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        const user = await validateSession(env.DB, token);
        if (user) {
          context.data.currentUser = user;
        }
      }
      return await context.next();
    }

    // 后台 API 路由：必须认证
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonResponse(
        { code: 'ERROR', message: '未登录，请先登录', data: null },
        401,
      );
    }

    const token = authHeader.slice(7);
    if (!token) {
      return jsonResponse(
        { code: 'ERROR', message: '认证令牌无效', data: null },
        401,
      );
    }

    const user = await validateSession(env.DB, token);
    if (!user) {
      return jsonResponse(
        {
          code: 'ERROR',
          message: '登录已过期，请重新登录',
          data: null,
        },
        401,
      );
    }

    // === 角色权限检查 ===
    const roleEntry = ROLE_PATH_MAP.find((e) => pathname.startsWith(e.prefix));
    if (roleEntry && user.role !== roleEntry.role) {
      return jsonResponse(
        {
          code: 'ERROR',
          message: `无权限访问（需要 ${roleEntry.role} 角色）`,
          data: null,
        },
        403,
      );
    }

    // 注入认证上下文
    context.data.currentUser = user;

    // 继续执行后续路由处理
    const response = await context.next();

    // 为所有 API 响应添加 CORS 头
    const newHeaders = new Headers(response.headers);
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  } catch (err) {
    console.error('[API Error]', err);
    return error('服务器内部错误，请稍后重试', 500);
  }
};
