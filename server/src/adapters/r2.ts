import { Readable } from 'node:stream';
import type COS from 'cos-nodejs-sdk-v5';

interface R2HttpMetadata {
  contentType?: string;
  cacheControl?: string;
}

async function toBuffer(body: unknown): Promise<Buffer> {
  if (body == null) return Buffer.alloc(0);
  if (Buffer.isBuffer(body)) return body;
  if (typeof body === 'string') return Buffer.from(body);
  if (body instanceof Uint8Array) return Buffer.from(body);
  if (body instanceof ArrayBuffer) return Buffer.from(body);
  if (body instanceof Blob) return Buffer.from(await body.arrayBuffer());
  if (body instanceof ReadableStream) {
    const reader = body.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
  }
  if (body instanceof Readable) {
    const chunks: Buffer[] = [];
    for await (const chunk of body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
  return Buffer.from(String(body));
}

function cosPromise<T>(fn: (callback: (error: any, data: T) => void) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    fn((error, data) => {
      if (error) reject(error);
      else resolve(data);
    });
  });
}

export class CosR2Bucket {
  constructor(
    private readonly cos: COS,
    private readonly bucket: string,
    private readonly region: string,
  ) {}

  async head(key: string): Promise<{ key: string; httpMetadata: R2HttpMetadata } | null> {
    try {
      const data = await cosPromise<any>((callback) => (this.cos.headObject as any)({
        Bucket: this.bucket,
        Region: this.region,
        Key: key,
      }, callback));
      return {
        key,
        httpMetadata: {
          contentType: data.headers?.['content-type'],
          cacheControl: data.headers?.['cache-control'],
        },
      };
    } catch (error: any) {
      if (error?.statusCode === 404 || error?.code === 'NoSuchKey') return null;
      throw error;
    }
  }

  async get(key: string): Promise<{ key: string; body: Buffer; httpMetadata: R2HttpMetadata } | null> {
    try {
      const data = await cosPromise<any>((callback) => (this.cos.getObject as any)({
        Bucket: this.bucket,
        Region: this.region,
        Key: key,
      }, callback));
      return {
        key,
        body: await toBuffer(data.Body),
        httpMetadata: {
          contentType: data.headers?.['content-type'],
          cacheControl: data.headers?.['cache-control'],
        },
      };
    } catch (error: any) {
      if (error?.statusCode === 404 || error?.code === 'NoSuchKey') return null;
      throw error;
    }
  }

  async put(
    key: string,
    body: unknown,
    options?: { httpMetadata?: R2HttpMetadata; customMetadata?: Record<string, string> },
  ): Promise<{ key: string }> {
    const buffer = await toBuffer(body);
    await cosPromise<any>((callback) => (this.cos.putObject as any)({
      Bucket: this.bucket,
      Region: this.region,
      Key: key,
      Body: buffer,
      ContentType: options?.httpMetadata?.contentType,
      CacheControl: options?.httpMetadata?.cacheControl,
      Metadata: options?.customMetadata,
    }, callback));
    return { key };
  }

  async delete(keys: string | string[]): Promise<void> {
    if (Array.isArray(keys)) {
      await cosPromise<any>((callback) => (this.cos.deleteMultipleObject as any)({
        Bucket: this.bucket,
        Region: this.region,
        Objects: keys.map((Key) => ({ Key })),
      }, callback));
      return;
    }
    await cosPromise<any>((callback) => (this.cos.deleteObject as any)({
      Bucket: this.bucket,
      Region: this.region,
      Key: keys,
    }, callback));
  }
}

export class MissingR2Bucket {
  async head(): Promise<null> {
    return null;
  }

  async get(): Promise<null> {
    return null;
  }

  async put(): Promise<never> {
    throw new Error('COS is not configured');
  }

  async delete(): Promise<void> {}
}
