import { useSyncExternalStore } from "react"
import { PORTAL_ROUTE_DEFINITIONS, type AppRoute, type PortalRouteIcon } from "../../config/router.config"

/**
 * 门户基础配置的唯一本地事实源。
 * 原型阶段不接后端，菜单、应用与用户偏好统一保存在 localStorage，
 * 并通过 useSyncExternalStore 让门户、外壳与管理页实时同步。
 */

export type PortalAppStatus = "enabled" | "disabled"
export type PortalAppScope = "all" | "admin" | "developer"
export type PortalAppTheme = "blue" | "teal"
export type PortalIconKey = PortalRouteIcon
export type PortalMenuType = "group" | "page"
export type PortalThemePreference = "light" | "dark" | "aurora" | "obsidian" | "slate"

export interface PortalApplication {
  id: string
  name: string
  code: string
  description: string
  route: AppRoute | ""
  category: string
  tags: string[]
  theme: PortalAppTheme
  illustration: "mall" | "fulfillment" | "carrier"
  icon: PortalIconKey
  status: PortalAppStatus
  visibleOnPortal: boolean
  sort: number
  updatedAt: string
}

export interface PortalMenuItem {
  id: string
  name: string
  parentId: string | null
  type: PortalMenuType
  route: AppRoute | ""
  icon: PortalIconKey
  visible: boolean
  sort: number
  permission: string
  updatedAt: string
}

export interface PortalNotificationPreferences {
  website: boolean
  email: boolean
  browser: boolean
  sound: boolean
}

export interface PortalUserPreferences {
  userName: string
  employeeNo: string
  department: string
  role: string
  email: string
  phone: string
  bio: string
  avatarColor: string
  defaultTheme: PortalThemePreference
  homeRoute: AppRoute
  language: "zh-CN" | "en-US"
  density: "comfortable" | "compact"
  notifications: PortalNotificationPreferences
}

export interface PortalSettings {
  version: 1
  applications: PortalApplication[]
  menus: PortalMenuItem[]
  user: PortalUserPreferences
}

const STORAGE_KEY = "prototype_portal_settings_v1"
const DEFAULT_DATE = "2026-08-18"

const DEFAULT_APPLICATIONS: PortalApplication[] = [
  {
    id: "app-sample-request",
    name: "申请单示例",
    code: "sample-request",
    description: "ExtTable 列表 + 共用主表单 + 独立详情页的 CRUD 样例，字段校验与操作反馈与公司模板保持一致。",
    route: "sample-request",
    category: "业务平台",
    tags: ["ExtTable", "表单校验", "模拟数据"],
    theme: "teal",
    illustration: "fulfillment",
    icon: "menu",
    status: "enabled",
    visibleOnPortal: true,
    sort: 10,
    updatedAt: DEFAULT_DATE,
  },
  {
    id: "app-workflow-example",
    name: "流程示例",
    code: "workflow-example",
    description: "费用申请单的流程样例：ExtTable 列表 + 共用主表单 + 只读详情 + WorkFlow 审批办理，BPM 契约由 MSW 模拟。",
    route: "workflow-example",
    category: "业务平台",
    tags: ["WorkFlow", "流程审批", "模拟数据"],
    theme: "blue",
    illustration: "mall",
    icon: "menu",
    status: "enabled",
    visibleOnPortal: true,
    sort: 15,
    updatedAt: DEFAULT_DATE,
  },
  {
    id: "app-example-a",
    name: "业务平台示例 A",
    code: "business-platform-a",
    description: "模板占位卡片：复制这份卡片配置、新建模块目录并注册路由，即可在门户接入一个新的业务平台入口。",
    route: "",
    category: "业务平台",
    tags: ["占位示例", "复制即用"],
    theme: "blue",
    illustration: "mall",
    icon: "apps",
    status: "enabled",
    visibleOnPortal: true,
    sort: 20,
    updatedAt: DEFAULT_DATE,
  },
  {
    id: "app-example-b",
    name: "业务平台示例 B",
    code: "business-platform-b",
    description: "模板占位卡片：与示例 A 相同，用于演示三列栅格下的多平台入口布局，接入真实平台后删除或替换。",
    route: "",
    category: "业务平台",
    tags: ["占位示例", "复制即用"],
    theme: "blue",
    illustration: "carrier",
    icon: "monitor",
    status: "enabled",
    visibleOnPortal: true,
    sort: 30,
    updatedAt: DEFAULT_DATE,
  },
  {
    id: "app-dashboard",
    name: "工作台",
    code: "dashboard",
    description: "登录后的欢迎页，展示当前演示用户与常用入口。",
    route: "dashboard",
    category: "系统管理",
    tags: ["工作台", "欢迎页"],
    theme: "blue",
    illustration: "mall",
    icon: "cockpit",
    status: "enabled",
    visibleOnPortal: false,
    sort: 40,
    updatedAt: DEFAULT_DATE,
  },
]

const ROUTE_GROUPS = new Map<string, string>()
PORTAL_ROUTE_DEFINITIONS.forEach((definition) => {
  if (definition.groupId) ROUTE_GROUPS.set(definition.groupId, definition.groupLabel)
})

const DEFAULT_MENUS: PortalMenuItem[] = [
  ...PORTAL_ROUTE_DEFINITIONS.map((definition) => ({
    id: definition.route,
    name: definition.label,
    parentId: definition.groupId,
    type: "page" as const,
    route: definition.route,
    icon: definition.icon,
    visible: definition.defaultVisible,
    sort: definition.sort,
    permission: definition.permission,
    updatedAt: DEFAULT_DATE,
  })),
  ...Array.from(ROUTE_GROUPS, ([groupId, groupLabel], index) => ({
    id: groupId,
    name: groupLabel,
    parentId: null,
    type: "group" as const,
    route: "" as const,
    icon: "settings" as const,
    visible: true,
    sort: 20 + index,
    permission: "",
    updatedAt: DEFAULT_DATE,
  })),
]

const DEFAULT_USER: PortalUserPreferences = {
  userName: "管理员",
  employeeNo: "SEI-0001",
  department: "数字化平台中心",
  role: "平台管理员",
  email: "admin@baseTemplate.local",
  phone: "138****8888",
  bio: "负责统一门户的菜单、应用与用户偏好配置。",
  avatarColor: "#008ee0",
  defaultTheme: "light",
  homeRoute: "portal",
  language: "zh-CN",
  density: "comfortable",
  notifications: {
    website: true,
    email: true,
    browser: false,
    sound: true,
  },
}

export function createDefaultPortalSettings(): PortalSettings {
  return {
    version: 1,
    applications: DEFAULT_APPLICATIONS.map((app) => ({ ...app, tags: [...app.tags] })),
    menus: DEFAULT_MENUS.map((menu) => ({ ...menu })),
    user: { ...DEFAULT_USER, notifications: { ...DEFAULT_USER.notifications } },
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function normalizeSettings(input: unknown): PortalSettings {
  const defaults = createDefaultPortalSettings()
  if (!isRecord(input)) return defaults

  const applications = Array.isArray(input.applications)
    ? input.applications
        .filter((item): item is PortalApplication => isRecord(item) && typeof item.id === "string" && typeof item.name === "string")
        .map((application) => ({
          ...application,
          // 应用不提供启停切换，历史版本保存的 disabled 状态也统一归一为可用。
          status: "enabled" as const,
          tags: Array.isArray(application.tags) ? application.tags.filter((tag): tag is string => typeof tag === "string") : [],
        }))
    : defaults.applications

  // 菜单名称、层级、路由和权限完全以当前 Router 为准，只恢复用户保存的展示勾选。
  const savedVisibility = new Map<string, boolean>()
  if (Array.isArray(input.menus)) {
    input.menus.forEach((item) => {
      if (isRecord(item) && typeof item.id === "string" && typeof item.visible === "boolean") {
        savedVisibility.set(item.id, item.visible)
      }
    })
  }
  const menus = defaults.menus.map((menu) => ({
    ...menu,
    visible: menu.type === "page" ? savedVisibility.get(menu.id) ?? menu.visible : true,
  }))

  const user = isRecord(input.user)
    ? {
        ...defaults.user,
        ...input.user,
        notifications: {
          ...defaults.user.notifications,
          ...(isRecord(input.user.notifications) ? input.user.notifications : {}),
        },
      }
    : defaults.user
  return {
    version: 1,
    applications,
    menus,
    user: user as PortalUserPreferences,
  }
}

function readSettings(): PortalSettings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? normalizeSettings(JSON.parse(raw)) : createDefaultPortalSettings()
  } catch {
    return createDefaultPortalSettings()
  }
}

let settingsState: PortalSettings = readSettings()
const listeners = new Set<() => void>()

function commit(next: PortalSettings) {
  settingsState = next
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // 原型在隐私模式或存储配额不足时仍保持内存态可用。
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return settingsState
}

export function usePortalSettings(): PortalSettings {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export function getPortalSettings(): PortalSettings {
  return settingsState
}

export function updatePortalUser(patch: Partial<PortalUserPreferences>) {
  commit({
    ...settingsState,
    user: {
      ...settingsState.user,
      ...patch,
      notifications: patch.notifications ?? settingsState.user.notifications,
    },
  })
}

export function savePortalApplication(application: PortalApplication) {
  const nextApplication = { ...application, status: "enabled" as const }
  const applications = settingsState.applications.some((item) => item.id === application.id)
    ? settingsState.applications.map((item) => (item.id === application.id ? nextApplication : item))
    : [...settingsState.applications, nextApplication]
  commit({ ...settingsState, applications })
}

export function removePortalApplication(applicationId: string) {
  commit({
    ...settingsState,
    applications: settingsState.applications.filter((item) => item.id !== applicationId),
  })
}

export function resetPortalApplications() {
  commit({ ...settingsState, applications: createDefaultPortalSettings().applications })
}

export function setPortalMenuVisibility(menuId: string, visible: boolean) {
  const target = settingsState.menus.find((menu) => menu.id === menuId && menu.type === "page")
  if (!target) return
  commit({
    ...settingsState,
    menus: settingsState.menus.map((menu) => menu.id === target.id
      ? { ...menu, visible, updatedAt: formatSettingsDate() }
      : menu),
  })
}

export function resetPortalMenus() {
  commit({ ...settingsState, menus: createDefaultPortalSettings().menus })
}

export function resetPortalSettings() {
  commit(createDefaultPortalSettings())
}

export function makeSettingsId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function formatSettingsDate(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}
