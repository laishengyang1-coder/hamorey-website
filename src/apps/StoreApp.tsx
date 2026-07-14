// ============================================================
// StoreApp — 门店后台 SPA（/store/*）
// ============================================================

import React, { Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { DashboardLayout, type MenuItem } from '../shared/layouts/DashboardLayout';
import { useAuth } from '../shared/hooks/useAuth';
import { lazyWithRetry } from '../shared/lib/lazyWithRetry';

const LoginPage = lazyWithRetry(() => import('../store/pages/LoginPage'));
const DashboardPage = lazyWithRetry(() => import('../store/pages/DashboardPage'));
const WarrantyRegistrationPage = lazyWithRetry(() => import('../store/pages/WarrantyRegistrationPage'));
const WarrantyRecordListPage = lazyWithRetry(() => import('../store/pages/WarrantyRecordListPage'));
const WarrantyRecordEditPage = lazyWithRetry(() => import('../store/pages/WarrantyRecordEditPage'));
const WarrantyCodeListPage = lazyWithRetry(() => import('../store/pages/WarrantyCodeListPage'));
const RejectedListPage = lazyWithRetry(() => import('../store/pages/RejectedListPage'));
const PointsPage = lazyWithRetry(() => import('../store/pages/PointsPage'));
const RewardsPage = lazyWithRetry(() => import('../store/pages/RewardsPage'));
const RedemptionPage = lazyWithRetry(() => import('../store/pages/RedemptionPage'));
const AddressPage = lazyWithRetry(() => import('../store/pages/AddressPage'));
const AccountSettingsPage = lazyWithRetry(() => import('../store/pages/AccountSettingsPage'));

const Loading = () => (
  <div className="flex items-center justify-center h-full">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
  </div>
);

const STORE_MENU: MenuItem[] = [
  { key: 'dashboard', label: '数据看板', path: '/store/dashboard' },
  { key: 'register', label: '录入质保', path: '/store/register' },
  { key: 'records', label: '我的质保记录', path: '/store/records' },
  { key: 'rejected', label: '驳回待修改', path: '/store/rejected' },
  { key: 'codes', label: '我的质保码', path: '/store/codes' },
  { key: 'points', label: '我的积分', path: '/store/points' },
  { key: 'rewards', label: '积分商城', path: '/store/rewards' },
  { key: 'redemptions', label: '兑换记录', path: '/store/redemptions' },
  { key: 'addresses', label: '收货地址', path: '/store/addresses' },
  { key: 'account', label: '账号设置', path: '/store/account' },
];

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/store/login" replace />;
  if (user.role !== 'STORE') return <Navigate to="/store/login" replace />;
  return <>{children}</>;
}

function DashboardShell() {
  return (
    <AuthGuard>
      <DashboardLayout menuItems={STORE_MENU} role="store" title="和膜门店管理" />
    </AuthGuard>
  );
}

const router = createBrowserRouter([
  {
    path: '/store/login',
    element: (
      <Suspense fallback={<Loading />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: '/store',
    element: <DashboardShell />,
    children: [
      { index: true, element: <Navigate to="/store/dashboard" replace /> },
      { path: 'dashboard', element: <Suspense fallback={<Loading />}><DashboardPage /></Suspense> },
      { path: 'register', element: <Suspense fallback={<Loading />}><WarrantyRegistrationPage /></Suspense> },
      { path: 'records', element: <Suspense fallback={<Loading />}><WarrantyRecordListPage /></Suspense> },
      { path: 'records/:id/edit', element: <Suspense fallback={<Loading />}><WarrantyRecordEditPage /></Suspense> },
      { path: 'rejected', element: <Suspense fallback={<Loading />}><RejectedListPage /></Suspense> },
      { path: 'codes', element: <Suspense fallback={<Loading />}><WarrantyCodeListPage /></Suspense> },
      { path: 'points', element: <Suspense fallback={<Loading />}><PointsPage /></Suspense> },
      { path: 'rewards', element: <Suspense fallback={<Loading />}><RewardsPage /></Suspense> },
      { path: 'redemptions', element: <Suspense fallback={<Loading />}><RedemptionPage /></Suspense> },
      { path: 'addresses', element: <Suspense fallback={<Loading />}><AddressPage /></Suspense> },
      { path: 'account', element: <Suspense fallback={<Loading />}><AccountSettingsPage /></Suspense> },
    ],
  },
]);

export { router };
