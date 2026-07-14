// ============================================================
// useApi — 通用 API 请求 Hook（含 loading/error/data）
// ============================================================

import { useState, useCallback, useRef } from 'react';
import { ApiError } from '../../lib/api';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T, P extends unknown[]> extends UseApiState<T> {
  execute: (...args: P) => Promise<T | null>;
  reset: () => void;
}

/**
 * 通用 API 请求 Hook
 * @param fn 异步请求函数
 */
export function useApi<T, P extends unknown[] = []>(
  fn: (...args: P) => Promise<T>,
): UseApiReturn<T, P> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const execute = useCallback(async (...args: P): Promise<T | null> => {
    setState({ data: null, loading: true, error: null });
    try {
      const result = await fnRef.current(...args);
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (err) {
      const msg = err instanceof ApiError
        ? err.message
        : err instanceof Error ? err.message : '请求失败';
      setState({ data: null, loading: false, error: msg });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}
