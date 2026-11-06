import { Alert, App, Button, Form, Input, Space } from '@ead/suid'
import { useEffect, useRef, useState } from 'react'
import { getIntl } from '../../../utils/intl'
import { history, useLocation } from '../../../utils/navigation'
import { findOne, save } from '../service'

/**
 * 申请单编辑页（普通编辑与只读查看共用同一主表单），
 * 迁自公司模板 `src/pages/SampleRequest/Form/index.jsx`。
 */
export default function SampleRequestForm({
  readOnly = false,
  requireId = false,
}: {
  readOnly?: boolean
  requireId?: boolean
}) {
  const { search } = useLocation()
  const id = new URLSearchParams(search).get('id') || undefined
  return (
    <RequestEditor
      key={`${id ?? 'new'}:${readOnly}:${requireId}`}
      id={id}
      readOnly={readOnly}
      requireId={requireId}
    />
  )
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
    setLoaded(!id && !requireId)
    setError('')
    if (!id) {
      setLoading(false)
      if (requireId) setError(t({ id: 'sampleRequest.missingId' }))
      return () => {
        active = false
      }
    }
    setLoading(true)
    findOne(id)
      .then((res) => {
        if (!active) return
        if (!res.success || !res.data || res.data.id !== id) {
          throw new Error(res.message ?? t({ id: 'sampleRequest.loadFailed' }))
        }
        form.setFieldsValue({ code: res.data.code, title: res.data.title })
        setLoaded(true)
      })
      .catch((cause: Error) => {
        if (active) setError(cause?.message ?? t({ id: 'sampleRequest.loadFailed' }))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id, requireId, retry, form, t])

  const handleFinish = async (values: { code: string; title: string }) => {
    if (readOnly || !loaded || loading || submitting.current) return
    submitting.current = true
    setSaving(true)
    setError('')
    try {
      const res = await save({ id, code: values.code, title: values.title })
      if (!res.success) throw new Error(res.message ?? t({ id: 'sampleRequest.saveFailed' }))
      if (!mounted.current) return
      message.success(t({ id: 'global.save-success' }))
      history.push('/sample-request')
    } catch (cause) {
      if (mounted.current) setError((cause as Error)?.message ?? t({ id: 'sampleRequest.saveFailed' }))
    } finally {
      submitting.current = false
      if (mounted.current) setSaving(false)
    }
  }

  const rules = (field: 'code' | 'title', max: number) => [
    { required: true, whitespace: true, message: t({ id: `sampleRequest.${field}.required` }) },
    {
      transform: (value?: string) => value?.trim(),
      max,
      message: t({ id: 'sampleRequest.tooLong' }, { max }),
    },
  ]

  return (
    <div className="prototype-page sample-request-form">
      {error && <Alert showIcon type="error" message={error} />}
      <Form
        form={form}
        layout="vertical"
        disabled={readOnly || loading || saving || !loaded}
        onFinish={handleFinish}
      >
        <Form.Item name="code" label={t({ id: 'sampleRequest.code' })} rules={rules('code', 64)}>
          <Input />
        </Form.Item>
        <Form.Item
          name="title"
          label={t({ id: 'sampleRequest.title' })}
          rules={rules('title', 200)}
        >
          <Input />
        </Form.Item>
      </Form>
      <Space>
        {!readOnly && (
          <Button
            type="primary"
            disabled={!loaded || loading}
            loading={saving}
            onClick={() => form.submit()}
          >
            {t({ id: 'global.save' })}
          </Button>
        )}
        {!!id && !loaded && !loading && (
          <Button onClick={() => setRetry((value) => value + 1)}>
            {t({ id: 'sampleRequest.retry' })}
          </Button>
        )}
        <Button disabled={saving} onClick={() => history.push('/sample-request')}>
          {t({ id: 'global.back' })}
        </Button>
      </Space>
    </div>
  )
}
