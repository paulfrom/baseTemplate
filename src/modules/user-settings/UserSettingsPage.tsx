import {
  BellOutlined,
  CheckOutlined,
  KeyOutlined,
  LaptopOutlined,
  LockOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
  SaveOutlined,
  SettingOutlined,
  SkinOutlined,
  UserOutlined,
} from "@ead/suid-icons"
import {
  Alert,
  Avatar,
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  message,
  Select,
  Switch,
  Tabs,
  Tag,
  Typography,
} from "@ead/suid"
import { useState } from "react"
import type { PrototypeThemeId } from "../../app/AppShell"
import {
  formatSettingsDate,
  updatePortalUser,
  usePortalSettings,
  type PortalNotificationPreferences,
  type PortalThemePreference,
} from "../../app/portal-settings"
import "../../styles/management-pages.css"
import "./user-settings.css"

const { Text, Title } = Typography

const THEME_OPTIONS: Array<{ value: PortalThemePreference; name: string; description: string; color: string }> = [
  { value: "light", name: "建筑蓝", description: "经典浅色，严谨专业", color: "#008ee0" },
  { value: "dark", name: "山野黑", description: "夜间模式，护眼低眩", color: "#177ddc" },
  { value: "aurora", name: "云境白", description: "极简顶栏，开阔视野", color: "#18181b" },
  { value: "obsidian", name: "星穹夜", description: "顶栏暗黑，沉浸指挥", color: "#818cf8" },
  { value: "slate", name: "玄武岩", description: "中度灰阶，现代克制", color: "#38bdf8" },
]

const AVATAR_COLORS = ["#008ee0", "#13c2c2", "#7b61ff", "#d97706", "#db2777", "#475569"]

interface ProfileFormValues {
  userName: string
  employeeNo: string
  department: string
  role: string
  email: string
  phone: string
  bio?: string
}

interface PreferenceFormValues {
  homeRoute: "portal" | "analytics-cockpit" | "menu-management" | "app-management" | "user-settings"
  language: "zh-CN" | "en-US"
  density: "comfortable" | "compact"
}

interface NotificationFormValues extends PortalNotificationPreferences {}

interface PasswordFormValues {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

interface UserSettingsPageProps {
  currentTheme?: PrototypeThemeId
  onThemeSelect?: (themeId: PrototypeThemeId) => void
}

export function UserSettingsPage({ currentTheme, onThemeSelect }: UserSettingsPageProps) {
  const [messageApi, contextHolder] = message.useMessage()
  const settings = usePortalSettings()
  const [profileForm] = Form.useForm<ProfileFormValues>()
  const [preferenceForm] = Form.useForm<PreferenceFormValues>()
  const [notificationForm] = Form.useForm<NotificationFormValues>()
  const [passwordForm] = Form.useForm<PasswordFormValues>()
  const [avatarColor, setAvatarColor] = useState(settings.user.avatarColor)
  const [selectedTheme, setSelectedTheme] = useState<PortalThemePreference>(settings.user.defaultTheme)
  const userName = Form.useWatch("userName", profileForm) || settings.user.userName

  const handleSaveProfile = async () => {
    const values = await profileForm.validateFields()
    updatePortalUser({
      ...values,
      userName: values.userName.trim(),
      bio: values.bio?.trim() ?? "",
      avatarColor,
    })
    messageApi.success("个人资料已保存，顶部用户信息已同步更新")
  }

  const handleSavePreferences = async () => {
    const values = await preferenceForm.validateFields()
    updatePortalUser({ ...values, defaultTheme: selectedTheme })
    try {
      window.localStorage.setItem("prototype_theme_id", selectedTheme)
    } catch {
      // localStorage 不可用时仅保留当前会话内设置。
    }
    onThemeSelect?.(selectedTheme)
    messageApi.success("偏好设置已保存并应用到当前门户")
  }

  const handleSaveNotifications = async () => {
    const values = await notificationForm.validateFields()
    updatePortalUser({ notifications: values })
    messageApi.success("通知偏好已保存")
  }

  const handleChangePassword = async () => {
    await passwordForm.validateFields()
    passwordForm.resetFields()
    messageApi.success("原型环境已模拟修改密码，未连接真实认证服务")
  }

  const tabItems = [
    {
      key: "profile",
      label: <span><UserOutlined />基本资料</span>,
      children: (
        <div className="user-settings-panel">
          <div className="user-settings-profile-head">
            <div className="user-settings-avatar-wrap">
              <Avatar size={72} style={{ backgroundColor: avatarColor }}>{userName.slice(0, 1)}</Avatar>
              <div className="user-settings-avatar-picker" aria-label="头像颜色">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={avatarColor === color ? "is-selected" : ""}
                    style={{ backgroundColor: color }}
                    onClick={() => setAvatarColor(color)}
                    aria-label={`选择头像颜色 ${color}`}
                  >
                    {avatarColor === color && <CheckOutlined />}
                  </button>
                ))}
              </div>
            </div>
            <div className="user-settings-profile-copy">
              <Title level={3}>{userName}</Title>
              <div className="user-settings-profile-tags">
                <Tag color="blue">{settings.user.role}</Tag>
                <Tag>{settings.user.department}</Tag>
                <Text type="secondary">工号 {settings.user.employeeNo}</Text>
              </div>
              <Text type="secondary">账号状态正常 · 最近登录 {formatSettingsDate()} 09:24</Text>
            </div>
          </div>
          <Form
            form={profileForm}
            layout="vertical"
            className="prototype-business-form user-settings-form"
            initialValues={{
              userName: settings.user.userName,
              employeeNo: settings.user.employeeNo,
              department: settings.user.department,
              role: settings.user.role,
              email: settings.user.email,
              phone: settings.user.phone,
              bio: settings.user.bio,
            }}
          >
            <div className="user-settings-form-grid">
              <Form.Item name="userName" label="显示名称" rules={[{ required: true, message: "请输入显示名称" }]}>
                <Input maxLength={20} showCount />
              </Form.Item>
              <Form.Item name="employeeNo" label="员工工号">
                <Input disabled />
              </Form.Item>
              <Form.Item name="department" label="所属部门" rules={[{ required: true, message: "请输入所属部门" }]}>
                <Input />
              </Form.Item>
              <Form.Item name="role" label="平台角色">
                <Input disabled />
              </Form.Item>
              <Form.Item name="email" label="联系邮箱" rules={[{ type: "email", message: "请输入有效的邮箱地址" }]}>
                <Input prefix={<MailOutlined />} />
              </Form.Item>
              <Form.Item name="phone" label="手机号码">
                <Input />
              </Form.Item>
            </div>
            <Form.Item name="bio" label="个人简介">
              <Input.TextArea rows={3} maxLength={120} showCount placeholder="简要描述职责或关注领域" />
            </Form.Item>
            <div className="user-settings-form-actions">
              <Button type="primary" icon={<SaveOutlined />} onClick={() => void handleSaveProfile()}>保存资料</Button>
              <Button onClick={() => profileForm.resetFields()}>重置</Button>
            </div>
          </Form>
        </div>
      ),
    },
    {
      key: "preferences",
      label: <span><SkinOutlined />偏好设置</span>,
      children: (
        <div className="user-settings-panel">
          <Alert
            type="info"
            showIcon
            title="偏好会保存在当前浏览器"
            description="主题选择会立即应用到当前门户，并作为下次打开时的默认主题；其他偏好用于演示门户个性化能力。"
          />
          <section className="user-settings-section">
            <div className="user-settings-section__head">
              <Title level={4}>界面主题</Title>
              <Text type="secondary">当前生效：{THEME_OPTIONS.find((theme) => theme.value === (currentTheme ?? selectedTheme))?.name ?? "建筑蓝"}</Text>
            </div>
            <div className="user-settings-theme-grid" role="radiogroup" aria-label="默认主题">
              {THEME_OPTIONS.map((theme) => {
                const active = selectedTheme === theme.value
                return (
                  <button
                    key={theme.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    className={`user-settings-theme-card ${active ? "is-active" : ""}`}
                    onClick={() => setSelectedTheme(theme.value)}
                  >
                    <span className="user-settings-theme-card__preview" style={{ background: theme.color }}>
                      <span />
                      <span />
                      <span />
                    </span>
                    <span className="user-settings-theme-card__copy">
                      <strong>{theme.name}</strong>
                      <small>{theme.description}</small>
                    </span>
                    {active && <CheckOutlined className="user-settings-theme-card__check" />}
                  </button>
                )
              })}
            </div>
          </section>
          <Form
            form={preferenceForm}
            layout="vertical"
            className="prototype-business-form user-settings-form"
            initialValues={{
              homeRoute: settings.user.homeRoute,
              language: settings.user.language,
              density: settings.user.density,
            }}
          >
            <div className="user-settings-form-grid">
              <Form.Item name="homeRoute" label="默认首页">
                <Select
                  options={[
                    { value: "portal", label: "门户入口" },
                    { value: "analytics-cockpit", label: "数据驾驶舱" },
                    { value: "menu-management", label: "菜单管理" },
                    { value: "app-management", label: "应用管理" },
                    { value: "user-settings", label: "用户配置" },
                  ]}
                />
              </Form.Item>
              <Form.Item name="language" label="界面语言">
                <Select options={[{ value: "zh-CN", label: "简体中文" }, { value: "en-US", label: "English（占位）" }]} />
              </Form.Item>
              <Form.Item name="density" label="内容密度">
                <Select options={[{ value: "comfortable", label: "舒适" }, { value: "compact", label: "紧凑" }]} />
              </Form.Item>
            </div>
            <div className="user-settings-form-actions">
              <Button type="primary" icon={<SaveOutlined />} onClick={() => void handleSavePreferences()}>保存偏好</Button>
            </div>
          </Form>
        </div>
      ),
    },
    {
      key: "notifications",
      label: <span><BellOutlined />通知设置</span>,
      children: (
        <div className="user-settings-panel">
          <div className="user-settings-section__head">
            <Title level={4}>消息触达方式</Title>
            <Text type="secondary">控制哪些渠道可以接收门户消息与业务提醒。</Text>
          </div>
          <Form
            form={notificationForm}
            layout="vertical"
            className="prototype-business-form user-settings-form"
            initialValues={settings.user.notifications}
          >
            <div className="user-settings-switch-list">
              {[
                { name: "website", icon: <BellOutlined />, title: "站内消息", description: "接收门户消息中心的新消息提醒" },
                { name: "email", icon: <MailOutlined />, title: "邮件通知", description: "将重要通知同步发送到联系邮箱" },
                { name: "browser", icon: <LaptopOutlined />, title: "浏览器通知", description: "浏览器桌面通知（需授权，原型仅演示开关）" },
                { name: "sound", icon: <SettingOutlined />, title: "消息提示音", description: "新消息到达时播放提示音" },
              ].map((item) => (
                <div key={item.name} className="user-settings-switch-row">
                  <span className="user-settings-switch-row__icon">{item.icon}</span>
                  <span className="user-settings-switch-row__copy">
                    <strong>{item.title}</strong>
                    <small>{item.description}</small>
                  </span>
                  <Form.Item name={item.name} valuePropName="checked" noStyle>
                    <Switch checkedChildren="开启" unCheckedChildren="关闭" aria-label={item.title} />
                  </Form.Item>
                </div>
              ))}
            </div>
            <div className="user-settings-form-actions">
              <Button type="primary" icon={<SaveOutlined />} onClick={() => void handleSaveNotifications()}>保存通知设置</Button>
            </div>
          </Form>
        </div>
      ),
    },
    {
      key: "security",
      label: <span><SafetyCertificateOutlined />安全设置</span>,
      children: (
        <div className="user-settings-panel">
          <div className="user-settings-security-grid">
            <Card className="user-settings-security-card">
              <div className="user-settings-security-card__head">
                <span className="user-settings-security-card__icon"><LockOutlined /></span>
                <div>
                  <Title level={4}>修改密码</Title>
                  <Text type="secondary">建议定期更换登录密码，原型不会提交真实请求。</Text>
                </div>
              </div>
              <Form form={passwordForm} layout="vertical" className="prototype-business-form user-settings-form">
                <Form.Item name="oldPassword" label="当前密码" rules={[{ required: true, message: "请输入当前密码" }]}>
                  <Input.Password prefix={<KeyOutlined />} placeholder="请输入当前密码" />
                </Form.Item>
                <Form.Item name="newPassword" label="新密码" rules={[{ required: true, min: 6, message: "密码至少 6 位" }]}>
                  <Input.Password prefix={<LockOutlined />} placeholder="至少 6 位字符" />
                </Form.Item>
                <Form.Item
                  name="confirmPassword"
                  label="确认新密码"
                  dependencies={["newPassword"]}
                  rules={[
                    { required: true, message: "请再次输入新密码" },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        return !value || getFieldValue("newPassword") === value
                          ? Promise.resolve()
                          : Promise.reject(new Error("两次输入的密码不一致"))
                      },
                    }),
                  ]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="再次输入新密码" />
                </Form.Item>
                <Button type="primary" onClick={() => void handleChangePassword()}>模拟修改密码</Button>
              </Form>
            </Card>
            <Card className="user-settings-security-card">
              <div className="user-settings-security-card__head">
                <span className="user-settings-security-card__icon"><LaptopOutlined /></span>
                <div>
                  <Title level={4}>登录设备</Title>
                  <Text type="secondary">以下为原型演示会话，不包含真实设备信息。</Text>
                </div>
              </div>
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="当前设备">Chrome · Linux · 127.0.0.1</Descriptions.Item>
                <Descriptions.Item label="登录时间">{formatSettingsDate()} 09:24</Descriptions.Item>
                <Descriptions.Item label="会话状态"><Tag color="success">在线</Tag></Descriptions.Item>
              </Descriptions>
              <div className="user-settings-form-actions">
                <Button danger onClick={() => messageApi.info("原型环境仅保留当前会话，未执行真实退出")}>退出其他设备（演示）</Button>
              </div>
            </Card>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="prototype-page user-settings-page">
      {contextHolder}
      <div className="prototype-page-header user-settings-page__header">
        <div>
          <Title level={2}>用户配置</Title>
          <Text type="secondary">集中维护个人资料、门户主题、消息通知与安全设置，修改后实时同步到当前门户外壳。</Text>
        </div>
        <Tag color="blue" icon={<UserOutlined />}>当前用户：{settings.user.userName}</Tag>
      </div>
      <Card className="prototype-panel user-settings-card">
        <Tabs items={tabItems} defaultActiveKey="profile" />
      </Card>
    </div>
  )
}

export default UserSettingsPage
