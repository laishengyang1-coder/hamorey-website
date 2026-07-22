import type { NextFunction, Request as ExpressRequest, Response as ExpressResponse } from 'express';
import * as apiMiddleware from '../../functions/api/_middleware.ts';
import { createCloudflareEnv } from './cloudflare-env.js';
import { type FunctionRouteDefinition, functionRoutes, type RouteSegment } from './generated/function-routes.js';

type PagesHandler = (context: Record<string, any>) => Promise<Response> | Response;

const apiEnv = createCloudflareEnv();

function splitPath(pathname: string): string[] {
  return pathname.split('/').filter(Boolean);
}

function matchSegment(segment: RouteSegment, value: string): { matched: boolean; name?: string; value?: string } {
  if (segment.kind === 'static') return { matched: segment.value === value };
  if (segment.kind === 'param') return { matched: Boolean(value), name: segment.name, value };
  if (segment.kind === 'embeddedParam') {
    if (!value.startsWith(segment.prefix) || !value.endsWith(segment.suffix)) return { matched: false };
    const start = segment.prefix.length;
    const end = segment.suffix ? value.length - segment.suffix.length : value.length;
    const embeddedValue = value.slice(start, end);
    return { matched: Boolean(embeddedValue), name: segment.name, value: embeddedValue };
  }
  return { matched: false };
}

function matchRoute(pathname: string): { route: FunctionRouteDefinition; params: Record<string, string> } | null {
  const pathSegments = splitPath(pathname).slice(1);

  for (const route of functionRoutes) {
    const params: Record<string, string> = {};
    let cursor = 0;
    let matched = true;

    for (const segment of route.segments) {
      if (segment.kind === 'catchAll') {
        params[segment.name] = pathSegments.slice(cursor).join('/');
        cursor = pathSegments.length;
        break;
      }

      const value = pathSegments[cursor];
      if (!value) {
        matched = false;
        break;
      }

      const result = matchSegment(segment, value);
      if (!result.matched) {
        matched = false;
        break;
      }
      if (result.name && result.value != null) params[result.name] = decodeURIComponent(result.value);
      cursor += 1;
    }

    if (matched && cursor === pathSegments.length) return { route, params };
  }

  return null;
}

async function readBody(req: ExpressRequest): Promise<Buffer | undefined> {
  if (req.method === 'GET' || req.method === 'HEAD') return undefined;

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return chunks.length > 0 ? Buffer.concat(chunks) : undefined;
}

function buildWebRequest(req: ExpressRequest, body: Buffer | undefined): Request {
  const protocol = req.headers['x-forwarded-proto']?.toString().split(',')[0] || req.protocol || 'http';
  const host = req.headers.host || 'localhost';
  const url = `${protocol}://${host}${req.originalUrl}`;
  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item);
      continue;
    }
    headers.set(key, String(value));
  }

  return new Request(url, {
    method: req.method,
    headers,
    body,
    // Required by Node when Request receives a buffered/body stream option.
    duplex: body ? 'half' : undefined,
  } as RequestInit);
}

function chooseHandler(routeModule: Record<string, unknown>, method: string): PagesHandler | null {
  const name = `onRequest${method.charAt(0).toUpperCase()}${method.slice(1).toLowerCase()}`;
  const specific = routeModule[name];
  if (typeof specific === 'function') return specific as PagesHandler;

  const generic = routeModule.onRequest;
  if (typeof generic === 'function') return generic as PagesHandler;

  return null;
}

async function sendWebResponse(res: ExpressResponse, response: Response): Promise<void> {
  res.status(response.status);
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  const body = Buffer.from(await response.arrayBuffer());
  res.send(body);
}

export async function handleFunctionRequest(req: ExpressRequest, res: ExpressResponse, next: NextFunction): Promise<void> {
  try {
    const body = await readBody(req);
    const request = buildWebRequest(req, body);

    if (request.method === 'OPTIONS' && typeof apiMiddleware.onRequestOptions === 'function') {
      await sendWebResponse(res, await apiMiddleware.onRequestOptions({ request } as any));
      return;
    }

    const matched = matchRoute(new URL(request.url).pathname);
    if (!matched) {
      await sendWebResponse(res, new Response(JSON.stringify({ success: false, error: '接口不存在' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      }));
      return;
    }

    const routeHandler = chooseHandler(matched.route.module, request.method);
    if (!routeHandler) {
      await sendWebResponse(res, new Response(JSON.stringify({ success: false, error: '请求方法不支持' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      }));
      return;
    }

    // Cloudflare Pages keeps `context.data` shared between middleware and the
    // route reached through context.next(). Reuse the same object here so the
    // authenticated user injected by _middleware is visible to protected APIs.
    const contextData: Record<string, unknown> = {};
    const routeContext = {
      request,
      env: apiEnv,
      params: matched.params,
      data: contextData,
      waitUntil() {},
      passThroughOnException() {},
    };
    const context = {
      ...routeContext,
      next: () => routeHandler(routeContext),
    };

    const response = typeof apiMiddleware.onRequest === 'function'
      ? await apiMiddleware.onRequest(context as any)
      : await routeHandler(context);

    await sendWebResponse(res, response);
  } catch (error) {
    next(error);
  }
}
