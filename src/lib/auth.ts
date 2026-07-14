// ============================================================
// 和膜 HAMOREY — 客户端认证工具（SHA-256 + Token 管理）
// 使用 Web Crypto API（浏览器原生支持）
// ============================================================

const TOKEN_KEY = 'hamorey_auth_token';

/** SHA-256 哈希（浏览器端 Web Crypto API） */
export async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** 获取存储的 Token */
export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** 存储 Token */
export function setAuthToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // localStorage unavailable
  }
}

/** 清除 Token */
export function clearAuthToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // noop
  }
}

/** 是否已登录（有 token 即认为已登录） */
export function isLoggedIn(): boolean {
  return getAuthToken() !== null;
}

/** 生成随机 Nonce（用于 CSRF 防护等场景） */
export function generateNonce(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** HMAC-SHA256（用于签名等场景） */
export async function hmacSha256(
  key: string,
  message: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const keyBuffer = encoder.encode(key);
  const msgBuffer = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgBuffer);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
