import { useEffect, useState } from "react"

/**
 * 模板路由表：新增页面时在这里补充路由 id，
 * 然后同步更新 route-registry.tsx（渲染）与 AppShell.tsx（菜单与文案映射）。
 */
export type AppRoute =
  | "portal"
  | "analytics-cockpit"
  | "menu-management"
  | "app-management"
  | "user-settings"

const defaultRoute: AppRoute = "portal"
const knownRoutes = new Set<AppRoute>([
  "portal",
  "analytics-cockpit",
  "menu-management",
  "app-management",
  "user-settings",
])

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
