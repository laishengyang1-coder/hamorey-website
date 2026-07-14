// ============================================================
// Province LoginPage — 省代后台登录页（复用 RoleLogin）
// ============================================================

import { RoleLogin } from '../../shared/components/RoleLogin';

export default function LoginPage() {
  return (
    <RoleLogin
      roleIcon="省"
      roleTitle="省代管理中心"
      roleSubtitle="请使用省代账号登录"
      redirectTo="/province/dashboard"
    />
  );
}
