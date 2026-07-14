// ============================================================
// useAuth — 认证状态 Hook
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import type { AuthUser } from '../../lib/api';
import { fetchMe, logout, getToken, clearToken } from '../../lib/api';

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  // 初始化：检查 token 并验证
  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!getToken()) {
        if (!cancelled) setState({ user: null, loading: false, error: null });
        return;
      }

      try {
        const user = await fetchMe();
        if (!cancelled) {
          setState({ user, loading: false, error: null });
        }
      } catch {
        clearToken();
        if (!cancelled) {
          setState({ user: null, loading: false, error: null });
        }
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  const doLogin = useCallback(async (username: string, password: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { login } = await import('../../lib/api');
      const result = await login(username, password);
      setState({ user: result.user, loading: false, error: null });
      return result.user;
    } catch (err) {
      const msg = err instanceof Error ? err.message : '登录失败';
      setState((s) => ({ ...s, loading: false, error: msg }));
      throw err;
    }
  }, []);

  const doLogout = useCallback(async () => {
    try {
      await logout();
    } finally {
      setState({ user: null, loading: false, error: null });
    }
  }, []);

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    login: doLogin,
    logout: doLogout,
    isAuthenticated: state.user !== null,
  };
}
