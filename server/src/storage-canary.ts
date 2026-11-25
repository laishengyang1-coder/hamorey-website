import { randomBytes } from 'node:crypto';
import type COS from 'cos-nodejs-sdk-v5';

type CanaryClient = Pick<COS, 'headObject' | 'putObject' | 'getObject' | 'deleteObject'>;
const key = 'monitoring/hamorey-api/cos-read-write-v1.bin';
const mime = 'application/vnd.hamorey.storage-probe';

function versionOf(result: {VersionId?: string; headers?: Record<string, any>}) {
  return result.VersionId || result.headers?.['x-cos-version-id'];
}

// Call under a cross-process lock. An interrupted previous probe is cleaned before any new write.
// Exact-version deletion avoids creating delete markers or retaining historical probe payloads.
export async function probeCanary(cos: CanaryClient, Bucket: string, Region: string) {
  const target = { Bucket, Region, Key: key };
  let previous;
  try { previous = await cos.headObject(target); }
  catch (err: any) {
    if (err?.statusCode !== 404 && err?.code !== 'NoSuchKey') throw err;
  }
  if (previous) {
    if (previous.headers?.['content-type'] !== mime) throw new Error('Unexpected object at probe key');
    const previousVersion = { ...target, VersionId: versionOf(previous) };
    await cos.deleteObject(previousVersion);
  }
  const body = randomBytes(16);
  const written = await cos.putObject({ ...target, Body: body, ContentType: mime, CacheControl: 'no-store' });
  const versioned = { ...target, VersionId: versionOf(written) };
  try {
    const read = await cos.getObject(versioned);
    if (!Buffer.isBuffer(read.Body) || !read.Body.equals(body)) throw new Error('Probe contents differ');
  } finally {
    await cos.deleteObject(versioned);
  }
}
