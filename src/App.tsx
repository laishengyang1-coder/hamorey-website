import React, { Suspense, useEffect, useState } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import type { Router as RemixRouter } from '@remix-run/router'
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
import LoginHub from './pages/LoginHub'

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

// 品牌官网路由
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

// 错误边界
class ErrorBoundary extends React.Component<{ children: React.ReactNode; label: string }, { error: Error | null }> {
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
            <p className="text-sm text-gray-500 mb-4 break-all">{this.state.error.message || String(this.state.error)}</p>
            <pre className="text-xs text-left text-gray-400 bg-gray-100 rounded-lg p-4 overflow-auto max-h-60">
              {this.state.error.stack?.slice(0, 800)}
            </pre>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// 后台懒加载路由器
function LazyAdminApp() {
  const [router, setRouter] = useState<RemixRouter | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    import('./apps/AdminApp').then(m => setRouter(m.router)).catch(setError)
  }, [])

  if (error) return <ErrorBoundary label="总部后台"><>{String(error)}</></ErrorBoundary>
  if (!router) return <LoadingScreen />
  return <RouterProvider router={router} />
}

function LazyProvinceApp() {
  const [router, setRouter] = useState<RemixRouter | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    import('./apps/ProvinceApp').then(m => setRouter(m.router)).catch(setError)
  }, [])

  if (error) return <ErrorBoundary label="省代后台"><>{String(error)}</></ErrorBoundary>
  if (!router) return <LoadingScreen />
  return <RouterProvider router={router} />
}

function LazyStoreApp() {
  const [router, setRouter] = useState<RemixRouter | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    import('./apps/StoreApp').then(m => setRouter(m.router)).catch(setError)
  }, [])

  if (error) return <ErrorBoundary label="门店后台"><>{String(error)}</></ErrorBoundary>
  if (!router) return <LoadingScreen />
  return <RouterProvider router={router} />
}

export default function App() {
  const pathname = window.location.pathname

  if (pathname.startsWith('/admin')) {
    return <LazyAdminApp />
  }

  if (pathname.startsWith('/province')) {
    return <LazyProvinceApp />
  }

  if (pathname.startsWith('/store')) {
    return <LazyStoreApp />
  }

  if (pathname === '/login') {
    return <LoginHub />
  }

  return <RouterProvider router={brandRouter} />
}
