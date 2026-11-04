import {Alert, Button, Space, WorkFlow} from '@ead/suid'
import {RequestForm} from './RequestForm'
import {MODULE_ACTION} from './constants'
import {PROTOTYPE_BPM_BASE} from './bpmMock'
import type {SampleRequest} from './mockData'
import {t} from './messages'
import './sample-request.css'

/** 真实流程组件与普通页面复用业务表单，BPM 请求仅由本地 Mock 响应。 */
export function RequestApproval({record, onComplete, onBack}: {
  record: SampleRequest
  onComplete: (record: SampleRequest) => void
  onBack: () => void
}) {
  return <Space orientation="vertical" style={{width: '100%'}}>
    <Alert type="info" title={t('flowNotice')} />
    <Button onClick={onBack}>{t('back')}</Button>
    <WorkFlow.Approve className="sample-request-approval" style={{height: 580}}
      businessId={record.id} taskId={`mock-task-${record.id}`} flowEngine="SEI_BPM"
      store={{baseUrl: PROTOTYPE_BPM_BASE}} bizTabTitle={t('page')} showHistory={false}
      showCommonOpinionsBelow flowMapUrl="unsupported-flow-map"
      submitComplete={(result: {success?: boolean; data?: {flowStatus?: SampleRequest['flowStatus']}}) => {
        if (result.success && result.data?.flowStatus) onComplete({...record, flowStatus: result.data.flowStatus})
      }}>
      <RequestForm record={record} action={MODULE_ACTION.VIEW_APPROVE_FLOW} flowMode onSave={() => {}} onBack={onBack} />
    </WorkFlow.Approve>
  </Space>
}
