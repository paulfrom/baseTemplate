import {Button, Form, Input, Space} from '@ead/suid'
import type {SampleRequest} from './mockData'
import {isApproveEditable, type ModuleAction} from './constants'
import {t} from './messages'

/** 普通编辑与流程入口共用字段和校验，由动作决定只读状态。 */
export function RequestForm({record, action, flowMode = false, onSave, onBack}: {
  record: SampleRequest
  action?: ModuleAction
  flowMode?: boolean
  onSave: (record: SampleRequest) => void
  onBack: () => void
}) {
  const readOnly = action ? !isApproveEditable(action) : false
  return <Form initialValues={record} layout="vertical" disabled={readOnly}
    onFinish={(values) => onSave({...record, ...values})}>
    <Form.Item name="code" label={t('code')} rules={[{required: true, whitespace: true, message: t('required')}]}><Input /></Form.Item>
    <Form.Item name="title" label={t('title')} rules={[{required: true, whitespace: true, message: t('required')}]}><Input /></Form.Item>
    {!flowMode && <Space>
      {!readOnly && <Button type="primary" htmlType="submit" aria-label={t('save')}>{t('save')}</Button>}
      <Button disabled={false} onClick={onBack} aria-label={t('back')}>{t('back')}</Button>
    </Space>}
  </Form>
}
