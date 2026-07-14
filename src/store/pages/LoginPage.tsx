// ============================================================
// Store LoginPage — 门店后台登录页（复用 RoleLogin）
// ============================================================

import { RoleLogin } from '../../shared/components/RoleLogin';

export default function LoginPage() {
  return (
    <RoleLogin
      roleIcon="店"
      roleTitle="门店管理中心"
      roleSubtitle="请使用门店账号登录"
      redirectTo="/store/dashboard"
    />
  );
}
