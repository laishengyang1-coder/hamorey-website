import { useEffect, useState } from 'react';
import { fetchProtectedAsset } from '../../lib/api';

interface ProtectedImageProps {
  fileKey: string;
  alt: string;
  className?: string;
}

export function ProtectedImage({ fileKey, alt, className = '' }: ProtectedImageProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let nextUrl: string | null = null;
    setObjectUrl(null);
    setFailed(false);

    const encodedKey = fileKey.split('/').map(encodeURIComponent).join('/');
    fetchProtectedAsset(`/public/photos/${encodedKey}`)
      .then((blob) => {
        nextUrl = URL.createObjectURL(blob);
        if (active) setObjectUrl(nextUrl);
        else URL.revokeObjectURL(nextUrl);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
      if (nextUrl) URL.revokeObjectURL(nextUrl);
    };
  }, [fileKey]);

  return (
    <a
      href={objectUrl || undefined}
      target={objectUrl ? '_blank' : undefined}
      rel={objectUrl ? 'noreferrer' : undefined}
      onClick={(event) => { if (!objectUrl) event.preventDefault(); }}
      className={`flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-gray-100 transition-colors hover:border-gray-300 ${className}`}
    >
      {objectUrl ? (
        <img src={objectUrl} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <span className="px-2 text-center text-xs text-gray-400">{failed ? '图片加载失败' : '加载中...'}</span>
      )}
    </a>
  );
}
