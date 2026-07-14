import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

interface RootErrorBoundaryState {
  error: Error | null
}

class RootErrorBoundary extends React.Component<{ children: React.ReactNode }, RootErrorBoundaryState> {
  state: RootErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): RootErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[RootErrorBoundary]', error, info.componentStack)
  }

  private reload = () => {
    sessionStorage.removeItem('hm_chunk_reload_once')
    window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F6F1EA', color: '#211B18', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ width: '100%', maxWidth: 440, textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, background: '#5C1A1A', color: '#FFFFFF', fontSize: 22, fontWeight: 700 }}>和</div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>页面加载遇到问题</h1>
          <p style={{ margin: '12px 0 24px', color: '#746A63', lineHeight: 1.7 }}>系统已经捕获异常，请重新加载页面。若问题持续，请返回官网首页后重试。</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button type="button" onClick={this.reload} style={{ border: 0, borderRadius: 8, background: '#5C1A1A', color: '#FFFFFF', padding: '10px 20px', cursor: 'pointer', fontSize: 14 }}>重新加载</button>
            <a href="/" style={{ border: '1px solid #D6CCC3', borderRadius: 8, color: '#5C1A1A', padding: '9px 20px', textDecoration: 'none', fontSize: 14 }}>返回官网首页</a>
          </div>
        </div>
      </div>
    )
  }
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>,
)

// A successful session may retry one stale lazy chunk again after the next deploy.
window.setTimeout(() => sessionStorage.removeItem('hm_chunk_reload_once'), 10_000)
