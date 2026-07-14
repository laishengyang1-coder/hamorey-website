// ============================================================
// ProvinceApp — 省代后台 SPA（/province/*）
// ============================================================

import React, { Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { DashboardLayout, type MenuItem } from '../shared/layouts/DashboardLayout';
import { useAuth } from '../shared/hooks/useAuth';

const LoginPage = React.lazy(() => import('../province/pages/LoginPage'));
const DashboardPage = React.lazy(() => import('../province/pages/DashboardPage'));
const StoreListPage = React.lazy(() => import('../province/pages/StoreListPage'));
const WarrantyCodeInventoryPage = React.lazy(() => import('../province/pages/WarrantyCodeInventoryPage'));
const WarrantyCodeAllocatePage = React.lazy(() => import('../province/pages/WarrantyCodeAllocatePage'));
const SubRecordListPage = React.lazy(() => import('../province/pages/SubRecordListPage'));
const PointsPage = React.lazy(() => import('../province/pages/PointsPage'));
const RewardsPage = React.lazy(() => import('../province/pages/RewardsPage'));
const RedemptionPage = React.lazy(() => import('../province/pages/RedemptionPage'));
const AddressPage = React.lazy(() => import('../province/pages/AddressPage'));
const AccountSettingsPage = React.lazy(() => import('../province/pages/AccountSettingsPage'));

const Loading = () => (
  <div className="flex items-center justify-center h-full">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
  </div>
);

const PROVINCE_MENU: MenuItem[] = [
  { key: 'dashboard', label: '数据看板', path: '/province/dashboard' },
  { key: 'stores', label: '下属门店', path: '/province/stores' },
  { key: 'warranty-codes', label: '质保码库存', path: '/province/warranty-codes' },
  { key: 'allocate', label: '质保码划拨', path: '/province/allocate' },
  { key: 'records', label: '下属质保记录', path: '/province/records' },
  { key: 'points', label: '我的积分', path: '/province/points' },
  { key: 'rewards', label: '积分商城', path: '/province/rewards' },
  { key: 'redemptions', label: '兑换记录', path: '/province/redemptions' },
  { key: 'addresses', label: '收货地址', path: '/province/addresses' },
  { key: 'account', label: '账号设置', path: '/province/account' },
];

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/province/login" replace />;
  if (user.role !== 'PROVINCE') return <Navigate to="/province/login" replace />;
  return <>{children}</>;
}

function DashboardShell() {
  return (
    <AuthGuard>
      <DashboardLayout menuItems={PROVINCE_MENU} role="province" title="和膜省代管理" />
    </AuthGuard>
  );
}

const router = createBrowserRouter([
  {
    path: '/province/login',
    element: (
      <Suspense fallback={<Loading />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: '/province',
    element: <DashboardShell />,
    children: [
      { index: true, element: <Navigate to="/province/dashboard" replace /> },
      { path: 'dashboard', element: <Suspense fallback={<Loading />}><DashboardPage /></Suspense> },
      { path: 'stores', element: <Suspense fallback={<Loading />}><StoreListPage /></Suspense> },
      { path: 'warranty-codes', element: <Suspense fallback={<Loading />}><WarrantyCodeInventoryPage /></Suspense> },
      { path: 'allocate', element: <Suspense fallback={<Loading />}><WarrantyCodeAllocatePage /></Suspense> },
      { path: 'records', element: <Suspense fallback={<Loading />}><SubRecordListPage /></Suspense> },
      { path: 'points', element: <Suspense fallback={<Loading />}><PointsPage /></Suspense> },
      { path: 'rewards', element: <Suspense fallback={<Loading />}><RewardsPage /></Suspense> },
      { path: 'redemptions', element: <Suspense fallback={<Loading />}><RedemptionPage /></Suspense> },
      { path: 'addresses', element: <Suspense fallback={<Loading />}><AddressPage /></Suspense> },
      { path: 'account', element: <Suspense fallback={<Loading />}><AccountSettingsPage /></Suspense> },
    ],
  },
]);

export default function ProvinceApp() {
  return <RouterProvider router={router} />;
}
