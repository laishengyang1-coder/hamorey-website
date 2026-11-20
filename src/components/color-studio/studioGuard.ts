// ============================================================
// 和膜 HAMOREY — 选色工坊运行期域名授权校验、加密资产解包与防扒护盾
// ============================================================

import { useEffect, useState } from 'react';
import type { ColorFilmItem } from '../../config/colorStudio';

// FNV-1a 32-bit 授权域名指纹（不含明文域名字符串，防全局搜索替换）
const AUTH_HASHES = new Set<number>([
  0x4ab1d77b, // 主站根域
  0x1b43659e, // 海外站根域
  0x0150773a, // 本地调试
  0x08a3d11e, // 本地回环
]);

function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function nextXorByte(st: { s: number }): number {
  let x = st.s >>> 0;
  x ^= (x << 13) >>> 0;
  x ^= x >>> 17;
  x ^= (x << 5) >>> 0;
  st.s = x >>> 0;
  return st.s & 0xff;
}

export function isStudioHostAuthorized(): boolean {
  if (typeof window === 'undefined') return true;
  const host = (window.location.hostname || '').trim().toLowerCase();
  if (!host) return true;
  if (AUTH_HASHES.has(fnv1a(host))) return true;
  const parts = host.split('.');
  if (parts.length >= 2) {
    const root = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
    if (AUTH_HASHES.has(fnv1a(root))) return true;
  }
  return false;
}

export function decodeSwatchVault(chunks: readonly string[]): ColorFilmItem[] {
  const authorized = isStudioHostAuthorized();
  const b64 = chunks.join('');
  const binStr = globalThis.atob(b64);
  const len = binStr.length;
  const bytes = new Uint8Array(len);
  const st = { s: authorized ? 0x484d5259 : 0xdeadbeef };

  for (let i = 0; i < len; i++) {
    const enc = binStr.charCodeAt(i) & 0xff;
    const unrot = ((enc >>> 3) | (enc << 5)) & 0xff;
    bytes[i] = unrot ^ nextXorByte(st);
  }

  if (!authorized) {
    return [
      {
        id: 'locked',
        code: 'LOCKED',
        name: '未授权克隆副本',
        nameEn: 'Unauthorized Clone',
        finish: 'crystal',
        finishLabel: '受保护',
        finishLabelEn: 'Protected',
        seriesName: 'HAMOREY PROPRIETARY',
        seriesNameEn: 'HAMOREY PROPRIETARY',
        hex: '#1A1B1E',
        hue: 0,
        hueGroup: 'neutral',
        isNeutral: true,
        tagline: '本 3D 选色系统与色库归和膜 HAMOREY 专有，仅限官方授权域名运行。',
        taglineEn: 'Proprietary HAMOREY 3D Color Studio. Authorized domains only.',
        optics: { gloss: 0, metallic: 0, shift: 0 },
        material: {
          metalness: 0.1,
          roughness: 0.5,
          clearcoat: 0.2,
          clearcoatRoughness: 0.4,
          flakeIntensity: 0,
          iridescence: 0,
          iridescenceIOR: 1.3,
          sheenIntensity: 0,
        },
      },
    ];
  }

  const json = new TextDecoder('utf-8').decode(bytes);
  return JSON.parse(json) as ColorFilmItem[];
}

export function unpackHmyModelBuffer(raw: ArrayBuffer): ArrayBuffer {
  if (!isStudioHostAuthorized()) {
    throw new Error('Unauthorized host');
  }
  const src = new Uint8Array(raw);
  // 校验 8 字节 "HMRY\x01\x00&\x11" 容器头
  if (
    src.length < 28 ||
    src[0] !== 0x48 ||
    src[1] !== 0x4d ||
    src[2] !== 0x52 ||
    src[3] !== 0x59
  ) {
    throw new Error('Invalid HMRY container');
  }

  const outLen = src.length - 8;
  const out = new Uint8Array(outLen);
  out.set(src.subarray(8));

  const limit = Math.min(outLen, 65536);
  const st = { s: 0x7a39c4e1 };
  for (let i = 0; i < limit; i++) {
    out[i] ^= nextXorByte(st);
  }
  return out.buffer;
}

/**
 * 综合检测微信小程序 <web-view> 环境（兼容 URL 参数、UA 与异步注入的 __wxjs_environment）
 */
export function useWeChatMiniProgramEmbed(paramEmbed: boolean): boolean {
  const [isMini, setIsMini] = useState<boolean>(() => {
    if (paramEmbed) return true;
    if (typeof window === 'undefined') return false;
    const wxEnv = (window as Window & { __wxjs_environment?: string }).__wxjs_environment;
    if (wxEnv === 'miniprogram') return true;
    return /miniProgram/i.test(window.navigator.userAgent || '');
  });

  useEffect(() => {
    if (paramEmbed) {
      setIsMini(true);
      return;
    }
    const check = () => {
      const wxEnv = (window as Window & { __wxjs_environment?: string }).__wxjs_environment;
      if (wxEnv === 'miniprogram' || /miniProgram/i.test(window.navigator.userAgent || '')) {
        setIsMini(true);
      }
    };
    check();
    document.addEventListener('WeixinJSBridgeReady', check);
    return () => document.removeEventListener('WeixinJSBridgeReady', check);
  }, [paramEmbed]);

  return isMini;
}

/**
 * 生产环境防右键审查、防页面另存为与防快捷键扒取（放行带 data-allow-save 的选色卡长按保存）
 */
export function useStudioProtectionShield(): boolean {
  const authorized = isStudioHostAuthorized();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const host = (window.location.hostname || '').toLowerCase();
    const isLocal = fnv1a(host) === 0x0150773a || fnv1a(host) === 0x08a3d11e;
    if (isLocal) return;

    const onContextMenu = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (target?.closest?.('[data-allow-save="true"]')) return;
      e.preventDefault();
    };

    const onDragStart = (e: DragEvent) => {
      const target = e.target as Element | null;
      if (target?.closest?.('[data-allow-save="true"]')) return;
      e.preventDefault();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const ctrlOrMeta = e.ctrlKey || e.metaKey;
      // 拦截 F12、Ctrl/Cmd+S（保存网页）、Ctrl/Cmd+U（查看源码）、Ctrl/Cmd+Shift/Alt+I/J/C
      if (
        e.key === 'F12' ||
        (ctrlOrMeta && (key === 's' || key === 'u')) ||
        (ctrlOrMeta && (e.shiftKey || e.altKey) && (key === 'i' || key === 'j' || key === 'c'))
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('dragstart', onDragStart);
    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('dragstart', onDragStart);
      window.removeEventListener('keydown', onKeyDown, true);
    };
  }, []);

  return authorized;
}
