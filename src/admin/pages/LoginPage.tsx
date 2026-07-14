// ============================================================
// Admin LoginPage — 总部后台登录页（复用 RoleLogin）
// ============================================================

import { RoleLogin } from '../../shared/components/RoleLogin';

export default function LoginPage() {
  return (
    <RoleLogin
      roleIcon="和"
      roleTitle="总部管理"
      roleSubtitle="请使用总部管理员账号登录"
      redirectTo="/admin/dashboard"
    />
  );
}
