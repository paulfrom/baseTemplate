import {
  ApartmentOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  FolderOpenOutlined,
  MenuOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SafetyCertificateOutlined,
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
  removePortalMenu,
  resetPortalMenus,
  savePortalMenu,
  usePortalSettings,
  type PortalIconKey,
  type PortalMenuItem,
  type PortalMenuType,
} from "../../app/portal-settings"
import type { AppRoute } from "../../app/hash-navigation"
import "./menu-management.css"

const { Text, Title } = Typography

const ROUTE_OPTIONS: Array<{ value: AppRoute; label: string }> = [
  { value: "analytics-cockpit", label: "数据驾驶舱" },
  { value: "menu-management", label: "菜单管理" },
  { value: "app-management", label: "应用管理" },
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

interface MenuFormValues {
  name: string
  type: PortalMenuType
  parentId?: string
  route?: AppRoute
  icon: PortalIconKey
  permission?: string
  sort: number
  visible: boolean
}

function emptyMenuValues(): MenuFormValues {
  return {
    name: "",
    type: "page",
    parentId: undefined,
    route: "menu-management",
    icon: "menu",
    permission: "",
    sort: 30,
    visible: true,
  }
}

function buildMenuTree(items: PortalMenuItem[], query: string): PortalMenuItem[] {
  const normalized = query.trim().toLowerCase()
  const sorted = [...items].sort((left, right) => left.sort - right.sort || left.name.localeCompare(right.name, "zh-CN"))
  const childrenByParent = new Map<string, PortalMenuItem[]>()
  sorted.forEach((item) => {
    if (!item.parentId) return
    const current = childrenByParent.get(item.parentId) ?? []
    current.push(item)
    childrenByParent.set(item.parentId, current)
  })

  const toNode = (item: PortalMenuItem): PortalMenuItem & { children?: PortalMenuItem[] } => {
    const children = childrenByParent.get(item.id) ?? []
    const selfMatches = !normalized || `${item.name}${item.route}${item.permission}`.toLowerCase().includes(normalized)
    const matchedChildren = children.map(toNode).filter((child) => child.children?.length || !normalized || `${child.name}${child.route}${child.permission}`.toLowerCase().includes(normalized))
    if (normalized && !selfMatches && !matchedChildren.length) {
      return { ...item, children: [] }
    }
    return { ...item, children: matchedChildren }
  }

  return sorted.filter((item) => !item.parentId).map(toNode).filter((item) => !normalized || item.children?.length || `${item.name}${item.route}${item.permission}`.toLowerCase().includes(normalized))
}

export function MenuManagementPage() {
  const [messageApi, contextHolder] = message.useMessage()
  const settings = usePortalSettings()
  const [form] = Form.useForm<MenuFormValues>()
  const menuType = Form.useWatch("type", form)
  const [keywordDraft, setKeywordDraft] = useState("")
  const [keyword, setKeyword] = useState("")
  const [visibleFilter, setVisibleFilter] = useState<"all" | "visible" | "hidden">("all")
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const allMenus = settings.menus
  const groupMenus = useMemo(() => allMenus.filter((item) => item.type === "group"), [allMenus])

  const filteredMenus = useMemo(() => {
    const filtered = allMenus.filter((item) => {
      if (visibleFilter === "visible" && !item.visible) return false
      if (visibleFilter === "hidden" && item.visible) return false
      return true
    })
    return buildMenuTree(filtered, keyword)
  }, [allMenus, keyword, visibleFilter])

  const statItems: PageStatItem[] = useMemo(() => {
    const visibleCount = allMenus.filter((item) => item.visible).length
    const groupCount = allMenus.filter((item) => item.type === "group").length
    const permissionCount = allMenus.filter((item) => Boolean(item.permission)).length
    return [
      { key: "all", title: "菜单节点", value: allMenus.length, unit: "项", status: "primary", icon: <MenuOutlined />, subText: <span>{groupCount} 个分组 · {allMenus.length - groupCount} 个页面</span> },
      { key: "visible", title: "已显示", value: visibleCount, unit: "项", status: "success", icon: <CheckCircleOutlined />, subText: <span>在门户导航中可见</span> },
      { key: "groups", title: "导航分组", value: groupCount, unit: "个", status: "purple", icon: <ApartmentOutlined />, subText: <span>支持两级菜单结构</span> },
      { key: "permissions", title: "权限标识", value: permissionCount, unit: "个", status: "warning", icon: <SafetyCertificateOutlined />, subText: <span>页面级权限控制点</span> },
    ]
  }, [allMenus])

  const openCreate = (parentId?: string) => {
    setEditingId(null)
    form.setFieldsValue({
      ...emptyMenuValues(),
      parentId,
      type: parentId ? "page" : "page",
      sort: Math.max(10, ...allMenus.map((item) => item.sort)) + 10,
    })
    setEditorOpen(true)
  }

  const openEdit = (menu: PortalMenuItem) => {
    setEditingId(menu.id)
    form.setFieldsValue({
      name: menu.name,
      type: menu.type,
      parentId: menu.parentId ?? undefined,
      route: menu.route || undefined,
      icon: menu.icon,
      permission: menu.permission,
      sort: menu.sort,
      visible: menu.visible,
    })
    setEditorOpen(true)
  }

  const handleSave = async () => {
    const values = await form.validateFields()
    if (values.type === "page" && !values.route) {
      messageApi.warning("页面菜单必须选择访问路由")
      return
    }
    if (values.parentId === editingId) {
      messageApi.warning("菜单不能挂载到自己下面")
      return
    }
    if (values.type === "group" && values.route) {
      values.route = undefined
    }
    const current = allMenus.find((item) => item.id === editingId)
    savePortalMenu({
      id: editingId ?? makeSettingsId("menu"),
      name: values.name.trim(),
      parentId: values.parentId ?? null,
      type: values.type,
      route: values.route ?? "",
      icon: values.icon,
      visible: values.visible,
      sort: values.sort,
      permission: values.permission?.trim() ?? "",
      updatedAt: formatSettingsDate(),
    })
    messageApi.success(current ? "菜单配置已更新" : "菜单已创建")
    setEditorOpen(false)
  }

  const handleToggleVisible = (menu: PortalMenuItem, checked: boolean) => {
    savePortalMenu({ ...menu, visible: checked, updatedAt: formatSettingsDate() })
    messageApi.success(`「${menu.name}」已${checked ? "显示" : "隐藏"}`)
  }

  const handleDelete = (menu: PortalMenuItem) => {
    const hasChildren = allMenus.some((item) => item.parentId === menu.id)
    if (hasChildren) {
      messageApi.warning("请先删除该分组下的页面菜单")
      return
    }
    removePortalMenu(menu.id)
    messageApi.success("菜单已删除")
  }

  const columns: TableColumnsType<PortalMenuItem> = [
    {
      title: "菜单名称",
      dataIndex: "name",
      width: 300,
      render: (_, record) => (
        <div className="management-menu-cell">
          <span className={`management-menu-cell__icon management-menu-cell__icon--${record.type}`}>
            <PortalIcon icon={record.icon} />
          </span>
          <span className="management-menu-cell__copy">
            <Text strong>{record.name}</Text>
            <Text type="secondary">{record.type === "group" ? "目录分组" : "页面菜单"}</Text>
          </span>
        </div>
      ),
    },
    {
      title: "路由标识",
      dataIndex: "route",
      width: 190,
      render: (route: string) => route ? <Tag className="prototype-meta-tag">{route}</Tag> : <Text type="secondary">—</Text>,
    },
    {
      title: "权限标识",
      dataIndex: "permission",
      width: 220,
      render: (permission: string) => permission ? <Text code>{permission}</Text> : <Text type="secondary">未配置</Text>,
    },
    {
      title: "显示",
      dataIndex: "visible",
      width: 92,
      align: "center",
      render: (visible: boolean, record) => (
        <Switch
          size="small"
          checked={visible}
          onChange={(checked) => handleToggleVisible(record, checked)}
          aria-label={`${record.name}显示状态`}
        />
      ),
    },
    { title: "排序", dataIndex: "sort", width: 76, align: "center", className: "numeric" },
    { title: "最近更新", dataIndex: "updatedAt", width: 116, align: "center", className: "numeric" },
    {
      title: "操作",
      key: "actions",
      width: 170,
      fixed: "right",
      align: "center",
      render: (_, record) => (
        <div className="management-row-actions">
          {record.type === "group" && (
            <Tooltip title="新增子菜单">
              <Button type="link" size="small" icon={<PlusOutlined />} onClick={() => openCreate(record.id)} aria-label={`在${record.name}下新增菜单`} />
            </Tooltip>
          )}
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>编辑</Button>
          <Popconfirm
            title="删除菜单"
            description={`确定删除「${record.name}」吗？`}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record)}
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
          <Title level={2}>菜单管理</Title>
          <Text type="secondary">维护门户导航层级、页面路由、权限标识与显示顺序，保存后侧边栏和顶部导航即时更新。</Text>
        </div>
        <div className="management-page__header-actions">
          <Button icon={<ReloadOutlined />} onClick={() => {
            resetPortalMenus()
            messageApi.success("菜单配置已恢复默认")
          }}>恢复默认</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openCreate()}>新增菜单</Button>
        </div>
      </div>

      <PageStatCards items={statItems} />

      <Card className="prototype-panel prototype-table-panel management-panel">
        <div className="prototype-toolbar">
          <Form layout="inline" className="prototype-filter-form" onFinish={() => setKeyword(keywordDraft.trim())}>
            <Form.Item label="菜单搜索">
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder="菜单名称 / 路由 / 权限标识"
                value={keywordDraft}
                onChange={(event) => setKeywordDraft(event.target.value)}
                style={{ width: 280 }}
              />
            </Form.Item>
            <Form.Item label="显示状态">
              <Select
                value={visibleFilter}
                onChange={setVisibleFilter}
                style={{ width: 120 }}
                options={[
                  { value: "all", label: "全部状态" },
                  { value: "visible", label: "已显示" },
                  { value: "hidden", label: "已隐藏" },
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
                setVisibleFilter("all")
              }}>重置</Button>
            </Form.Item>
          </Form>
          <Text type="secondary" className="management-result-count">共 {allMenus.length} 个菜单节点</Text>
        </div>
        <Table<PortalMenuItem>
          rowKey="id"
          dataSource={filteredMenus}
          columns={columns}
          size="middle"
          scroll={{ x: 1180 }}
          pagination={false}
          expandable={{ defaultExpandAllRows: true }}
        />
      </Card>

      <Modal
        title={editingId ? "编辑菜单" : "新增菜单"}
        open={editorOpen}
        width={680}
        onCancel={() => setEditorOpen(false)}
        onOk={() => void handleSave()}
        okText="保存菜单"
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={form} layout="vertical" className="prototype-business-form management-editor-form" initialValues={emptyMenuValues()}>
          <div className="management-form-grid">
            <Form.Item name="name" label="菜单名称" rules={[{ required: true, message: "请输入菜单名称" }]}>
              <Input placeholder="例如：菜单管理" maxLength={20} showCount />
            </Form.Item>
            <Form.Item name="type" label="菜单类型" rules={[{ required: true }]}>
              <Radio.Group
                optionType="button"
                buttonStyle="solid"
                options={[
                  { value: "page", label: "页面菜单" },
                  { value: "group", label: "目录分组" },
                ]}
              />
            </Form.Item>
            <Form.Item name="parentId" label="上级菜单">
              <Select
                allowClear
                placeholder="顶级菜单"
                options={groupMenus.filter((menu) => menu.id !== editingId).map((menu) => ({ value: menu.id, label: menu.name }))}
              />
            </Form.Item>
            {menuType !== "group" && (
              <Form.Item name="route" label="访问路由" rules={[{ required: true, message: "请选择访问路由" }]}>
                <Select placeholder="选择已注册路由" options={ROUTE_OPTIONS} />
              </Form.Item>
            )}
            <Form.Item name="icon" label="菜单图标" rules={[{ required: true, message: "请选择图标" }]}>
              <Select options={ICON_OPTIONS} />
            </Form.Item>
            <Form.Item name="sort" label="显示顺序" rules={[{ required: true, message: "请填写排序" }]}>
              <InputNumber min={0} max={999} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="permission" label="权限标识">
              <Input placeholder="例如：system:menu:manage" />
            </Form.Item>
            <Form.Item name="visible" label="导航显示" valuePropName="checked">
              <Switch checkedChildren="显示" unCheckedChildren="隐藏" />
            </Form.Item>
          </div>
          <div className="menu-management-tip">
            <FolderOpenOutlined />
            <span>目录分组只承载子菜单，不参与路由跳转；页面菜单保存后会立即出现在门户导航中（受显示开关控制）。</span>
          </div>
        </Form>
      </Modal>
    </div>
  )
}

export default MenuManagementPage
