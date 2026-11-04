import { setupWorker } from 'msw/browser'
import { sampleRequestBpmHandlers } from '../modules/sample-request/bpmMock'

/** 在浏览器内模拟流程组件的服务契约，不启动或连接后端。 */
export async function startPrototypeMocks() {
  const worker = setupWorker(...sampleRequestBpmHandlers)
  await worker.start({
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
    onUnhandledRequest: 'bypass',
    quiet: true,
  })
}
