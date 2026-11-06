import { Alert, App, Button, Col, ComboList, Form, Input, MoneyInput, Row, Space, WorkFlow } from '@ead/suid'
import { useEffect, useRef, useState } from 'react'
import { getIntl } from '../../../utils/intl'
import { history, useLocation } from '../../../utils/navigation'
import FlowStatusTag from '../components/FlowStatusTag'
import { BPM_ENTITY_CODE, BPM_START_STORE, DEPARTMENT_OPTIONS } from '../constants'
import { findOne, save, type WorkflowRecordView } from '../service'
import '../workflow-example.css'

/**
 * 费用申请单主表单。
 *
 * 一个业务模块只维护一份主表单：新建、编辑、只读详情与流程审批共用它，
 * 避免字段、校验与布局分叉（对齐公司模板 `pages/SampleRequest/Form` 的做法，
 * 并补上 `ProjectApply` 的流程动作：保存并发起流程）。
 */
export default function WorkflowExampleForm({
  readOnly = false,
  requireId = false,
}: {
  readOnly?: boolean
  requireId?: boolean
}) {
  const { query } = useLocation()
  const id = query.id || undefined
  return (
    <RequestEditor
      key={`${id ?? 'new'}:${readOnly}:${requireId}`}
      id={id}
      readOnly={readOnly}
      requireId={requireId}
    />
  )
}

interface FormValues {
  title: string
  applicant: string
  department: string
  amount: number
  reason: string
}

function RequestEditor({
  id,
  readOnly,
  requireId,
}: {
  id?: string
  readOnly: boolean
  requireId: boolean
}) {
  const [form] = Form.useForm()
  const { formatMessage: t } = getIntl()
  const { message } = App.useApp()
  const [loading, setLoading] = useState(Boolean(id))
  const [loaded, setLoaded] = useState(!id && !requireId)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [saving, setSaving] = useState(false)
  const [record, setRecord] = useState<WorkflowRecordView | null>(null)
  const mounted = useRef(true)
  const submitting = useRef(false)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    let active = true
    form.resetFields()
    setRecord(null)
    setLoaded(!id && !requireId)
    setError('')
    if (!id) {
      setLoading(false)
      if (requireId) setError(t({ id: 'workflowExample.missingId' }))
      return () => {
        active = false
      }
    }
    setLoading(true)
    findOne(id)
      .then((res) => {
        if (!active) return
        if (!res.success || !res.data || res.data.id !== id) {
          throw new Error(res.message ?? t({ id: 'workflowExample.loadFailed' }))
        }
        form.setFieldsValue({
          title: res.data.title,
          applicant: res.data.applicant,
          department: res.data.department,
          amount: res.data.amount,
          reason: res.data.reason,
        })
        setRecord(res.data)
        setLoaded(true)
      })
      .catch((cause: Error) => {
        if (active) setError(cause?.message ?? t({ id: 'workflowExample.loadFailed' }))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id, requireId, retry, form, t])

  /** 校验并保存；`WorkFlow.StartFlow` 的 beforeSubmit 也走这里。 */
  const saveRecord = async (): Promise<WorkflowRecordView | undefined> => {
    if (!loaded || loading || submitting.current) return undefined
    let values: FormValues
    try {
      values = await form.validateFields()
    } catch {
      message.error(t({ id: 'workflowExample.validateFailed' }))
      return undefined
    }
    submitting.current = true
    setSaving(true)
    setError('')
    try {
      const res = await save({ id, ...values })
      if (!res.success || !res.data) {
        throw new Error(res.message ?? t({ id: 'workflowExample.saveFailed' }))
      }
      if (mounted.current) setRecord(res.data)
      return res.data
    } catch (cause) {
      if (mounted.current) {
        setError((cause as Error)?.message ?? t({ id: 'workflowExample.saveFailed' }))
      }
      return undefined
    } finally {
      submitting.current = false
      if (mounted.current) setSaving(false)
    }
  }

  const handleSave = async () => {
    const saved = await saveRecord()
    if (!saved) return
    message.success(t({ id: 'global.save-success' }))
    history.push('/workflow-example')
  }

  /**
   * 发起流程前先落库：返回业务单据 id 供 BPM 建立流程实例。
   *
   * SUID 把 `beforeStart` 声明成 `() => Promise<void>`，运行时却读取返回值的
   * `success` 与 `data.businessKey`，这里按运行时契约返回，并在调用处做类型收敛。
   */
  const handleBeforeStart = async () => {
    const saved = await saveRecord()
    if (!saved) {
      return { success: false, message: t({ id: 'workflowExample.saveFailed' }) }
    }
    return { success: true, data: { businessKey: saved.id, businessId: saved.id } }
  }

  const handleStartComplete = (res: { success?: boolean }) => {
    if (res?.success) {
      message.success(t({ id: 'workflowExample.startFlowSuccess' }))
      history.push('/workflow-example')
    }
  }

  const disabled = readOnly || loading || saving || !loaded

  return (
    <div className="prototype-page workflow-example-form">
      {error && <Alert showIcon type="error" message={error} />}
      <div className="workflow-example-doc-header">
        <span className="workflow-example-doc-header__code">
          {record?.code ?? t({ id: 'workflowExample.newDoc' })}
        </span>
        {record && <FlowStatusTag status={record.flowStatus} />}
        <span className="workflow-example-doc-header__meta">
          {record?.createdDate ?? ''}
        </span>
      </div>
      <Form
        form={form}
        layout="vertical"
        className="workflow-example-form__body"
        disabled={disabled}
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="title"
              label={t({ id: 'workflowExample.title' })}
              rules={[{ required: true, whitespace: true, message: t({ id: 'workflowExample.title.required' }) }]}
            >
              <Input maxLength={100} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="applicant"
              label={t({ id: 'workflowExample.applicant' })}
              rules={[{ required: true, whitespace: true, message: t({ id: 'workflowExample.applicant.required' }) }]}
            >
              <Input maxLength={40} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="department"
              label={t({ id: 'workflowExample.department' })}
              rules={[{ required: true, message: t({ id: 'workflowExample.department.required' }) }]}
            >
              <ComboList
                style={{ width: '100%' }}
                allowClear
                rowKey="id"
                dataSource={DEPARTMENT_OPTIONS}
                reader={{ textField: 'name' }}
                placeholder={t({ id: 'workflowExample.department.placeholder' })}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="amount"
              label={t({ id: 'workflowExample.amount' })}
              rules={[{ required: true, message: t({ id: 'workflowExample.amount.required' }) }]}
            >
              <MoneyInput style={{ width: '100%' }} min={0} precision={2} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="reason" label={t({ id: 'workflowExample.reason' })}>
              <Input.TextArea rows={3} maxLength={500} showCount />
            </Form.Item>
          </Col>
        </Row>
      </Form>
      <Space>
        {!readOnly && (
          <>
            <Button
              disabled={!loaded || loading}
              loading={saving}
              onClick={() => void handleSave()}
            >
              {t({ id: 'global.save' })}
            </Button>
            {/*
              `WorkFlow.StartFlow` 内部的 children 渲染函数被 useMemo 缓存，
              只在流程内部状态变化时才会重新求值：在这里依赖表单加载态会永久冻结在首帧。
              因此按钮不在 children 里判断 disabled，改为数据就绪后再挂载该组件。
            */}
            {loaded && (
              <WorkFlow.StartFlow
                businessId={record?.id ?? ''}
                businessModelCode={BPM_ENTITY_CODE}
                store={BPM_START_STORE}
                beforeStart={handleBeforeStart as unknown as () => Promise<void>}
                startComplete={handleStartComplete}
                needStartConfirm
                confirmStartTip={t({ id: 'workflowExample.startFlowConfirm' })}
              >
                {(wfLoading) => (
                  <Button type="primary" loading={wfLoading}>
                    {t({ id: 'workflowExample.saveAndStart' })}
                  </Button>
                )}
              </WorkFlow.StartFlow>
            )}
          </>
        )}
        {!!id && !loaded && !loading && (
          <Button onClick={() => setRetry((value) => value + 1)}>
            {t({ id: 'workflowExample.retry' })}
          </Button>
        )}
        <Button disabled={saving} onClick={() => history.push('/workflow-example')}>
          {t({ id: 'global.back' })}
        </Button>
      </Space>
    </div>
  )
}
