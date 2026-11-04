import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { startPrototypeMocks } from './mocks/browser'

dayjs.locale('zh-cn')


await startPrototypeMocks()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
