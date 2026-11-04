import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

// jsdom 环境没有 canvas，按仓库既有模式把 EChart 桩掉，
// 避免 echarts 初始化失败影响路由级 smoke 测试。
vi.mock('./components/charts/EChart', () => ({
  MAP_MAINLAND: 'china-mainland',
  MAP_SOUTH_SEA: 'china-south-sea',
  mainlandGeoJson: { features: [] },
  EChart: ({ ariaLabel }: { ariaLabel: string }) => <div role="img" aria-label={ariaLabel} />,
}))

afterEach(() => {
  cleanup()
  localStorage.clear()
  window.location.hash = '#/portal'
})

describe('application shell', () => {
  it('renders the portal as the default route', async () => {
    render(<App />)
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: '业务原型模板统一门户' })).toBeInTheDocument()
    })
    expect(screen.getAllByText('业务原型模板 · 保留框架 · 快速接入').length).toBeGreaterThan(0)
  })

  it('keeps the named dark theme when toggling the portal appearance switch', async () => {
    localStorage.setItem('prototype_theme_id', 'obsidian')
    window.location.hash = '#/portal'
    render(<App />)

    const themeSwitch = await screen.findByRole('switch', { name: '切换深色主题' })
    expect(themeSwitch).toHaveAttribute('aria-checked', 'true')

    fireEvent.click(themeSwitch)

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('aurora')
      expect(localStorage.getItem('prototype_theme_id')).toBe('aurora')
    })
  })

  it('renders the analytics cockpit route without crashing', async () => {
    window.location.hash = '#/analytics-cockpit'
    window.dispatchEvent(new Event('hashchange'))
    render(<App />)

    // 路由页是 lazy 加载的，等驾驶舱自己的 h1 挂载才算真正渲染成功。
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: '数据驾驶舱' })).toBeInTheDocument()
    }, { timeout: 4000 })
    await waitFor(() => {
      const content = document.querySelector('main')
      expect(content?.childElementCount ?? 0).toBeGreaterThan(0)
    }, { timeout: 4000 })
  })
})
