import { App, Button, Form, Input, Select, Typography } from '@ead/suid'
import type { InputRef } from '@ead/suid'
import { useEffect, useRef, useState } from 'react'
import { APP_TITLE, LOGIN_STATUS } from '../../utils/constants'
import { formatMessage } from '../../utils/intl'
import { getGlobalState, login, refreshVerifyCode, setLocale, type LocaleId } from '../../models/global'
import { history, useLocation } from '../../utils/navigation'
import './login.css'

const FormItem = Form.Item
const { Option } = Select

/**
 * 登录页，迁自公司模板 `src/pages/Login`。
 *
 * 差异：模板用 dva 的 `global` model + `request` 连真实认证服务；
 * 本仓库是纯前端原型，改由 `models/global` 的本地模型 + `services/api` 的 Mock 实现，
 * 表单结构、校验规则、验证码和多租户分支保持一致。
 */
export default function LoginPage() {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const userInputRef = useRef<InputRef>(null)
  const loginReqIdRef = useRef<string>(crypto.randomUUID())
  const { query } = useLocation()
  const [submitting, setSubmitting] = useState(false)
  // 全局模型里的字段会随登录分支变化，这里订阅一次拿到最新值。
  const global = getGlobalState()
  const [showTenant, setShowTenant] = useState(global.showTenant)
  const [showVerifyCode, setShowVerifyCode] = useState(global.showVerifyCode)
  const [verifyCode, setVerifyCode] = useState(global.verifyCode)
  const [locale, setLocaleState] = useState<LocaleId>(global.locale)

  const handleVerify = async () => {
    const image = await refreshVerifyCode(loginReqIdRef.current)
    setVerifyCode(image)
    if (!image) message.error('获取验证码失败')
  }

  // 进入页面时聚焦账号并取一次验证码；后续由点击图片刷新。
  useEffect(() => {
    userInputRef.current?.focus()
    let active = true
    void refreshVerifyCode(loginReqIdRef.current).then((image) => {
      if (active) setVerifyCode(image)
    })
    return () => {
      active = false
    }
  }, [])

  const handleSubmit = async (values: {
    account: string
    password: string
    verifyCode?: string
    tenant?: string
    locale: LocaleId
  }) => {
    setSubmitting(true)
    try {
      const result = await login({
        account: values.account,
        password: values.password,
        verifyCode: values.verifyCode,
        tenant: values.tenant,
        reqId: loginReqIdRef.current,
      })
      setLocaleState(values.locale)
      setLocale(values.locale)
      setShowTenant(getGlobalState().showTenant)
      setShowVerifyCode(getGlobalState().showVerifyCode)
      setVerifyCode(getGlobalState().verifyCode)
      const from = query.from
      switch (result.loginStatus) {
        case LOGIN_STATUS.SUCCESS:
          message.success(formatMessage({ id: 'login.success' }))
          if (from && from.indexOf('/user/login') === -1) {
            history.push(from === '/' ? '/dashboard' : from)
          } else {
            history.push('/dashboard')
          }
          break
        case LOGIN_STATUS.MULTI_TENANT:
          message.warning(formatMessage({ id: 'login.multiTenant' }))
          break
        case LOGIN_STATUS.CAPTCHA_ERROR:
          message.error(formatMessage({ id: 'login.captchaError' }))
          await handleVerify()
          break
        case LOGIN_STATUS.FROZEN:
          message.error(formatMessage({ id: 'login.frozen' }))
          break
        case LOGIN_STATUS.LOCKED:
          message.error(formatMessage({ id: 'login.locked' }))
          break
        default:
          message.error(result.message ?? formatMessage({ id: 'login.failure' }))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-form">
        <div className="login-logo">
          <div className="login-name">{`${APP_TITLE} · ${formatMessage({ id: 'login.title' })}`}</div>
        </div>
        <Form
          form={form}
          initialValues={{ locale }}
          style={{ maxWidth: 300, margin: '0 auto' }}
          onFinish={handleSubmit}
        >
          {showTenant && (
            <FormItem
              name="tenant"
              rules={[{ required: true, message: formatMessage({ id: 'login.tenant.required' }) }]}
            >
              <Input autoFocus size="large" placeholder={formatMessage({ id: 'login.tenant' })} />
            </FormItem>
          )}
          <FormItem
            name="account"
            rules={[{ required: true, message: formatMessage({ id: 'login.account.required' }) }]}
          >
            <Input
              ref={userInputRef}
              size="large"
              placeholder={formatMessage({ id: 'login.account' })}
            />
          </FormItem>
          <FormItem
            name="password"
            rules={[{ required: true, message: formatMessage({ id: 'login.password.required' }) }]}
          >
            <Input
              size="large"
              type="password"
              placeholder={formatMessage({ id: 'login.password' })}
            />
          </FormItem>
          {showVerifyCode && verifyCode ? (
            <FormItem
              name="verifyCode"
              rules={[
                { required: true, message: formatMessage({ id: 'login.verifyCode.required' }) },
              ]}
            >
              <Input
                size="large"
                disabled={submitting}
                placeholder={formatMessage({ id: 'login.verifyCode' })}
                addonAfter={
                  <img
                    alt={formatMessage({ id: 'login.verifyCode' })}
                    onClick={() => void handleVerify()}
                    src={verifyCode}
                    style={{ height: 22, cursor: 'pointer' }}
                  />
                }
              />
            </FormItem>
          ) : null}
          <FormItem
            name="locale"
            rules={[{ required: true, message: formatMessage({ id: 'login.locale.required' }) }]}
          >
            <Select
              size="large"
              onChange={(value: LocaleId) => {
                setLocaleState(value)
                setLocale(value)
              }}
            >
              <Option value="zh-CN">简体中文</Option>
              <Option value="en-US">English</Option>
            </Select>
          </FormItem>
          <FormItem label={null}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              className="login-form-button"
              block
              loading={submitting}
            >
              {formatMessage({ id: 'login.submit' })}
            </Button>
          </FormItem>
        </Form>
        <Typography.Paragraph type="secondary" style={{ textAlign: 'center', marginBottom: 0 }}>
          {formatMessage({ id: 'login.mockHint' })}
        </Typography.Paragraph>
      </div>
    </div>
  )
}
