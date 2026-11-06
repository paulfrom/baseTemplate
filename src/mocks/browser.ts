import { http, HttpResponse, type RequestHandler } from 'msw'
import { setupWorker } from 'msw/browser'
import * as bpm from './bpm'

/**
 * 浏览器端请求拦截层，保持与公司模板一致的「服务契约由前端模拟」约定。
 *
 * `SampleRequest` 是纯 CRUD，数据走 `pages/SampleRequest/service.ts` 的本地实现，
 * 不需要 HTTP 拦截；流程示例（`WorkFlow` 组件）直接请求 `sei-bpm/**` 接口，
 * 这部分契约由 `./bpm` 的内存状态机提供，并在这里注册成 MSW handler 拦截，
 * 禁止请求穿透到真实 BPM 服务。
 */

/** 统一响应壳，与后端 `ResponseResult` 保持一致。 */
function json(payload: unknown) {
  return HttpResponse.json(payload as Record<string, unknown>)
}

/** BPM 接口统一挂在 `api-gateway` 前缀下，与公司模板的 `SERVER_PATH` 一致。 */
const BPM_PATTERN = /\/api-gateway\/sei-bpm\//

const PROTOTYPE_HANDLERS: RequestHandler[] = [
  // 审批面板抬头：业务摘要、默认意见与可执行按钮
  http.get(/\/api-gateway\/sei-bpm\/runDefaultBpm\/getApprovePageLoadingInfo/, ({ request }) => {
    const taskId = new URL(request.url).searchParams.get('taskId') ?? ''
    return json(bpm.getApprovePageLoadingInfo(taskId))
  }),
  // 当前任务的下一步决策节点
  http.get(/\/api-gateway\/sei-bpm\/runDefaultBpm\/getNextDicisionInfo/, ({ request }) => {
    const taskId = new URL(request.url).searchParams.get('taskId') ?? ''
    return json(bpm.getNextDicisionInfo(taskId))
  }),
  // 办理时选定的下一节点
  http.post(/\/api-gateway\/sei-bpm\/runDefaultBpm\/getSelectedNextNodeInfo/, async ({ request }) => {
    const body = (await request.json()) as { taskId?: string; agreeOrNot?: boolean }
    return json(bpm.getSelectedNextNodeInfo(body))
  }),
  // 办理任务，推进流程
  http.post(/\/api-gateway\/sei-bpm\/runDefaultBpm\/handleBpmFlow/, async ({ request }) => {
    const body = (await request.json()) as {
      taskId?: string
      opinion?: string
      buttonCode?: string
    }
    return json(bpm.handleBpmFlow(body))
  }),
  // 流程日志（按任务 / 按单据）
  http.get(/\/api-gateway\/sei-bpm\/runDefaultBpm\/getMergeTrackInfoByTaskId/, ({ request }) => {
    const taskId = new URL(request.url).searchParams.get('taskId') ?? ''
    return json(bpm.getMergeTrackInfoByTaskId(taskId))
  }),
  http.get(/\/api-gateway\/sei-bpm\/runDefaultBpm\/getMergeTrackInfoByBusinessId/, ({ request }) => {
    const businessId = new URL(request.url).searchParams.get('businessId') ?? ''
    return json(bpm.getMergeTrackInfoByBusinessId(businessId))
  }),
  // 发起流程：可发起的流程与首个节点
  http.post(/\/api-gateway\/sei-bpm\/runDefaultBpm\/findUsableFlowList/, async ({ request }) => {
    const body = (await request.json()) as { businessId?: string }
    return json(bpm.findUsableFlowList(body))
  }),
  // 发起流程
  http.post(/\/api-gateway\/sei-bpm\/runDefaultBpm\/startBpmFlow/, async ({ request }) => {
    const body = (await request.json()) as {
      businessId?: string
      businessEntityCode?: string
      flowDefinitionId?: string
      additionRemark?: string
      nextNodeParamsList?: { nodeId?: string; executorList?: bpm.FlowExecutor[] }[]
    }
    return json(bpm.startBpmFlow(body))
  }),
  // 终止流程
  http.post(/\/api-gateway\/sei-bpm\/runInstance\/checkAndEndByBusinessId/, async ({ request }) => {
    const body = (await request.json()) as { businessId?: string; terminateReason?: string }
    return json(bpm.checkAndEndByBusinessId(body))
  }),
  // 兜底：原型没有实现的 BPM 接口直接失败，避免穿透到真实服务
  http.all(BPM_PATTERN, () =>
    json({ success: false, message: '原型未实现该 BPM 接口', data: null }),
  ),
]

/**
 * 启动浏览器模拟层。
 *
 * `main.tsx` 在挂载应用前 await 这个函数：如果 Service Worker 注册失败或一直挂住，
 * 应用就会停在白屏。这里把失败与超时都降级成警告，让应用照常渲染，
 * 只是流程相关的接口拿不到模拟数据。
 */
export async function startPrototypeMocks() {
  if (PROTOTYPE_HANDLERS.length === 0) return
  try {
    const worker = setupWorker(...PROTOTYPE_HANDLERS)
    const started = worker
      .start({
        serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
        onUnhandledRequest: 'bypass',
        quiet: true,
      })
      .catch((error: unknown) => {
        console.warn('[prototype] MSW 启动失败，BPM 契约模拟不可用：', error)
      })
    // 注册超过 3 秒就不再阻塞首屏，Worker 仍会在后台完成注册。
    await Promise.race([
      started,
      new Promise((resolve) => {
        setTimeout(resolve, 3000)
      }),
    ])
  } catch (error) {
    console.warn('[prototype] MSW 初始化失败，BPM 契约模拟不可用：', error)
  }
}
