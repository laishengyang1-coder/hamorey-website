import React, { Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import RootLayout from './layouts/RootLayout'
import HomePage from './pages/HomePage'
import BrandPage from './pages/BrandPage'
import ProductsPage from './pages/ProductsPage'
import WindowFilmPage from './pages/WindowFilmPage'
import PPFPage from './pages/PPFPage'
import ColorPPFPage from './pages/ColorPPFPage'
import SunroofFilmPage from './pages/SunroofFilmPage'
import ArchitecturalFilmPage from './pages/ArchitecturalFilmPage'
import ServicePage from './pages/ServicePage'
import StoresPage from './pages/StoresPage'
import PartnerPage from './pages/PartnerPage'
import WarrantyPage from './pages/WarrantyPage'
import WarrantyResultPage from './pages/WarrantyResultPage'
import ContactPage from './pages/ContactPage'
import PrivacyPage from './pages/PrivacyPage'
import WarrantyTermsPage from './pages/WarrantyTermsPage'
import NotFoundPage from './pages/NotFoundPage'

// 后台 SPA 懒加载（按需加载，减小品牌官网首屏体积）
const AdminApp = React.lazy(() => import('./apps/AdminApp'))
const ProvinceApp = React.lazy(() => import('./apps/ProvinceApp'))
const StoreApp = React.lazy(() => import('./apps/StoreApp'))

const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gray-900 mb-4 animate-pulse">
        <span className="text-white text-xl font-bold">和</span>
      </div>
      <p className="text-sm text-gray-500">加载中...</p>
    </div>
  </div>
)

// 品牌官网路由（第一阶段已有的 15 个页面）
const brandRouter = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'brand', element: <BrandPage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'products/window-film', element: <WindowFilmPage /> },
      { path: 'products/ppf', element: <PPFPage /> },
      { path: 'products/color-ppf', element: <ColorPPFPage /> },
      { path: 'products/sunroof-film', element: <SunroofFilmPage /> },
      { path: 'products/architectural-film', element: <ArchitecturalFilmPage /> },
      { path: 'service', element: <ServicePage /> },
      { path: 'stores', element: <StoresPage /> },
      { path: 'partner', element: <PartnerPage /> },
      { path: 'warranty', element: <WarrantyPage /> },
      { path: 'warranty/result', element: <WarrantyResultPage /> },
      { path: 'warranty/terms', element: <WarrantyTermsPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'privacy', element: <PrivacyPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

// 后台 SPA 路由器（各自独立）
const adminRouter = createBrowserRouter([
  {
    path: '/admin',
    element: (
      <Suspense fallback={<LoadingScreen />}>
        <AdminApp />
      </Suspense>
    ),
    children: [
      { path: '*', element: (
        <Suspense fallback={<LoadingScreen />}>
          <AdminApp />
        </Suspense>
      ) },
    ],
  },
])

const provinceRouter = createBrowserRouter([
  {
    path: '/province',
    element: (
      <Suspense fallback={<LoadingScreen />}>
        <ProvinceApp />
      </Suspense>
    ),
    children: [
      { path: '*', element: (
        <Suspense fallback={<LoadingScreen />}>
          <ProvinceApp />
        </Suspense>
      ) },
    ],
  },
])

const storeRouter = createBrowserRouter([
  {
    path: '/store',
    element: (
      <Suspense fallback={<LoadingScreen />}>
        <StoreApp />
      </Suspense>
    ),
    children: [
      { path: '*', element: (
        <Suspense fallback={<LoadingScreen />}>
          <StoreApp />
        </Suspense>
      ) },
    ],
  },
])

/**
 * 根据 URL 路径决定渲染哪个 SPA
 * - /admin/*  → AdminApp（总部后台）
 * - /province/* → ProvinceApp（省代后台）
 * - /store/* → StoreApp（门店后台）
 * - 其他 → 品牌官网 App
 */
export default function App() {
  const pathname = window.location.pathname

  if (pathname.startsWith('/admin')) {
    return <RouterProvider router={adminRouter} />
  }

  if (pathname.startsWith('/province')) {
    return <RouterProvider router={provinceRouter} />
  }

  if (pathname.startsWith('/store')) {
    return <RouterProvider router={storeRouter} />
  }

  return <RouterProvider router={brandRouter} />
}
