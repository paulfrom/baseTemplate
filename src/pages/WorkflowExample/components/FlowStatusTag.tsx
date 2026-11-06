import { Tag } from '@ead/suid'
import { getIntl } from '../../../utils/intl'
import { FLOW_STATUS, type FlowStatusKey } from '../constants'

/**
 * 流程状态标签：列表、详情与审批抬头共用同一份状态表达。
 * 文案走 `src/locales` 的 i18n key，颜色按状态语义固定。
 */
const STATUS_COLOR: Record<FlowStatusKey, string> = {
  INIT: 'default',
  PROCESSING: 'processing',
  APPROVED: 'success',
  REJECTED: 'error',
  ENDED: 'warning',
}

/** 流程状态文案。 */
function getFlowStatusLabel(status: string): string {
  const { formatMessage: t } = getIntl()
  const key = (status in FLOW_STATUS ? status : FLOW_STATUS.INIT).toLowerCase()
  return t({ id: `workflowExample.flowStatus.${key}` })
}

export default function FlowStatusTag({ status }: { status: string }) {
  const key = (status in FLOW_STATUS ? status : FLOW_STATUS.INIT) as FlowStatusKey
  return <Tag color={STATUS_COLOR[key]}>{getFlowStatusLabel(key)}</Tag>
}
