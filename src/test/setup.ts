import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { act } from 'react'
import { message } from 'antd'

// React 19 在测试环境需要显式声明 Act 环境；否则用户交互会输出 act(...) 噪声。
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

// jsdom 明确声明不支持但业务无需模拟的两个 API，只按前缀抑制，避免掩盖新错误。
const originalConsoleError = console.error.bind(console)
const knownJsdomNoise = [
  "Not implemented: Window's getComputedStyle() method: with pseudo-elements",
  'Not implemented: navigation to another Document',
]
console.error = (...args: unknown[]) => {
  const first = args[0]
  if (typeof first === 'string' && knownJsdomNoise.some((prefix) => first.startsWith(prefix))) return
  originalConsoleError(...args)
}

Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  value: (query: string) => ({
    addEventListener: () => undefined,
    addListener: () => undefined,
    dispatchEvent: () => false,
    matches: false,
    media: query,
    onchange: null,
    removeEventListener: () => undefined,
  removeListener: () => undefined,
}),
writable: true,
})

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver

// jsdom 不支持 pseudo-element 查询；业务只依赖元素自身样式，统一退回元素样式避免批量噪声。
const elementGetComputedStyle = window.getComputedStyle.bind(window)
window.getComputedStyle = ((element: Element, _pseudoElt?: string | null) =>
  elementGetComputedStyle(element)) as typeof window.getComputedStyle

 // CI 慢速 Runner 上，React scheduler 的挂起工作可能在 jsdom 环境拆除后才触发
 // （ReferenceError: window is not defined）。每个用例结束前排空调度队列，
 // 确保挂起的渲染工作在环境存活期间完成；本地快速执行下几乎无额外耗时。
// rc-motion / rc-notification 的动画步骤与提示计时器都跑在 requestAnimationFrame
// 回调里，setTimeout(0) 不会推进动画帧；这些回调若在用例结束后才执行，就会在 act
// 作用域之外触发更新并产生 act(...) 告警。这里逐帧推进，让挂起的动画帧在本用例的
// act 作用域内执行完毕。清理的是告警源头，不是过滤日志。
const flushAnimationFrames = async (frames = 4) => {
  for (let index = 0; index < frames; index += 1) {
    await act(async () => {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve())
      })
    })
  }
}

afterEach(async () => {
  // antd 的静态 message 是模块级单例，提示自带 3 秒自动关闭定时器与进出场动画，
  // 并行执行时会跨测试文件存活；先销毁残留提示，再推进其卸载动画帧。
  await act(async () => {
    message.destroy()
  })
  await flushAnimationFrames()
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
  cleanup()
})

// localStorage mock for zustand persist middleware in test environment
const _ls: Record<string, string> = {}
window.localStorage = {
  getItem: (key: string) => _ls[key] ?? null,
  setItem: (key: string, value: string) => { _ls[key] = value },
  removeItem: (key: string) => { delete _ls[key] },
  clear: () => { for (const k of Object.keys(_ls)) delete _ls[k] },
  key: (index: number) => Object.keys(_ls)[index] ?? null,
  get length() { return Object.keys(_ls).length },
} as Storage
