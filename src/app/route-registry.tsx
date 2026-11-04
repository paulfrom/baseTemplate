import { lazy } from "react"
import type { PrototypeThemeId } from "./AppShell"
import type { AppRoute } from "./hash-navigation"

/**
 * 路由渲染注册表：route → lazy 页面组件的单一事实源。
 * App.tsx 不静态加载业务页面；新增页面时在这里补 lazy 加载与 switch 分支，
 * 并同步更新 hash-navigation.ts 的 AppRoute 与 AppShell.tsx 的菜单/文案映射。
 */

const AnalyticsCockpitPage = lazy(() => import("../modules/analytics-cockpit").then((m) => ({ default: m.AnalyticsCockpitPage })))
const SampleRequestPage = lazy(() => import("../modules/sample-request"))
const MenuManagementPage = lazy(() => import("../modules/menu-management").then((m) => ({ default: m.MenuManagementPage })))
const AppManagementPage = lazy(() => import("../modules/app-management").then((m) => ({ default: m.AppManagementPage })))
const UserSettingsPage = lazy(() => import("../modules/user-settings").then((m) => ({ default: m.UserSettingsPage })))

interface MainRouteContext {
  navigate: (route: AppRoute) => void
  currentTheme: PrototypeThemeId
  onSelectTheme: (themeId: PrototypeThemeId) => void
}

/** 主平台（AppShell 内）路由的渲染适配：需要额外 props 的页面在 switch 中传入。 */
export function renderMainRoute(route: AppRoute, ctx: MainRouteContext) {
  switch (route) {
    case "sample-request":
      return <SampleRequestPage />
    case "analytics-cockpit":
      return <AnalyticsCockpitPage />
    case "menu-management":
      return <MenuManagementPage />
    case "app-management":
      return <AppManagementPage />
    case "user-settings":
      return <UserSettingsPage currentTheme={ctx.currentTheme} onThemeSelect={ctx.onSelectTheme} />
    default:
      return null
  }
}
