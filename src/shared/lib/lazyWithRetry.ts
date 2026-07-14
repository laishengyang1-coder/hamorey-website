// ============================================================
// lazyWithRetry — 部署后 chunk 哈希失配的自愈包装
// 场景：新版本部署后，旧标签页里运行的 React 仍按旧 hash 去
//       import() 一个已被替换的 chunk，会抛
//       "Failed to fetch dynamically imported module"。
// 处理：捕获到 chunk 加载失败时，整页刷新（拉取最新 index.html
//       + 新 hash 资源）一次；用 sessionStorage 保证单次会话
//       最多刷新一次，避免极端情况下死循环。
// ============================================================

import React from 'react';

const RELOAD_FLAG = 'hm_chunk_reload_once';

type AnyComponent = React.ComponentType<any>;

export function lazyWithRetry<T extends AnyComponent>(
  factory: () => Promise<{ default: T }>,
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    try {
      return await factory();
    } catch (err) {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const alreadyReloaded = sessionStorage.getItem(RELOAD_FLAG);
        if (!alreadyReloaded) {
          sessionStorage.setItem(RELOAD_FLAG, '1');
          window.location.reload();
        }
      }
      throw err;
    }
  });
}
