import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import './global.css'
import { App } from './app'
import { startPrototypeMocks } from './mocks/browser'

/**
 * Vite 入口（等价于 umi 自动生成的入口文件）：
 * 只做挂载、语言初始化与 MSW 启动，业务与主题逻辑都在 src/app.tsx。
 */
dayjs.locale('zh-cn')

await startPrototypeMocks()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
