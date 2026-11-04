import {
  AppstoreOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
} from "@ant-design/icons"
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Radio,
  Select,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd"
import type { TableColumnsType } from "antd"
import { useMemo, useState } from "react"
import { PageStatCards, type PageStatItem } from "../../components/PageStatCards"
import { PortalIcon } from "../../components/PortalIcon"
import {
  formatSettingsDate,
  makeSettingsId,
  removePortalApplication,
  resetPortalApplications,
  savePortalApplication,
  usePortalSettings,
  type PortalApplication,
  type PortalAppScope,
  type PortalAppTheme,
  type PortalIconKey,
} from "../../app/portal-settings"
import type { AppRoute } from "../../app/hash-navigation"
import "./app-management.css"

const { Text, Title } = Typography

const ROUTE_OPTIONS: Array<{ value: AppRoute; label: string }> = [
  { value: "analytics-cockpit", label: "数据驾驶舱" },
  { value: "app-management", label: "应用管理" },
  { value: "menu-management", label: "菜单管理" },
  { value: "user-settings", label: "用户配置" },
]

const ICON_OPTIONS: Array<{ value: PortalIconKey; label: string }> = [
  { value: "cockpit", label: "数据图表" },
  { value: "apps", label: "应用" },
  { value: "menu", label: "菜单" },
  { value: "monitor", label: "监控屏" },
  { value: "settings", label: "设置" },
  { value: "user", label: "用户" },
]

const CATEGORY_OPTIONS = ["业务平台", "数据分析", "系统管理", "协作工具"].map((value) => ({ value, label: value }))

interface AppFormValues {
  name: string
  code: string
  description?: string
  route?: AppRoute
  category: string
  tags?: string[]
  theme: PortalAppTheme
  illustration: PortalApplication["illustration"]
  icon: PortalIconKey
  scope: PortalAppScope
  visibleOnPortal: boolean
  status: "enabled" | "disabled"
  sort: number
}

function emptyFormValues(): AppFormValues {
  return {
    name: "",
    code: "",
    description: "",
    route: "analytics-cockpit",
    category: "业务平台",
    tags: [],
    theme: "blue",
    illustration: "mall",
    icon: "apps",
    scope: "all",
    visibleOnPortal: true,
    status: "enabled",
    sort: 10,
  }
}

function scopeForApp(app: PortalApplication): PortalAppScope {
  return app.visibleOnPortal ? "all" : "admin"
}

export function AppManagementPage() {
  const [messageApi, contextHolder] = message.useMessage()
  const settings = usePortalSettings()
  const [form] = Form.useForm<AppFormValues>()
  const [keywordDraft, setKeywordDraft] = useState("")
  const [keyword, setKeyword] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "enabled" | "disabled">("all")
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const appRows = useMemo(
    () => [...settings.applications].sort((left, right) => left.sort - right.sort || left.name.localeCompare(right.name, "zh-CN")),
    [settings.applications],
  )

  const filteredRows = useMemo(() => {
    const query = keyword.trim().toLowerCase()
    return appRows.filter((app) => {
      if (statusFilter !== "all" && app.status !== statusFilter) return false
      if (!query) return true
      return `${app.name}${app.code}${app.category}${app.route}${app.tags.join("")}`.toLowerCase().includes(query)
    })
  }, [appRows, keyword, statusFilter])

  const statItems: PageStatItem[] = useMemo(() => {
    const enabled = appRows.filter((app) => app.status === "enabled").length
    const portalVisible = appRows.filter((app) => app.status === "enabled" && app.visibleOnPortal).length
    const categories = new Set(appRows.map((app) => app.category)).size
    return [
      { key: "all", title: "应用总数", value: appRows.length, unit: "个", status: "primary", icon: <AppstoreOutlined />, subText: <span>覆盖 {categories} 个分类</span> },
      { key: "enabled", title: "已启用", value: enabled, unit: "个", status: "success", icon: <CheckCircleOutlined />, subText: <span>可被门户访问</span> },
      { key: "portal", title: "门户展示", value: portalVisible, unit: "个", status: "purple", icon: <EyeOutlined />, subText: <span>首屏入口卡片</span> },
      { key: "routes", title: "已接路由", value: appRows.filter((app) => Boolean(app.route)).length, unit: "个", status: "default", icon: <SettingOutlined />, subText: <span>可配置跳转地址</span> },
    ]
  }, [appRows])

  const openCreate = () => {
    setEditingId(null)
    form.setFieldsValue(emptyFormValues())
    setEditorOpen(true)
  }

  const openEdit = (app: PortalApplication) => {
    setEditingId(app.id)
    form.setFieldsValue({
      name: app.name,
      code: app.code,
      description: app.description,
      route: app.route || undefined,
      category: app.category,
      tags: app.tags,
      theme: app.theme,
      illustration: app.illustration,
      icon: app.icon,
      scope: scopeForApp(app),
      visibleOnPortal: app.visibleOnPortal,
      status: app.status,
      sort: app.sort,
    })
    setEditorOpen(true)
  }

  const handleSave = async () => {
    const values = await form.validateFields()
    const duplicated = appRows.some((app) => app.id !== editingId && app.code.trim().toLowerCase() === values.code.trim().toLowerCase())
    if (duplicated) {
      messageApi.warning("应用编码已存在，请更换后重试")
      return
    }
    const current = appRows.find((app) => app.id === editingId)
    const now = formatSettingsDate()
    savePortalApplication({
      id: editingId ?? makeSettingsId("app"),
      name: values.name.trim(),
      code: values.code.trim(),
      description: values.description?.trim() ?? "",
      route: values.route ?? "",
      category: values.category,
      tags: values.tags ?? [],
      theme: values.theme,
      illustration: values.illustration,
      icon: values.icon,
      status: values.status,
      visibleOnPortal: values.visibleOnPortal,
      sort: values.sort,
      updatedAt: now,
    })
    messageApi.success(current ? "应用配置已更新" : "应用已创建")
    setEditorOpen(false)
  }

  const handleToggleStatus = (app: PortalApplication, checked: boolean) => {
    savePortalApplication({ ...app, status: checked ? "enabled" : "disabled", updatedAt: formatSettingsDate() })
    messageApi.success(`「${app.name}」已${checked ? "启用" : "停用"}`)
  }

  const handleTogglePortal = (app: PortalApplication, checked: boolean) => {
    savePortalApplication({ ...app, visibleOnPortal: checked, updatedAt: formatSettingsDate() })
    messageApi.success(checked ? `「${app.name}」已加入门户首屏` : `「${app.name}」已从门户首屏移除`)
  }

  const handlePreview = (app: PortalApplication) => {
    if (app.status !== "enabled") {
      messageApi.warning("应用已停用，启用后才能预览")
      return
    }
    if (!app.route) {
      messageApi.info(`「${app.name}」尚未配置访问路由`)
      return
    }
    window.location.hash = `#/${app.route}`
  }

  const columns: TableColumnsType<PortalApplication> = [
    {
      title: "应用",
      dataIndex: "name",
      width: 270,
      fixed: "left",
      render: (_, record) => (
        <div className="management-app-cell">
          <span className={`management-app-cell__icon management-app-cell__icon--${record.theme}`}>
            <PortalIcon icon={record.icon} />
          </span>
          <span className="management-app-cell__copy">
            <Text strong>{record.name}</Text>
            <Text type="secondary" className="numeric">{record.code}</Text>
          </span>
        </div>
      ),
    },
    {
      title: "访问路由",
      dataIndex: "route",
      width: 190,
      render: (route: string) => route ? <Tag className="prototype-meta-tag">{route}</Tag> : <Text type="secondary">未配置</Text>,
    },
    { title: "分类", dataIndex: "category", width: 120, render: (value: string) => <Tag color="blue">{value}</Tag> },
    {
      title: "标签",
      dataIndex: "tags",
      width: 230,
      render: (tags: string[]) => (
        <div className="management-tag-list">
          {tags.slice(0, 2).map((tag) => <Tag key={tag} bordered={false}>{tag}</Tag>)}
          {tags.length > 2 && <Tooltip title={tags.slice(2).join("、")}><Tag bordered={false}>+{tags.length - 2}</Tag></Tooltip>}
          {tags.length === 0 && <Text type="secondary">—</Text>}
        </div>
      ),
    },
    {
      title: "门户展示",
      dataIndex: "visibleOnPortal",
      width: 104,
      align: "center",
      render: (visible: boolean, record) => (
        <Switch
          size="small"
          checked={visible}
          onChange={(checked) => handleTogglePortal(record, checked)}
          aria-label={`${record.name}门户展示`}
        />
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 96,
      align: "center",
      render: (status: PortalApplication["status"], record) => (
        <Switch
          size="small"
          checked={status === "enabled"}
          checkedChildren="启用"
          unCheckedChildren="停用"
          onChange={(checked) => handleToggleStatus(record, checked)}
          aria-label={`${record.name}启用状态`}
        />
      ),
    },
    { title: "排序", dataIndex: "sort", width: 76, align: "center", className: "numeric" },
    { title: "更新时间", dataIndex: "updatedAt", width: 116, align: "center", className: "numeric" },
    {
      title: "操作",
      key: "actions",
      width: 160,
      fixed: "right",
      align: "center",
      render: (_, record) => (
        <div className="management-row-actions">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handlePreview(record)}>预览</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>编辑</Button>
          <Popconfirm
            title="删除应用"
            description={`确定删除「${record.name}」吗？`}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            onConfirm={() => {
              removePortalApplication(record.id)
              messageApi.success("应用已删除")
            }}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} aria-label={`删除${record.name}`} />
          </Popconfirm>
        </div>
      ),
    },
  ]

  return (
    <div className="prototype-page management-page">
      {contextHolder}
      <div className="prototype-page-header management-page__header">
        <div>
          <Title level={2}>应用管理</Title>
          <Text type="secondary">维护门户应用入口、访问路由、展示范围与上下线状态，配置结果会同步到门户首屏。</Text>
        </div>
        <div className="management-page__header-actions">
          <Button icon={<ReloadOutlined />} onClick={() => {
            resetPortalApplications()
            messageApi.success("应用配置已恢复默认")
          }}>恢复默认</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建应用</Button>
        </div>
      </div>

      <PageStatCards items={statItems} />

      <Card className="prototype-panel prototype-table-panel management-panel">
        <div className="prototype-toolbar">
          <Form layout="inline" className="prototype-filter-form" onFinish={() => setKeyword(keywordDraft.trim())}>
            <Form.Item label="应用搜索">
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder="应用名称 / 编码 / 路由"
                value={keywordDraft}
                onChange={(event) => setKeywordDraft(event.target.value)}
                style={{ width: 260 }}
              />
            </Form.Item>
            <Form.Item label="状态">
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 120 }}
                options={[
                  { value: "all", label: "全部状态" },
                  { value: "enabled", label: "已启用" },
                  { value: "disabled", label: "已停用" },
                ]}
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>查询</Button>
            </Form.Item>
            <Form.Item>
              <Button onClick={() => {
                setKeywordDraft("")
                setKeyword("")
                setStatusFilter("all")
              }}>重置</Button>
            </Form.Item>
          </Form>
          <Text type="secondary" className="management-result-count">共 {filteredRows.length} 个应用</Text>
        </div>
        <Table<PortalApplication>
          rowKey="id"
          dataSource={filteredRows}
          columns={columns}
          size="middle"
          scroll={{ x: 1450 }}
          pagination={{ pageSize: 8, showSizeChanger: false }}
        />
      </Card>

      <Modal
        title={editingId ? "编辑应用" : "新建应用"}
        open={editorOpen}
        width={720}
        onCancel={() => setEditorOpen(false)}
        onOk={() => void handleSave()}
        okText="保存配置"
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={form} layout="vertical" className="prototype-business-form management-editor-form" initialValues={emptyFormValues()}>
          <div className="management-form-grid">
            <Form.Item name="name" label="应用名称" rules={[{ required: true, message: "请输入应用名称" }]}>
              <Input placeholder="例如：数据驾驶舱" maxLength={30} showCount />
            </Form.Item>
            <Form.Item name="code" label="应用编码" rules={[{ required: true, message: "请输入应用编码" }, { pattern: /^[a-z0-9-]+$/, message: "仅支持小写字母、数字和短横线" }]}>
              <Input placeholder="例如：analytics-cockpit" disabled={Boolean(editingId)} />
            </Form.Item>
            <Form.Item name="category" label="应用分类" rules={[{ required: true, message: "请选择分类" }]}>
              <Select options={CATEGORY_OPTIONS} />
            </Form.Item>
            <Form.Item name="route" label="访问路由">
              <Select allowClear placeholder="暂不配置" options={ROUTE_OPTIONS} />
            </Form.Item>
            <Form.Item name="icon" label="应用图标" rules={[{ required: true, message: "请选择图标" }]}>
              <Select options={ICON_OPTIONS} />
            </Form.Item>
            <Form.Item name="sort" label="显示顺序" rules={[{ required: true, message: "请填写排序" }]}>
              <InputNumber min={0} max={999} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="theme" label="卡片主题">
              <Radio.Group optionType="button" buttonStyle="solid" options={[{ value: "blue", label: "品牌蓝" }, { value: "teal", label: "青绿色" }]} />
            </Form.Item>
            <Form.Item name="illustration" label="插图风格">
              <Select options={[{ value: "mall", label: "商城场景" }, { value: "fulfillment", label: "履约场景" }, { value: "carrier", label: "承运场景" }]} />
            </Form.Item>
          </div>
          <Form.Item name="tags" label="能力标签">
            <Select mode="tags" maxCount={5} placeholder="输入标签后回车，最多 5 个" tokenSeparators={[","]} />
          </Form.Item>
          <Form.Item name="description" label="应用说明">
            <Input.TextArea rows={3} maxLength={160} showCount placeholder="说明应用面向的用户与核心能力" />
          </Form.Item>
          <div className="management-form-switches">
            <Form.Item name="visibleOnPortal" label="门户展示" valuePropName="checked">
              <Switch checkedChildren="展示" unCheckedChildren="隐藏" />
            </Form.Item>
            <Form.Item name="status" label="启用状态" valuePropName="checked" getValueProps={(value) => ({ checked: value === "enabled" })} normalize={(checked: boolean) => checked ? "enabled" : "disabled"}>
              <Switch checkedChildren="启用" unCheckedChildren="停用" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  )
}

export default AppManagementPage
