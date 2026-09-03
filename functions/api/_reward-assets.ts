const STATIC_REWARD_PREFIX = 'static:';

function encodeAssetPath(assetPath: string): string {
  return assetPath.split('/').map(encodeURIComponent).join('/');
}

/**
 * Resolve bundled reward artwork without sending it through the protected
 * object-storage route. Only the known rewards directory is allowed here.
 */
export function getBundledRewardCoverUrl(request: Request, fileKey: unknown): string | null {
  if (typeof fileKey !== 'string' || !fileKey.startsWith(STATIC_REWARD_PREFIX)) return null;

  const assetPath = fileKey.slice(STATIC_REWARD_PREFIX.length);
  if (!/^rewards\/[A-Za-z0-9._-]+$/.test(assetPath)) return null;

  return new URL(`/assets/${encodeAssetPath(assetPath)}`, request.url).toString();
}

export function withRewardCoverUrl<T extends Record<string, unknown>>(request: Request, item: T): T & { cover_url: string | null } {
  return {
    ...item,
    cover_url: getBundledRewardCoverUrl(request, item.cover_file_key) || null,
  };
}
