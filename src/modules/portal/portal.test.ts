import { message } from 'antd'
import {
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react'
import { act, createElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PortalPage } from './PortalPage'

// the project does not enable vitest globals, so @testing-library/react does
// not auto-clean between tests. call cleanup() explicitly to keep DOM isolated.
afterEach(async () => {
  // 页面交互弹出的 antd message 自带 3 秒自动关闭定时器与进出场动画，其回调跑在
  // requestAnimationFrame 上；这里在用例结束前销毁残留提示，配合全局的动画帧推进，
  // 避免这些回调落到后续用例的 act 作用域之外。
  await act(async () => {
    message.destroy()
  })
  cleanup()
  window.location.hash = '#/portal'
  vi.restoreAllMocks()
})

const PLATFORM_NAMES = [
  '数据驾驶舱',
  '业务平台示例 A',
  '业务平台示例 B',
]

describe('portal entry page', () => {
  it('shows the skeleton placeholder before loading completes', () => {
    vi.useFakeTimers()
    try {
      render(createElement(PortalPage))
      expect(screen.getByTestId('portal-skeleton')).toBeInTheDocument()
      expect(screen.getByLabelText('门户加载中')).toHaveAttribute('aria-busy', 'true')
    } finally {
      vi.useRealTimers()
    }
  })

  it('renders hero title, three platform cards and three CTA buttons after loading', async () => {
    render(createElement(PortalPage))

    const hero = await screen.findByRole('heading', {
      level: 1,
      name: '业务原型模板统一门户',
    })
    expect(hero).toBeInTheDocument()

    for (const name of PLATFORM_NAMES) {
      expect(
        screen.getByRole('heading', { level: 2, name }),
      ).toBeInTheDocument()
    }

    expect(screen.getAllByText('进入平台')).toHaveLength(3)
    expect(screen.getAllByText('业务原型模板 · 保留框架 · 快速接入').length).toBeGreaterThan(0)
    expect(screen.getByText('© 2026 baseTemplate · 业务原型模板')).toBeInTheDocument()
  })

  it('navigates the cockpit card to the analytics cockpit route', async () => {
    render(createElement(PortalPage))
    await screen.findByRole('heading', { level: 1, name: '业务原型模板统一门户' })

    const cockpitCard = screen.getByRole('button', { name: '进入数据驾驶舱' })
    expect(cockpitCard).toHaveAttribute('data-platform', 'app-cockpit')

    fireEvent.click(cockpitCard)

    expect(window.location.hash).toBe('#/analytics-cockpit')
  })

  it('triggers message.info when a placeholder card is clicked', async () => {
    const infoSpy = vi.spyOn(message, 'info')

    render(createElement(PortalPage))
    await screen.findByRole('heading', { level: 1, name: '业务原型模板统一门户' })

    // 卡片会调用 antd message：它渲染在独立 React root 且挂载动作在微任务中，
    // 需要 async act 覆盖，否则其状态更新会落在测试的 act 作用域之外。
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '进入业务平台示例 A' }))
    })

    expect(infoSpy).toHaveBeenCalledTimes(1)
    expect(infoSpy.mock.calls[0]?.[0] as string).toContain('模板占位')
  })

  it('opens the user menu and navigates to user settings', async () => {
    render(createElement(PortalPage))
    await screen.findByRole('heading', { level: 1, name: '业务原型模板统一门户' })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '用户菜单' }))
    })
    const userSettings = await screen.findByText('用户配置')
    await act(async () => {
      fireEvent.click(userSettings)
    })

    expect(window.location.hash).toBe('#/user-settings')
  })
})
