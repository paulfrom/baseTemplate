import {
  ApartmentOutlined,
  CheckCircleOutlined,
  MenuOutlined,
  ReloadOutlined,
  SearchOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons"
import {
  Button,
  Card,
  Form,
  Input,
  message,
  Select,
  Switch,
  Table,
  Tag,
  Typography,
} from "antd"
import type { TableColumnsType } from "antd"
import { useMemo, useState } from "react"
import { PageStatCards, type PageStatItem } from "../../components/PageStatCards"
import { PortalIcon } from "../../components/PortalIcon"
import {
  resetPortalMenus,
  setPortalMenuVisibility,
  usePortalSettings,
  type PortalMenuItem,
} from "../../app/portal-settings"
import "./menu-management.css"

const { Text, Title } = Typography

type MenuRow = PortalMenuItem & { groupName: string }

export function MenuManagementPage() {
  const [messageApi, contextHolder] = message.useMessage()
  const settings = usePortalSettings()
  const [keywordDraft, setKeywordDraft] = useState("")
  const [keyword, setKeyword] = useState("")
  const [visibleFilter, setVisibleFilter] = useState<"all" | "visible" | "hidden">("all")

  // 页面行直接来自 portal-settings 中的当前 Router 快照，只允许修改展示勾选。
  const routeRows = useMemo<MenuRow[]>(() => settings.menus
    .filter((menu) => menu.type === "page")
    .map((menu) => ({
      ...menu,
      groupName: menu.parentId
        ? settings.menus.find((parent) => parent.id === menu.parentId)?.name ?? "未分组"
        : "顶级菜单",
    }))
    .sort((left, right) => left.sort - right.sort || left.name.localeCompare(right.name, "zh-CN")), [settings.menus])

  const filteredRows = useMemo(() => {
    const query = keyword.trim().toLowerCase()
    return routeRows.filter((menu) => {
      if (visibleFilter === "visible" && !menu.visible) return false
      if (visibleFilter === "hidden" && menu.visible) return false
      if (!query) return true
      return `${menu.name}${menu.route}${menu.permission}${menu.groupName}`.toLowerCase().includes(query)
    })
  }, [keyword, routeRows, visibleFilter])

  const statItems: PageStatItem[] = useMemo(() => {
    const visibleCount = routeRows.filter((item) => item.visible).length
    const groupCount = new Set(routeRows.map((item) => item.groupName)).size
    const permissionCount = routeRows.filter((item) => Boolean(item.permission)).length
    return [
      { key: "all", title: "当前路由", value: routeRows.length, unit: "项", status: "primary", icon: <MenuOutlined />, subText: <span>全部来自 Router 配置</span> },
      { key: "visible", title: "导航中展示", value: visibleCount, unit: "项", status: "success", icon: <CheckCircleOutlined />, subText: <span>取消勾选即可隐藏</span> },
      { key: "groups", title: "导航分组", value: groupCount, unit: "个", status: "purple", icon: <ApartmentOutlined />, subText: <span>分组由路由元数据决定</span> },
      { key: "permissions", title: "权限标识", value: permissionCount, unit: "个", status: "warning", icon: <SafetyCertificateOutlined />, subText: <span>仅作原型展示</span> },
    ]
  }, [routeRows])

  const handleToggleVisible = (menu: PortalMenuItem, checked: boolean) => {
    setPortalMenuVisibility(menu.id, checked)
    messageApi.success(`「${menu.name}」已${checked ? "加入" : "移出"}导航展示`)
  }

  const columns: TableColumnsType<MenuRow> = [
    {
      title: "菜单名称",
      dataIndex: "name",
      width: 250,
      render: (_, record) => (
        <div className="management-menu-cell">
          <span className="management-menu-cell__icon management-menu-cell__icon--page">
            <PortalIcon icon={record.icon} />
          </span>
          <span className="management-menu-cell__copy">
            <Text strong>{record.name}</Text>
            <Text type="secondary">当前 Router 页面</Text>
          </span>
        </div>
      ),
    },
    {
      title: "所属分组",
      dataIndex: "groupName",
      width: 150,
      render: (groupName: string) => <Tag color={groupName === "顶级菜单" ? "default" : "purple"}>{groupName}</Tag>,
    },
    {
      title: "路由标识",
      dataIndex: "route",
      width: 200,
      render: (route: string) => <Tag className="prototype-meta-tag">{route}</Tag>,
    },
    {
      title: "权限标识",
      dataIndex: "permission",
      width: 220,
      render: (permission: string) => permission ? <Text code>{permission}</Text> : <Text type="secondary">未配置</Text>,
    },
    {
      title: "导航展示",
      dataIndex: "visible",
      width: 110,
      align: "center",
      render: (visible: boolean, record) => (
        <Switch
          size="small"
          checked={visible}
          onChange={(checked) => handleToggleVisible(record, checked)}
          aria-label={`${record.name}导航展示`}
        />
      ),
    },
    { title: "路由排序", dataIndex: "sort", width: 100, align: "center", className: "numeric" },
    { title: "最近调整", dataIndex: "updatedAt", width: 120, align: "center", className: "numeric" },
  ]

  return (
    <div className="prototype-page management-page">
      {contextHolder}
      <div className="prototype-page-header management-page__header">
        <div>
          <Title level={2}>菜单管理</Title>
          <Text type="secondary">菜单数据来源于当前 Router，支持按名称、路由、分组和权限筛选；取消“导航展示”勾选即可隐藏入口。</Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => {
          resetPortalMenus()
          messageApi.success("导航展示已恢复 Router 默认配置")
        }}>恢复默认展示</Button>
      </div>

      <PageStatCards items={statItems} />

      <Card className="prototype-panel prototype-table-panel management-panel">
        <div className="prototype-toolbar">
          <Form layout="inline" className="prototype-filter-form" onFinish={() => setKeyword(keywordDraft.trim())}>
            <Form.Item label="菜单筛选">
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder="名称 / 路由 / 分组 / 权限"
                value={keywordDraft}
                onChange={(event) => setKeywordDraft(event.target.value)}
                style={{ width: 260 }}
              />
            </Form.Item>
            <Form.Item label="展示状态">
              <Select
                value={visibleFilter}
                onChange={setVisibleFilter}
                style={{ width: 120 }}
                options={[
                  { value: "all", label: "全部状态" },
                  { value: "visible", label: "导航中展示" },
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
          <Text type="secondary" className="management-result-count">筛选结果 {filteredRows.length} / {routeRows.length} 项</Text>
        </div>
        <Table<MenuRow>
          rowKey="id"
          dataSource={filteredRows}
          columns={columns}
          size="middle"
          scroll={{ x: 1160 }}
          pagination={false}
        />
      </Card>
    </div>
  )
}

export default MenuManagementPage
