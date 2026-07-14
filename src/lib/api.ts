// ============================================================
// 和膜 HAMOREY — 前端 fetch 封装
// 第二阶段增强：Auth Token 管理
// ============================================================

import type {
  ApiResponse,
  StoreQueryParams,
  StoreQueryResult,
  PartnerLeadCreateRequest,
  PartnerLeadCreateResult,
  WarrantyQueryRequest,
  WarrantyQueryResult,
  ContactSubmitRequest,
  ContactSubmitResult,
  HealthCheckResult,
} from '../types/api';

/** API 基础路径 */
const API_BASE = '/api';

/** 请求超时（毫秒） */
const REQUEST_TIMEOUT = 30000;

// ============================================================
// Token 管理
// ============================================================

const TOKEN_KEY = 'hamorey_auth_token';

function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // localStorage unavailable (e.g., private browsing in some env)
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // noop
  }
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}

// ============================================================
// Type for extended request options
// ============================================================

interface RequestOptions extends RequestInit {
  /** Skip auth header (for login, public endpoints) */
  skipAuth?: boolean;
}

// ============================================================
// Auth State
// ============================================================

export interface AuthUser {
  id: string;
  username: string;
  role: string;
  organization: {
    id: string;
    name: string;
    type: string;
    province?: string;
    city?: string;
  };
}

export interface LoginResult {
  token: string;
  expiresAt: string;
  user: AuthUser;
}

// ============================================================
// 自定义 API 错误
// ============================================================

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// ============================================================
// 统一 fetch 封装（增强版）
// ============================================================

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  // 自动附加 Content-Type（非 FormData）
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // 自动附加 Authorization header
  if (!options.skipAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const requestUrl = /^https?:\/\//.test(path) ? path : `${API_BASE}${path}`;
    const response = await fetch(requestUrl, {
      ...options,
      signal: controller.signal,
      headers,
    });

    if (response.status === 401) {
      clearToken();
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      throw new ApiError(body?.message || '登录已过期，请重新登录', 401, body);
    }

    if (response.status === 403) {
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      throw new ApiError(body?.message || '无权限访问', 403, body);
    }

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => null)) as { message?: string } | null;
      const message = errorBody?.message || `请求失败 (${response.status})`;
      throw new ApiError(message, response.status, errorBody);
    }

    const body: ApiResponse<T> = await response.json();
    if (body.code !== 'OK') {
      throw new ApiError(body.message || '请求失败', response.status, body.data);
    }

    return body.data;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============================================================
// Auth API
// ============================================================

/** 登录 */
export async function login(username: string, password: string): Promise<LoginResult> {
  const result = await request<LoginResult>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
    skipAuth: true,
  });
  setToken(result.token);
  return result;
}

/** 获取当前用户 */
export async function fetchMe(): Promise<AuthUser> {
  return request<AuthUser>('/auth/me', { method: 'GET' });
}

/** 登出 */
export async function logout(): Promise<void> {
  try {
    await request('/auth/logout', { method: 'POST' });
  } finally {
    clearToken();
  }
}

export interface WarrantyPhotoUploadResult {
  fileKey: string;
  size: number;
  contentType: string;
}

/** Upload a warranty photo to the same R2 bucket used by the mini program. */
export async function uploadWarrantyPhoto(file: File): Promise<WarrantyPhotoUploadResult> {
  const uploadTarget = await request<{ uploadUrl: string; fileKey: string }>('/store/upload-url', {
    method: 'POST',
    body: JSON.stringify({ fileName: file.name, contentType: file.type }),
  });
  const form = new FormData();
  form.append('file', file, file.name);
  return request<WarrantyPhotoUploadResult>(uploadTarget.uploadUrl, {
    method: 'POST',
    body: form,
  });
}

// ============================================================
// 原有公开 API 方法（保持兼容）
// ============================================================

/**
 * 质保查询
 */
export async function searchWarranty(
  params: WarrantyQueryRequest,
): Promise<WarrantyQueryResult> {
  return request<WarrantyQueryResult>('/warranty-search', {
    method: 'POST',
    body: JSON.stringify(params),
    skipAuth: true,
  });
}

/**
 * 质保查询（GET 方式）
 */
export async function searchWarrantyByQuery(
  query: string,
): Promise<WarrantyQueryResult> {
  return request<WarrantyQueryResult>(
    `/warranty-search?q=${encodeURIComponent(query)}`,
    { method: 'GET', skipAuth: true },
  );
}

/**
 * 门店查询
 */
export async function fetchStores(
  params: StoreQueryParams = {},
): Promise<StoreQueryResult> {
  const searchParams = new URLSearchParams();
  if (params.province) searchParams.set('province', params.province);
  if (params.city) searchParams.set('city', params.city);
  if (params.keyword) searchParams.set('keyword', params.keyword);
  if (params.level) searchParams.set('level', params.level);
  searchParams.set('page', String(params.page ?? 1));
  searchParams.set('pageSize', String(params.pageSize ?? 20));

  return request<StoreQueryResult>(`/stores?${searchParams.toString()}`, {
    method: 'GET',
    skipAuth: true,
  });
}

/**
 * 提交合作申请
 */
export async function submitPartnerLead(
  data: PartnerLeadCreateRequest,
): Promise<PartnerLeadCreateResult> {
  return request<PartnerLeadCreateResult>('/partner-leads', {
    method: 'POST',
    body: JSON.stringify(data),
    skipAuth: true,
  });
}

/**
 * 提交合作咨询
 */
export async function submitContact(
  data: ContactSubmitRequest,
): Promise<ContactSubmitResult> {
  return request<ContactSubmitResult>('/contact', {
    method: 'POST',
    body: JSON.stringify(data),
    skipAuth: true,
  });
}

/**
 * 健康检查
 */
export async function healthCheck(): Promise<HealthCheckResult> {
  return request<HealthCheckResult>('/health', { method: 'GET', skipAuth: true });
}

// ============================================================
// 导出 request 供高级调用
// ============================================================

export { request as apiRequest };
