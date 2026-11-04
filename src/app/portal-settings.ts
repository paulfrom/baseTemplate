import { useSyncExternalStore } from "react"
import type { AppRoute } from "./hash-navigation"

/**
 * 门户基础配置的唯一本地事实源。
 * 原型阶段不接后端，菜单、应用与用户偏好统一保存在 localStorage，
 * 并通过 useSyncExternalStore 让门户、外壳与管理页实时同步。
 */

export type PortalAppStatus = "enabled" | "disabled"
export type PortalAppScope = "all" | "admin" | "developer"
export type PortalAppTheme = "blue" | "teal"
export type PortalIconKey = "cockpit" | "menu" | "apps" | "user" | "settings" | "monitor"
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
    id: "app-cockpit",
    name: "数据驾驶舱",
    code: "analytics-cockpit",
    description: "面向管理层的运营数据可视化大屏：全国运输轨迹地图、区域指标下钻、核心 KPI 趋势与承运商分析一屏总览。",
    route: "analytics-cockpit",
    category: "数据分析",
    tags: ["全国轨迹地图", "区域下钻", "指标趋势", "承运商分析"],
    theme: "teal",
    illustration: "fulfillment",
    icon: "cockpit",
    status: "enabled",
    visibleOnPortal: true,
    sort: 10,
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
    id: "app-menu-management",
    name: "菜单管理",
    code: "menu-management",
    description: "维护门户导航的分组、页面入口、显示顺序与可见性。",
    route: "menu-management",
    category: "系统管理",
    tags: ["导航配置", "权限标识"],
    theme: "blue",
    illustration: "mall",
    icon: "menu",
    status: "enabled",
    visibleOnPortal: false,
    sort: 40,
    updatedAt: DEFAULT_DATE,
  },
  {
    id: "app-management",
    name: "应用管理",
    code: "app-management",
    description: "维护门户应用卡片、访问路由、分类与上下线状态。",
    route: "app-management",
    category: "系统管理",
    tags: ["应用卡片", "门户配置"],
    theme: "teal",
    illustration: "carrier",
    icon: "apps",
    status: "enabled",
    visibleOnPortal: false,
    sort: 50,
    updatedAt: DEFAULT_DATE,
  },
  {
    id: "app-user-settings",
    name: "用户配置",
    code: "user-settings",
    description: "维护当前演示用户的资料、主题偏好、通知与安全设置。",
    route: "user-settings",
    category: "系统管理",
    tags: ["个人资料", "偏好设置"],
    theme: "blue",
    illustration: "mall",
    icon: "user",
    status: "enabled",
    visibleOnPortal: false,
    sort: 60,
    updatedAt: DEFAULT_DATE,
  },
]

const DEFAULT_MENUS: PortalMenuItem[] = [
  {
    id: "analytics-cockpit",
    name: "数据驾驶舱",
    parentId: null,
    type: "page",
    route: "analytics-cockpit",
    icon: "cockpit",
    visible: true,
    sort: 10,
    permission: "portal:analytics:view",
    updatedAt: DEFAULT_DATE,
  },
  {
    id: "system-config-group",
    name: "系统配置",
    parentId: null,
    type: "group",
    route: "",
    icon: "settings",
    visible: true,
    sort: 20,
    permission: "",
    updatedAt: DEFAULT_DATE,
  },
  {
    id: "menu-management",
    name: "菜单管理",
    parentId: "system-config-group",
    type: "page",
    route: "menu-management",
    icon: "menu",
    visible: true,
    sort: 21,
    permission: "system:menu:manage",
    updatedAt: DEFAULT_DATE,
  },
  {
    id: "app-management",
    name: "应用管理",
    parentId: "system-config-group",
    type: "page",
    route: "app-management",
    icon: "apps",
    visible: true,
    sort: 22,
    permission: "system:app:manage",
    updatedAt: DEFAULT_DATE,
  },
  {
    id: "user-settings",
    name: "用户配置",
    parentId: "system-config-group",
    type: "page",
    route: "user-settings",
    icon: "user",
    visible: true,
    sort: 23,
    permission: "system:user:config",
    updatedAt: DEFAULT_DATE,
  },
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
    ? input.applications.filter((item): item is PortalApplication => isRecord(item) && typeof item.id === "string" && typeof item.name === "string")
    : defaults.applications
  const menus = Array.isArray(input.menus)
    ? input.menus.filter((item): item is PortalMenuItem => isRecord(item) && typeof item.id === "string" && typeof item.name === "string")
    : defaults.menus
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
    applications: applications.length ? applications : defaults.applications,
    menus: menus.length ? menus : defaults.menus,
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
  const applications = settingsState.applications.some((item) => item.id === application.id)
    ? settingsState.applications.map((item) => (item.id === application.id ? application : item))
    : [...settingsState.applications, application]
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

export function savePortalMenu(menu: PortalMenuItem) {
  const menus = settingsState.menus.some((item) => item.id === menu.id)
    ? settingsState.menus.map((item) => (item.id === menu.id ? menu : item))
    : [...settingsState.menus, menu]
  commit({ ...settingsState, menus })
}

export function removePortalMenu(menuId: string) {
  commit({
    ...settingsState,
    menus: settingsState.menus.filter((item) => item.id !== menuId),
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
