import { Alert, WorkFlow } from '@ead/suid'
import type { ComponentType } from 'react'
import { BPM_BASE_URL } from '../../utils/constants'
import { getIntl } from '../../utils/intl'
import { useLocation } from '../../utils/navigation'

/**
 * 流程审批页适配器。
 *
 * 对齐公司模板 `src/components/BpmApprovePageAdapter` 的职责：
 * - 从路由 query 解析 `taskId` / `id`（兼容 `businessId`）/ `instanceId`；
 * - 缺少业务 id 时给出明确提示，不渲染空白页；
 * - 业务主表单作为 `WorkFlow.Approve` 的子节点，审批面板与单据共用一块区域；
 * - BPM 契约由 `src/mocks/browser.ts` 的 MSW handler 模拟，不连接真实流程服务。
 *
 * 使用方（业务模块的审批页薄壳）：
 * ```tsx
 * <WorkflowApprovePage
 *   mainComponent={WorkflowExampleForm}
 *   missingParamMessage={t({ id: 'workflowExample.missingId' })}
 * />
 * ```
 */
export interface WorkflowApprovePageProps {
  /** 业务主表单：审批时以只读模式渲染。 */
  mainComponent: ComponentType<{ readOnly?: boolean }>
  /** 缺少业务标识时的提示文案。 */
  missingParamMessage?: string
  /** 业务页签名，审批面板的单据页签标题。 */
  bizTabTitle?: string
  /** 审批页根节点样式类：用于给内部 Splitter 一个确定高度。 */
  className?: string
  /**
   * 流程图页面地址：审批面板的「流程图」页签用它渲染 iframe。
   * 默认指向 public 下的静态占位页，接入真实项目时换成 BPM 平台的流程图地址。
   */
  flowMapUrl?: string
}

export default function WorkflowApprovePage({
  mainComponent: MainComponent,
  missingParamMessage,
  bizTabTitle,
  className,
  flowMapUrl = 'bpm-flow-chart.html',
}: WorkflowApprovePageProps) {
  const { query } = useLocation()
  const { formatMessage: t } = getIntl()
  const taskId = query.taskId
  const businessId = query.id || query.businessId
  const instanceId = query.instanceId

  if (!businessId) {
    return (
      <Alert
        showIcon
        type="warning"
        message={missingParamMessage ?? t({ id: 'global.missing-id', defaultMessage: '缺少业务数据参数' })}
      />
    )
  }

  return (
    <WorkFlow.Approve
      taskId={taskId}
      businessId={businessId}
      instanceId={instanceId}
      store={{ baseUrl: BPM_BASE_URL }}
      bizTabTitle={bizTabTitle}
      className={className}
      flowMapUrl={flowMapUrl}
    >
      <MainComponent readOnly />
    </WorkFlow.Approve>
  )
}
