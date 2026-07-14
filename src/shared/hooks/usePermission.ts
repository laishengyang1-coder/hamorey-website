// ============================================================
// usePermission — 权限检查 Hook
// ============================================================

import { useMemo } from 'react';
import { useAuth } from './useAuth';

export type AppRole = 'HQ_ADMIN' | 'PROVINCE' | 'STORE';

export function usePermission() {
  const { user } = useAuth();

  const role = useMemo<AppRole | null>(() => {
    return (user?.role as AppRole) ?? null;
  }, [user]);

  const isHQAdmin = role === 'HQ_ADMIN';
  const isProvince = role === 'PROVINCE';
  const isStore = role === 'STORE';

  const canAccess = useMemo(() => {
    return {
      admin: isHQAdmin,
      province: isProvince || isHQAdmin,
      store: true,
    };
  }, [isHQAdmin, isProvince, isStore]);

  return { role, isHQAdmin, isProvince, isStore, canAccess };
}
