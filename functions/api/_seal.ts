// ============================================================
// _seal.ts — 证书印章图片读取（Node 生产环境，带内存缓存）
// 印章 JPEG 位于服务器本地 /opt/hamorey/assets/seal.jpg；
// 读取失败时返回 null，证书生成降级为无印章（不阻塞审核流程）。
// 注：functions 的 tsconfig 面向 Workers 类型环境，这里用动态模块名
// 绕开静态类型检查（生产运行在 Node server，可正常加载 node:fs）。
// ============================================================

let cachedSeal: Uint8Array | null | undefined;

export async function getCertificateSeal(): Promise<Uint8Array | null> {
  if (cachedSeal !== undefined) return cachedSeal;
  try {
    const moduleName = 'node:' + 'fs';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fs: any = await import(moduleName);
    const g = globalThis as unknown as { process?: { env?: Record<string, string | undefined> } };
    const path = g.process?.env?.CERT_SEAL_PATH || '/opt/hamorey/assets/seal.jpg';
    cachedSeal = fs.readFileSync(path) as Uint8Array;
  } catch {
    cachedSeal = null;
  }
  return cachedSeal ?? null;
}
