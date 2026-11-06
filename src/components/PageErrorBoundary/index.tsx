import { Button, Result } from '@ead/suid'
import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * 页面级错误边界。
 *
 * 路由页面都是 `lazy()` 动态加载的：模块请求失败时 `React.lazy` 会在渲染期抛错，
 * 没有错误边界的应用会直接白屏。这里把渲染异常收敛成一屏可读的错误与「重新加载」，
 * 保证原型在开发期出现模块加载失败时也有明确出口。
 */
interface PageErrorBoundaryProps {
  children: ReactNode
}

interface PageErrorBoundaryState {
  error: Error | null
}

export default class PageErrorBoundary extends Component<
  PageErrorBoundaryProps,
  PageErrorBoundaryState
> {
  state: PageErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): PageErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[prototype] 页面渲染失败：', error, errorInfo)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    return (
      <Result
        status="warning"
        title="页面加载失败"
        subTitle={error.message || '未知错误'}
        extra={
          <Button type="primary" onClick={() => window.location.reload()}>
            重新加载
          </Button>
        }
      />
    )
  }
}
