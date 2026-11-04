import { useEffect, useState } from "react"

/** 当前 Router 的页面元数据：菜单管理只读取这里，不允许脱离路由新增菜单。 */
export type PortalRouteIcon = "cockpit" | "menu" | "apps" | "user" | "settings" | "monitor"

export interface PortalRouteDefinition {
  route: AppRoute
  label: string
  groupId: string | null
  groupLabel: string
  icon: PortalRouteIcon
  permission: string
  sort: number
  defaultVisible: boolean
}

export type AppRoute =
  | "portal"
  | "analytics-cockpit"
  | "sample-request"
  | "menu-management"
  | "app-management"
  | "user-settings"

export const PORTAL_ROUTE_DEFINITIONS: readonly PortalRouteDefinition[] = [
  {
    route: "sample-request",
    label: "申请单示例",
    groupId: null,
    groupLabel: "顶级菜单",
    icon: "menu",
    permission: "sample:request:view",
    sort: 15,
    defaultVisible: true,
  },
  {
    route: "portal",
    label: "门户入口",
    groupId: null,
    groupLabel: "顶级菜单",
    icon: "apps",
    permission: "portal:home:view",
    sort: 0,
    defaultVisible: false,
  },
  {
    route: "analytics-cockpit",
    label: "数据驾驶舱",
    groupId: null,
    groupLabel: "顶级菜单",
    icon: "cockpit",
    permission: "portal:analytics:view",
    sort: 10,
    defaultVisible: true,
  },
  {
    route: "menu-management",
    label: "菜单管理",
    groupId: "system-config-group",
    groupLabel: "系统配置",
    icon: "menu",
    permission: "system:menu:manage",
    sort: 21,
    defaultVisible: true,
  },
  {
    route: "app-management",
    label: "应用管理",
    groupId: "system-config-group",
    groupLabel: "系统配置",
    icon: "apps",
    permission: "system:app:manage",
    sort: 22,
    defaultVisible: true,
  },
  {
    route: "user-settings",
    label: "用户配置",
    groupId: "system-config-group",
    groupLabel: "系统配置",
    icon: "user",
    permission: "system:user:config",
    sort: 23,
    defaultVisible: true,
  },
]

const defaultRoute: AppRoute = "portal"
const knownRoutes = new Set<AppRoute>(PORTAL_ROUTE_DEFINITIONS.map((definition) => definition.route))

export function isAppRoute(value: string): value is AppRoute {
  return knownRoutes.has(value as AppRoute)
}

function readHash(): AppRoute {
  const candidate = window.location.hash.replace(/^#\/?/, "").split("?")[0] as AppRoute
  return knownRoutes.has(candidate) ? candidate : defaultRoute
}

export function useHashNavigation() {
  const [route, setRoute] = useState<AppRoute>(readHash)

  useEffect(() => {
    const onHashChange = () => setRoute(readHash())
    window.addEventListener("hashchange", onHashChange)
    return () => window.removeEventListener("hashchange", onHashChange)
  }, [])

  const navigate = (nextRoute: AppRoute) => {
    if (window.location.hash.replace(/^#\/?/, "").split("?")[0] === nextRoute) return
    window.location.hash = `#${nextRoute}`
  }

  return { route, navigate }
}
