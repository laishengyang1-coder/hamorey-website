// ============================================================
// AdminApp — 总部后台 SPA（/admin/*）
// ============================================================

import React, { Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { DashboardLayout, type MenuItem } from '../shared/layouts/DashboardLayout';
import { useAuth } from '../shared/hooks/useAuth';
import { lazyWithRetry } from '../shared/lib/lazyWithRetry';

// 懒加载页面（带部署后 chunk 失配自愈）
const LoginPage = lazyWithRetry(() => import('../admin/pages/LoginPage'));
const DashboardPage = lazyWithRetry(() => import('../admin/pages/DashboardPage'));
const ChinaStoreMapPage = lazyWithRetry(() => import('../admin/pages/ChinaStoreMapPage'));
const ProvinceListPage = lazyWithRetry(() => import('../admin/pages/ProvinceListPage'));
const StoreListPage = lazyWithRetry(() => import('../admin/pages/StoreListPage'));
const ReviewListPage = lazyWithRetry(() => import('../admin/pages/ReviewListPage'));
const ReviewDetailPage = lazyWithRetry(() => import('../admin/pages/ReviewDetailPage'));
const WarrantyRecordListPage = lazyWithRetry(() => import('../admin/pages/WarrantyRecordListPage'));
const ProductManagePage = lazyWithRetry(() => import('../admin/pages/ProductManagePage'));
const WarrantyCodeImportPage = lazyWithRetry(() => import('../admin/pages/WarrantyCodeImportPage'));
const WarrantyCodeInventoryPage = lazyWithRetry(() => import('../admin/pages/WarrantyCodeInventoryPage'));
const PointsRulesPage = lazyWithRetry(() => import('../admin/pages/PointsRulesPage'));
const RebateRulesPage = lazyWithRetry(() => import('../admin/pages/RebateRulesPage'));
const PointsLedgerPage = lazyWithRetry(() => import('../admin/pages/PointsLedgerPage'));
const RewardsPage = lazyWithRetry(() => import('../admin/pages/RewardsPage'));
const RedemptionListPage = lazyWithRetry(() => import('../admin/pages/RedemptionListPage'));
const ClaimPartsPage = lazyWithRetry(() => import('../admin/pages/ClaimPartsPage'));
const StorePublicPage = lazyWithRetry(() => import('../admin/pages/StorePublicPage'));
const PartnerLeadsPage = lazyWithRetry(() => import('../admin/pages/PartnerLeadsPage'));
const ContentEntriesPage = lazyWithRetry(() => import('../admin/pages/ContentEntriesPage'));
const ExportPage = lazyWithRetry(() => import('../admin/pages/ExportPage'));
const CodeInventoryTreePage = lazyWithRetry(() => import('../admin/pages/CodeInventoryTreePage'));
const OperationLogsPage = lazyWithRetry(() => import('../admin/pages/OperationLogsPage'));
const SystemSettingsPage = lazyWithRetry(() => import('../admin/pages/SystemSettingsPage'));

const Loading = () => (
  <div className="flex items-center justify-center h-full">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
  </div>
);

const ADMIN_MENU: MenuItem[] = [
  { key: 'dashboard', label: '数据看板', path: '/admin/dashboard', badge: undefined },
  {
    key: 'group-warranty',
    label: '质保管理',
    path: '',
    children: [
      { key: 'reviews', label: '质保审核', path: '/admin/reviews' },
      { key: 'warranty-records', label: '质保记录', path: '/admin/warranty-records' },
      { key: 'warranty-codes', label: '质保码库存', path: '/admin/warranty-codes' },
      { key: 'warranty-import', label: '质保码导入', path: '/admin/warranty-import' },
      { key: 'warranty-tree', label: '库存层级总览', path: '/admin/warranty-tree' },
    ],
  },
  {
    key: 'group-product',
    label: '产品与报价',
    path: '',
    children: [
      { key: 'products', label: '产品管理', path: '/admin/products' },
      { key: 'claim-prices', label: '部位报价', path: '/admin/claim-prices' },
    ],
  },
  {
    key: 'group-org',
    label: '组织管理',
    path: '',
    children: [
      { key: 'provinces', label: '省代管理', path: '/admin/provinces' },
      { key: 'stores', label: '门店管理', path: '/admin/stores' },
      { key: 'store-public', label: '授权门店', path: '/admin/store-public' },
      { key: 'partner-leads', label: '合作线索', path: '/admin/partner-leads' },
    ],
  },
  {
    key: 'group-points',
    label: '积分体系',
    path: '',
    children: [
      { key: 'points-rules', label: '积分规则', path: '/admin/points-rules' },
      { key: 'rebate-rules', label: '返利规则', path: '/admin/rebate-rules' },
      { key: 'rewards', label: '积分商城', path: '/admin/rewards' },
      { key: 'redemptions', label: '兑换审核', path: '/admin/redemptions' },
      { key: 'points-ledger', label: '积分流水', path: '/admin/points-ledger' },
    ],
  },
  {
    key: 'group-system',
    label: '系统工具',
    path: '',
    children: [
      { key: 'content', label: '官网内容', path: '/admin/content' },
      { key: 'export', label: '数据导出', path: '/admin/export' },
      { key: 'operation-logs', label: '操作日志', path: '/admin/operation-logs' },
      { key: 'system-settings', label: '系统设置', path: '/admin/system-settings' },
    ],
  },
];

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (user.role !== 'HQ_ADMIN') return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

function DashboardShell() {
  return (
    <AuthGuard>
      <DashboardLayout menuItems={ADMIN_MENU} role="admin" title="和膜总部管理" />
    </AuthGuard>
  );
}

const router = createBrowserRouter([
  {
    path: '/admin/login',
    element: (
      <Suspense fallback={<Loading />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: '/admin',
    element: <DashboardShell />,
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      {
        path: 'dashboard',
        element: (
          <Suspense fallback={<Loading />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'store-map',
        element: (
          <Suspense fallback={<Loading />}>
            <ChinaStoreMapPage />
          </Suspense>
        ),
      },
      {
        path: 'reviews',
        element: (
          <Suspense fallback={<Loading />}>
            <ReviewListPage />
          </Suspense>
        ),
      },
      {
        path: 'reviews/:id',
        element: (
          <Suspense fallback={<Loading />}>
            <ReviewDetailPage />
          </Suspense>
        ),
      },
      {
        path: 'warranty-records',
        element: (
          <Suspense fallback={<Loading />}>
            <WarrantyRecordListPage />
          </Suspense>
        ),
      },
      {
        path: 'products',
        element: (
          <Suspense fallback={<Loading />}>
            <ProductManagePage />
          </Suspense>
        ),
      },
      {
        path: 'warranty-import',
        element: (
          <Suspense fallback={<Loading />}>
            <WarrantyCodeImportPage />
          </Suspense>
        ),
      },
      {
        path: 'warranty-codes',
        element: (
          <Suspense fallback={<Loading />}>
            <WarrantyCodeInventoryPage />
          </Suspense>
        ),
      },
      {
        path: 'warranty-tree',
        element: (
          <Suspense fallback={<Loading />}>
            <CodeInventoryTreePage />
          </Suspense>
        ),
      },
      {
        path: 'provinces',
        element: (
          <Suspense fallback={<Loading />}>
            <ProvinceListPage />
          </Suspense>
        ),
      },
      {
        path: 'stores',
        element: (
          <Suspense fallback={<Loading />}>
            <StoreListPage />
          </Suspense>
        ),
      },
      {
        path: 'points-rules',
        element: (
          <Suspense fallback={<Loading />}>
            <PointsRulesPage />
          </Suspense>
        ),
      },
      {
        path: 'rebate-rules',
        element: (
          <Suspense fallback={<Loading />}>
            <RebateRulesPage />
          </Suspense>
        ),
      },
      {
        path: 'points-ledger',
        element: (
          <Suspense fallback={<Loading />}>
            <PointsLedgerPage />
          </Suspense>
        ),
      },
      {
        path: 'rewards',
        element: (
          <Suspense fallback={<Loading />}>
            <RewardsPage />
          </Suspense>
        ),
      },
      {
        path: 'redemptions',
        element: (
          <Suspense fallback={<Loading />}>
            <RedemptionListPage />
          </Suspense>
        ),
      },
      {
        path: 'claim-prices',
        element: (
          <Suspense fallback={<Loading />}>
            <ClaimPartsPage />
          </Suspense>
        ),
      },
      {
        path: 'store-public',
        element: (
          <Suspense fallback={<Loading />}>
            <StorePublicPage />
          </Suspense>
        ),
      },
      {
        path: 'partner-leads',
        element: (
          <Suspense fallback={<Loading />}>
            <PartnerLeadsPage />
          </Suspense>
        ),
      },
      {
        path: 'content',
        element: (
          <Suspense fallback={<Loading />}>
            <ContentEntriesPage />
          </Suspense>
        ),
      },
      {
        path: 'export',
        element: (
          <Suspense fallback={<Loading />}>
            <ExportPage />
          </Suspense>
        ),
      },
      {
        path: 'operation-logs',
        element: (
          <Suspense fallback={<Loading />}>
            <OperationLogsPage />
          </Suspense>
        ),
      },
      {
        path: 'system-settings',
        element: (
          <Suspense fallback={<Loading />}>
            <SystemSettingsPage />
          </Suspense>
        ),
      },
    ],
  },
]);

export { router };
