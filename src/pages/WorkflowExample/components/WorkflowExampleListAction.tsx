import { ActionButton, Space, WorkFlow } from '@ead/suid'
import { AuditOutlined, EditOutlined, EyeOutlined, StopOutlined } from '@ead/suid-icons'
import { getIntl } from '../../../utils/intl'
import { BPM_END_STORE, FLOW_STATUS } from '../constants'
import type { WorkflowRecordView } from '../service'

/**
 * 流程示例列表的行操作。
 *
 * 参照公司模板 `src/pages/Project/ProjectApply/components/ProjectApplyListAction.jsx`：
 * 操作项按流程状态显隐（草稿可编辑、审批中可办理与终止），
 * 终止流程直接复用 SUID 的 `WorkFlow.EndFlow`，不另造一套流程组件。
 */
export default function WorkflowExampleListAction({
  record,
  onView,
  onEdit,
  onApprove,
  onFlowChanged,
}: {
  record: WorkflowRecordView
  onView: (record: WorkflowRecordView) => void
  onEdit: (record: WorkflowRecordView) => void
  onApprove: (record: WorkflowRecordView) => void
  onFlowChanged: () => void
}) {
  const { formatMessage: t } = getIntl()
  const editable = record.flowStatus === FLOW_STATUS.INIT
  const processing = record.flowStatus === FLOW_STATUS.PROCESSING

  return (
    <Space size={4} className="workflow-example-list-action">
      <ActionButton
        title={t({ id: 'workflowExample.view' })}
        icon={<EyeOutlined />}
        onClick={() => onView(record)}
      />
      {editable && (
        <ActionButton
          title={t({ id: 'global.edit' })}
          icon={<EditOutlined />}
          onClick={() => onEdit(record)}
        />
      )}
      {processing && (
        <ActionButton
          title={t({ id: 'workflowExample.approve' })}
          icon={<AuditOutlined />}
          onClick={() => onApprove(record)}
        />
      )}
      {processing && (
        <WorkFlow.EndFlow
          className="workflow-example-end-flow"
          businessId={record.id}
          store={BPM_END_STORE}
          complete={(res) => {
            if (res?.success) onFlowChanged()
          }}
        >
          {(loading) => (
            <ActionButton
              title={t({ id: 'workflowExample.endFlow' })}
              icon={<StopOutlined />}
              loading={loading}
            />
          )}
        </WorkFlow.EndFlow>
      )}
    </Space>
  )
}
