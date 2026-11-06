import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import PageErrorBoundary from './index'

/**
 * 页面级错误边界回归：路由页面是 lazy 动态加载的，模块加载失败时
 * 不能白屏，而要给出一屏可读的错误与「重新加载」入口。
 */
function Broken(): ReactElement {
  throw new Error('模块加载失败')
}

describe('page error boundary', () => {
  it('renders an error result instead of a blank screen', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <PageErrorBoundary>
        <Broken />
      </PageErrorBoundary>,
    )

    expect(screen.getByText('页面加载失败')).toBeInTheDocument()
    expect(screen.getByText('模块加载失败')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '重新加载' })).toBeInTheDocument()

    consoleError.mockRestore()
  })

  it('renders the children when nothing throws', () => {
    render(
      <PageErrorBoundary>
        <div>页面内容</div>
      </PageErrorBoundary>,
    )

    expect(screen.getByText('页面内容')).toBeInTheDocument()
  })
})
