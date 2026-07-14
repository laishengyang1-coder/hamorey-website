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
    element: <ErrorBoundary label="总部后台"><Suspense fallback={<LoadingScreen />}><AdminApp /></Suspense></ErrorBoundary>,
    children: [
      { path: 'login', element: <Suspense fallback={<LoadingScreen />}><AdminApp /></Suspense> },
      { path: '*', element: <Suspense fallback={<LoadingScreen />}><AdminApp /></Suspense> },
    ],
  },
])

const provinceRouter = createBrowserRouter([
  {
    path: '/province',
    element: <ErrorBoundary label="省代后台"><Suspense fallback={<LoadingScreen />}><ProvinceApp /></Suspense></ErrorBoundary>,
    children: [
      { path: '*', element: <Suspense fallback={<LoadingScreen />}><ProvinceApp /></Suspense> },
    ],
  },
])

const storeRouter = createBrowserRouter([
  {
    path: '/store',
    element: <ErrorBoundary label="门店后台"><Suspense fallback={<LoadingScreen />}><StoreApp /></Suspense></ErrorBoundary>,
    children: [
      { path: '*', element: <Suspense fallback={<LoadingScreen />}><StoreApp /></Suspense> },
    ],
  },
])

// 错误边界组件 — 显示具体错误信息
function ErrorBoundary({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <React.Suspense fallback={<LoadingScreen />}>
      <ErrorBoundaryInner label={label}>{children}</ErrorBoundaryInner>
    </React.Suspense>
  )
}

class ErrorBoundaryInner extends React.Component<{ children: React.ReactNode; label: string }, { error: Error | null }> {
  constructor(props: { children: React.ReactNode; label: string }) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md text-center">
            <h1 className="text-lg font-bold text-red-600 mb-2">{this.props.label} 加载失败</h1>
            <p className="text-sm text-gray-500 mb-4 break-all">{this.state.error.message}</p>
            <pre className="text-xs text-left text-gray-400 bg-gray-100 rounded-lg p-4 overflow-auto max-h-60">{this.state.error.stack?.slice(0, 500)}</pre>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

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
