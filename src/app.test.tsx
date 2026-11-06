import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import App from './app'

/**
 * 根容器冒烟测试：路由表 → 布局 → 页面 的整条链路。
 * 页面都是 lazy 加载，断言各自的首屏内容，确认没有回落到默认页。
 */

afterEach(() => {
  cleanup()
  localStorage.clear()
  window.location.hash = '#/portal'
})

describe('application root', () => {
  it('renders the portal as the default route', async () => {
    render(<App />)
    expect(
      await screen.findByRole(
        'heading',
        { level: 1, name: '业务原型模板统一门户' },
        { timeout: 20000 },
      ),
    ).toBeInTheDocument()
  })

  it('renders the dashboard page on its own route', async () => {
    window.location.hash = '#/dashboard'
    render(<App />)
    expect(
      await screen.findByText('欢迎来到本模块进行开发', {}, { timeout: 20000 }),
    ).toBeInTheDocument()
  })

  it('renders the sample-request list under the auth layout', async () => {
    window.location.hash = '#/sample-request'
    render(<App />)
    expect(await screen.findByText('SQ-001', {}, { timeout: 20000 })).toBeInTheDocument()
    // 列表页在应用外壳里，侧边栏品牌与面包屑都在。
    expect(screen.getAllByText('baseTemplate').length).toBeGreaterThan(0)
  })

  it('renders the login page under the login layout', async () => {
    window.location.hash = '#/user/login'
    render(<App />)
    expect(
      await screen.findByText(/用户登录/, {}, { timeout: 20000 }),
    ).toBeInTheDocument()
    expect(document.querySelector('.layout-login')).not.toBeNull()
  })
})
