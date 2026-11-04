import {
  AppstoreOutlined,
  BgColorsOutlined,
  CheckOutlined,
  DownOutlined,
  HomeOutlined,
  LeftOutlined,
  LogoutOutlined,
  MenuOutlined,
  MoonOutlined,
  RightOutlined,
  SunOutlined,
  UserOutlined,
} from "@ant-design/icons"
import { Avatar, Button, Dropdown, Layout, Menu, message, Tooltip } from "antd"
import type { MenuProps } from "antd"
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { PortalIcon } from "../components/PortalIcon"
import { isAppRoute, type AppRoute } from "./hash-navigation"
import { usePortalSettings, type PortalIconKey, type PortalMenuItem } from "./portal-settings"

/**
 * 模板应用外壳：侧边栏 / 顶栏双布局、五套主题、面包屑与菜单高亮的框架实现。
 * 新增页面时的接线点：
 * 1. hash-navigation.ts 补 AppRoute；
 * 2. route-registry.tsx 补 lazy 渲染分支；
 * 3. 本文件补 routeLabels / systemLabels（必填）与 routeGroupLabels /
 *    routeToGroupMap / routeToOpenKeys（有分组菜单时填）；可见菜单由 portal-settings 驱动。
 */

export function SidebarToggleIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="1.75"
        y="2"
        width="12.5"
        height="12"
        rx="2.75"
        stroke="currentColor"
        strokeWidth="1.35"
      />
      <line
        x1="5.75"
        y1="2"
        x2="5.75"
        y2="14"
        stroke="currentColor"
        strokeWidth="1.35"
      />
    </svg>
  )
}

const { Content, Header, Sider } = Layout

const routeLabels: Record<AppRoute, string> = {
  portal: "门户入口",
  "analytics-cockpit": "数据驾驶舱",
  "menu-management": "菜单管理",
  "app-management": "应用管理",
  "user-settings": "用户配置",
}

const routeGroupLabels: Partial<Record<AppRoute, string>> = {
  "menu-management": "系统配置",
  "app-management": "系统配置",
  "user-settings": "系统配置",
}

const routeToGroupMap: Partial<Record<AppRoute, string>> = {
  "menu-management": "system-config-group",
  "app-management": "system-config-group",
  "user-settings": "system-config-group",
}

const systemLabels: Record<AppRoute, string> = {
  portal: "baseTemplate",
  "analytics-cockpit": "baseTemplate",
  "menu-management": "baseTemplate",
  "app-management": "baseTemplate",
  "user-settings": "baseTemplate",
}

const MENU_ICON_NODES: Record<PortalIconKey, ReactNode> = {
  cockpit: <PortalIcon icon="cockpit" />,
  menu: <PortalIcon icon="menu" />,
  apps: <PortalIcon icon="apps" />,
  user: <PortalIcon icon="user" />,
  settings: <PortalIcon icon="settings" />,
  monitor: <PortalIcon icon="monitor" />,
}

type NavigationItem = { key: string; label: string; icon?: ReactNode; children?: NavigationItem[] }

function buildNavigationItems(menus: PortalMenuItem[], includeIcons: boolean): NavigationItem[] {
  const visibleMenus = [...menus].filter((item) => item.visible).sort((left, right) => left.sort - right.sort || left.name.localeCompare(right.name, "zh-CN"))
  const childrenByParent = new Map<string, PortalMenuItem[]>()
  visibleMenus.forEach((item) => {
    if (!item.parentId) return
    const children = childrenByParent.get(item.parentId) ?? []
    children.push(item)
    childrenByParent.set(item.parentId, children)
  })
  const mapItem = (item: PortalMenuItem): NavigationItem => {
    const children = childrenByParent.get(item.id)?.map(mapItem)
    return {
      // 页面菜单以路由作为导航 key；新增菜单的 id 是本地随机值，不能拿它当路由。
      key: item.type === "page" && item.route ? item.route : item.id,
      label: item.name,
      ...(includeIcons ? { icon: MENU_ICON_NODES[item.icon] } : {}),
      ...(children?.length ? { children } : {}),
    }
  }
  return visibleMenus.filter((item) => !item.parentId).map(mapItem)
}

// 顶部与侧边共用菜单树，三级菜单在顶部保留父级名称以区分同名页面。
function navigationLeaves(items: NavigationItem[], parents: string[] = []): { key: string; label: string }[] {
  return items.flatMap((item) => {
    return item.children?.length
      ? navigationLeaves(item.children, [...parents, item.label])
      : [{ key: item.key, label: [...parents, item.label].filter(Boolean).join(" / ") }]
  })
}

function useAutoHideScrollbars() {
  useEffect(() => {
    const root = document.documentElement
    const scrollingTargets: (Window | HTMLElement)[] = [
      window,
      root,
      ...Array.from(document.querySelectorAll<HTMLElement>("[data-auto-hide-scrollbar]")),
    ]

    const timers = new Map<Window | HTMLElement, ReturnType<typeof window.setTimeout>>()
    const handlers = new Map<Window | HTMLElement, EventListener>()
    const markScrolling = (target: Window | HTMLElement) => {
      const element: HTMLElement = target === window ? root : target as HTMLElement
      element.classList.add("is-scrolling")
      const previousTimer = timers.get(target)
      if (previousTimer !== undefined) window.clearTimeout(previousTimer)
      timers.set(target, window.setTimeout(() => {
        element.classList.remove("is-scrolling")
        timers.delete(target)
      }, 600))
    }

    scrollingTargets.forEach((target) => {
      const handler: EventListener = () => markScrolling(target)
      handlers.set(target, handler)
      target.addEventListener("scroll", handler, { passive: true })
    })

    return () => {
      scrollingTargets.forEach((target) => {
        const handler = handlers.get(target)
        if (handler) target.removeEventListener("scroll", handler)
        const timer = timers.get(target)
        if (timer !== undefined) window.clearTimeout(timer)
      })
      scrollingTargets.forEach((target) => {
        const element: HTMLElement = target === window ? root : target as HTMLElement
        element.classList.remove("is-scrolling")
      })
    }
  }, [])
}

const routeSubGroupLabels: Partial<Record<AppRoute, string>> = {}

const routeToOpenKeys: Partial<Record<AppRoute, string[]>> = {}

function getMenuPath(menus: PortalMenuItem[], route: AppRoute): PortalMenuItem[] {
  const current = menus.find((menu) => menu.type === "page" && menu.route === route)
  if (!current) return []
  const path: PortalMenuItem[] = []
  const visited = new Set<string>()
  let parentId = current.parentId
  while (parentId && !visited.has(parentId)) {
    visited.add(parentId)
    const parent = menus.find((menu) => menu.id === parentId)
    if (!parent) break
    path.unshift(parent)
    parentId = parent.parentId
  }
  return path
}

function getBreadcrumbLabels(route: AppRoute, menus: PortalMenuItem[] = []): string[] {
  const currentMenu = menus.find((menu) => menu.type === "page" && menu.route === route)
  const menuPath = getMenuPath(menus, route)
  const groupLabels = menuPath.length ? menuPath.map((menu) => menu.name) : [routeGroupLabels[route]]
  const labels = [systemLabels[route], ...groupLabels, routeSubGroupLabels[route], currentMenu?.name ?? routeLabels[route]].filter(
    (label): label is string => Boolean(label),
  )

  return labels.filter((label, index) => index === 0 || label !== labels[index - 1])
}

export type PrototypeThemeId = "light" | "dark" | "aurora" | "obsidian" | "slate"

export interface PrototypeThemeOption {
  id: PrototypeThemeId
  name: string
  description: string
  badgeColor: string
  icon: ReactNode
  isDefault?: boolean
}

export const PROTOTYPE_THEMES: PrototypeThemeOption[] = [
  {
    id: "light",
    name: "建筑蓝",
    description: "经典浅色，严谨专业",
    badgeColor: "#008ee0",
    icon: <SunOutlined style={{ color: "#008ee0" }} />,
    isDefault: true,
  },
  {
    id: "dark",
    name: "山野黑",
    description: "夜间模式，护眼低眩",
    badgeColor: "#177ddc",
    icon: <MoonOutlined style={{ color: "#79a3c9" }} />,
  },
  {
    id: "aurora",
    name: "云境白",
    description: "极简顶栏，开阔视野与现代流线",
    badgeColor: "#18181b",
    icon: <AppstoreOutlined style={{ color: "#18181b" }} />,
  },
  {
    id: "obsidian",
    name: "星穹夜",
    description: "顶栏暗黑，沉浸指挥与黑曜科技",
    badgeColor: "#6366f1",
    icon: <MoonOutlined style={{ color: "#818cf8" }} />,
  },
  {
    id: "slate",
    name: "玄武岩",
    description: "顶栏石灰灰阶，介于浅色与纯黑的现代中度灰",
    badgeColor: "#475569",
    icon: <AppstoreOutlined style={{ color: "#94a3b8" }} />,
  },
]

interface AppShellProps {
  children: ReactNode
  currentRoute: AppRoute
  darkMode?: boolean
  currentTheme?: PrototypeThemeId
  onSelectTheme?: (themeId: PrototypeThemeId) => void
  onNavigate: (route: AppRoute) => void
}

export function AppShell({
  children,
  currentRoute,
  currentTheme,
  onSelectTheme,
  darkMode,
  onNavigate,
}: AppShellProps) {
  useAutoHideScrollbars()
  const portalSettings = usePortalSettings()
  const menuItems = useMemo(() => buildNavigationItems(portalSettings.menus, true) as MenuProps["items"], [portalSettings.menus])
  const topNavInternalMenuItems = useMemo(() => buildNavigationItems(portalSettings.menus, false) as MenuProps["items"], [portalSettings.menus])
  const [collapsed, setCollapsed] = useState<boolean>(false)
  const [menuCollapsed, setMenuCollapsed] = useState<boolean>(false)
  const [slateNavLayout, setSlateNavLayout] = useState<"side" | "top">(() =>
    localStorage.getItem("prototype_slate_nav_layout") === "top" ? "top" : "side",
  )
  const collapseTimerRef = useRef<ReturnType<typeof window.setTimeout> | undefined>(undefined)
  // 必须按路由记忆化：数组每次渲染都新建的话，下面「补齐展开键」的 effect 会每渲染触发一次，
  // 用户手动收起的分组会被立刻重新顶开（走 routeToGroupMap 兜底的路由都会中招）。
  const parentGroups = useMemo(() => {
    const configuredParents = getMenuPath(portalSettings.menus, currentRoute).map((menu) => menu.id)
    if (configuredParents.length) return configuredParents
    return routeToOpenKeys[currentRoute] ?? (routeToGroupMap[currentRoute] ? [routeToGroupMap[currentRoute]] : [])
  }, [currentRoute, portalSettings.menus])
  const [openKeys, setOpenKeys] = useState<string[]>(() => parentGroups)
  const activeThemeId: PrototypeThemeId = currentTheme ?? (darkMode ? "dark" : "light")
  const activeTheme = PROTOTYPE_THEMES.find((t) => t.id === activeThemeId) ?? PROTOTYPE_THEMES[0]
  const isSlateNavTrial = activeThemeId === "slate"
  const isTopNavTheme = activeThemeId === "aurora" || activeThemeId === "obsidian" || (isSlateNavTrial && slateNavLayout === "top")
  const topnavMenuScrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScrollState = () => {
    const el = topnavMenuScrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => {
    const el = topnavMenuScrollRef.current
    if (!el) return
    let frame = 0
    const revealActiveItem = () => {
      if (!isSlateNavTrial || !isTopNavTheme) return
      const active = el.querySelector<HTMLElement>(".app-shell__slate-nav .is-active")
      if (active) {
        const menuBounds = el.getBoundingClientRect()
        const activeBounds = active.getBoundingClientRect()
        // 为出现或消失的左右滚动按钮预留空间，避免选中项再次被裁切。
        if (activeBounds.left < menuBounds.left + 40) el.scrollLeft -= menuBounds.left + 40 - activeBounds.left
        else if (activeBounds.right > menuBounds.right - 40) el.scrollLeft += activeBounds.right - menuBounds.right + 40
      }
      checkScrollState()
    }
    const handleResize = () => {
      checkScrollState()
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(revealActiveItem)
    }
    checkScrollState()
    frame = window.requestAnimationFrame(revealActiveItem)
    el.addEventListener("scroll", checkScrollState, { passive: true })
    window.addEventListener("resize", handleResize, { passive: true })
    return () => {
      window.cancelAnimationFrame(frame)
      el.removeEventListener("scroll", checkScrollState)
      window.removeEventListener("resize", handleResize)
    }
  }, [currentRoute, isTopNavTheme, isSlateNavTrial])

  const scrollNav = (direction: "left" | "right") => {
    const el = topnavMenuScrollRef.current
    if (!el) return
    const offset = direction === "left" ? -180 : 180
    el.scrollBy({ left: offset, behavior: "smooth" })
  }

  useEffect(() => {
    if (!parentGroups.length) return
    setOpenKeys((prev) => {
      const next = [...prev]
      parentGroups.forEach((key) => {
        if (!next.includes(key)) next.push(key)
      })
      return next.length === prev.length && next.every((key, index) => key === prev[index]) ? prev : next
    })
  }, [parentGroups])

  useEffect(() => () => {
    if (collapseTimerRef.current !== undefined) window.clearTimeout(collapseTimerRef.current)
  }, [])

  const handleToggleCollapse = () => {
    if (collapseTimerRef.current !== undefined) {
      window.clearTimeout(collapseTimerRef.current)
      collapseTimerRef.current = undefined
    }
    if (!collapsed) {
      setCollapsed(true)
      collapseTimerRef.current = window.setTimeout(() => {
        setMenuCollapsed(true)
        collapseTimerRef.current = undefined
      }, 420)
      return
    }
    setMenuCollapsed(false)
    setCollapsed(false)
  }

  const handleOpenChange = (keys: string[]) => {
    if (!isSlateNavTrial && (collapsed || menuCollapsed)) return
    setOpenKeys(keys)
  }

  const toggleSlateNav = () => {
    const next = slateNavLayout === "side" ? "top" : "side"
    setSlateNavLayout(next)
    localStorage.setItem("prototype_slate_nav_layout", next)
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLButtonElement>(`[aria-label="切换到${next === "top" ? "左侧" : "顶部"}导航"]`)?.focus()
    })
  }

  const handleThemeSelect = (themeId: PrototypeThemeId) => {
    if (onSelectTheme) onSelectTheme(themeId)
  }

  const breadcrumbLabels = getBreadcrumbLabels(currentRoute, portalSettings.menus)

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    if (typeof key === "string" && isAppRoute(key)) {
      onNavigate(key)
    }
  }

  const handleUserMenuClick: MenuProps["onClick"] = ({ key }) => {
    if (typeof key !== "string") return
    if (key.startsWith("theme:")) {
      handleThemeSelect(key.slice("theme:".length) as PrototypeThemeId)
      return
    }
    if (isAppRoute(key)) {
      onNavigate(key)
      return
    }
    if (key === "logout") {
      message.info("原型环境为纯前端演示，未接入真实登录与退出能力")
    }
  }

  const userMenuItems: MenuProps["items"] = [
    {
      key: "user-summary",
      type: "group",
      label: (
        <div className="app-shell__user-summary">
          <Avatar size={36} style={{ backgroundColor: portalSettings.user.avatarColor }}>{portalSettings.user.userName.slice(0, 1)}</Avatar>
          <span>
            <strong>{portalSettings.user.userName}</strong>
            <small>{portalSettings.user.role} · {portalSettings.user.department}</small>
          </span>
        </div>
      ),
    },
    { type: "divider" },
    { key: "user-settings", icon: <UserOutlined />, label: "用户配置" },
    { key: "menu-management", icon: <MenuOutlined />, label: "菜单管理" },
    { key: "app-management", icon: <AppstoreOutlined />, label: "应用管理" },
    {
      key: "theme-preference",
      icon: <BgColorsOutlined />,
      label: "主题偏好",
      children: PROTOTYPE_THEMES.map((themeOption) => ({
        key: `theme:${themeOption.id}`,
        label: (
          <span className="app-shell__user-theme-option">
            <span className="app-shell__theme-color-dot" style={{ background: themeOption.badgeColor }} />
            {themeOption.name}
            {activeThemeId === themeOption.id && <CheckOutlined />}
          </span>
        ),
      })),
    },
    { type: "divider" },
    { key: "portal", icon: <HomeOutlined />, label: "返回门户" },
    { key: "logout", icon: <LogoutOutlined />, label: "退出登录" },
  ]

  const slateMenu = isSlateNavTrial ? menuItems as NavigationItem[] : []
  const slateActiveGroup = slateMenu.find((item) => item.key === currentRoute || navigationLeaves(item.children ?? []).some((leaf) => leaf.key === currentRoute))
  const slateSubItems = slateActiveGroup?.children ? navigationLeaves(slateActiveGroup.children) : []

  return (
    <Layout className={`app-shell ${isTopNavTheme ? "app-shell--topnav" : ""} ${isSlateNavTrial ? "app-shell--slate-switch" : ""} ${isSlateNavTrial && isTopNavTheme ? "app-shell--slate-top" : ""}`} data-theme={activeThemeId}>
      {(!isTopNavTheme || isSlateNavTrial) && (
        <Sider
        className={`app-shell__sider ${!isSlateNavTrial && collapsed ? "app-shell__sider--collapsed" : ""}`}
        width="var(--sidebar-width)"
        collapsedWidth={64}
        collapsed={isSlateNavTrial ? false : collapsed}
        inert={isSlateNavTrial && isTopNavTheme}
        aria-hidden={isSlateNavTrial && isTopNavTheme ? true : undefined}
        collapsible
        trigger={null}
      >
        <div className="app-shell__brand" title={systemLabels[currentRoute]}>
          <span className="app-shell__brand-copy">
            <strong>{systemLabels[currentRoute]}</strong>
          </span>
          <Tooltip title={isSlateNavTrial ? "切换到顶部导航" : collapsed ? "展开导航菜单" : "收起导航菜单"} placement={collapsed ? "right" : "bottom"}>
            <button
              type="button"
              className="app-shell__collapse-btn"
              onClick={isSlateNavTrial ? toggleSlateNav : handleToggleCollapse}
              aria-label={isSlateNavTrial ? "切换到顶部导航" : collapsed ? "展开导航菜单" : "收起导航菜单"}
            >
              <SidebarToggleIcon className="app-shell__sidebar-icon" />
            </button>
          </Tooltip>
        </div>
        <Menu
          className="app-shell__menu"
          data-auto-hide-scrollbar
          items={menuItems}
          mode="inline"
          inlineCollapsed={isSlateNavTrial ? false : menuCollapsed}
          openKeys={!isSlateNavTrial && menuCollapsed ? [] : openKeys}
          onOpenChange={handleOpenChange}
          onClick={handleMenuClick}
          selectedKeys={[currentRoute]}
          theme="dark"
        />
        </Sider>
      )}

      <Layout className={`app-shell__main ${!isSlateNavTrial && !isTopNavTheme && collapsed ? "app-shell__main--collapsed" : ""} ${isTopNavTheme ? "app-shell__main--topnav" : ""}`}>
      <Header className="app-shell__header">
        {isSlateNavTrial && isTopNavTheme && (
          <Tooltip title="切换到左侧导航">
            <button type="button" className="app-shell__collapse-btn app-shell__layout-toggle" onClick={toggleSlateNav} aria-label="切换到左侧导航">
              <SidebarToggleIcon />
            </button>
          </Tooltip>
        )}
        {isTopNavTheme ? (
          <button
            type="button"
            className="app-shell__topnav-brand"
            onClick={() => onNavigate("portal")}
            aria-label="返回门户首页"
            title="返回门户首页"
          >
            <span className="app-shell__topnav-logo" aria-hidden="true" />
            <strong className="app-shell__topnav-title">{systemLabels[currentRoute]}</strong>
          </button>
        ) : (
          <div className="app-shell__context">
            <nav className="app-shell__breadcrumb" aria-label="面包屑">
              <ol>
                {breadcrumbLabels.map((label, index) => {
                  const isCurrent = index === breadcrumbLabels.length - 1
                  return (
                    <li key={`${label}-${index}`}>
                      {index > 0 && <span className="app-shell__breadcrumb-separator" aria-hidden="true">/</span>}
                      <span className={isCurrent ? "app-shell__breadcrumb-current" : undefined} aria-current={isCurrent ? "page" : undefined}>
                        {label}
                      </span>
                    </li>
                  )
                })}
              </ol>
            </nav>
          </div>
        )}

        {isTopNavTheme && (
          <div className="app-shell__topnav-nav-container">
            {canScrollLeft && (
              <button
                type="button"
                className="app-shell__nav-scroll-btn app-shell__nav-scroll-btn--left"
                onClick={() => scrollNav("left")}
                aria-label="向左滚动菜单"
              >
                <LeftOutlined />
              </button>
            )}
            <div className="app-shell__topnav-menu-wrapper" ref={topnavMenuScrollRef} data-auto-hide-scrollbar>
            {isSlateNavTrial ? (
              <nav className="app-shell__slate-nav" aria-label="主导航">
                {slateMenu.map((item) => {
                  const firstRoute = item.children?.length ? navigationLeaves(item.children)[0]?.key : item.key
                  return <button key={item.key} type="button" className={slateActiveGroup?.key === item.key ? "is-active" : ""} aria-current={slateActiveGroup?.key === item.key ? "true" : undefined} onClick={() => slateActiveGroup?.key !== item.key && firstRoute && onNavigate(firstRoute as AppRoute)}>{item.label}</button>
                })}
              </nav>
            ) : <Menu
              className="app-shell__topnav-menu"
              aria-label="主导航"
              items={topNavInternalMenuItems}
              mode="horizontal"
              onClick={handleMenuClick}
              selectedKeys={[currentRoute]}
              disabledOverflow
              theme={activeThemeId === "obsidian" ? "dark" : "light"}
            />}
            </div>
            {canScrollRight && (
              <button
                type="button"
                className="app-shell__nav-scroll-btn app-shell__nav-scroll-btn--right"
                onClick={() => scrollNav("right")}
                aria-label="向右滚动菜单"
              >
                <RightOutlined />
              </button>
            )}
          </div>
        )}

          <div className="app-shell__actions">
            <Tooltip title="返回门户" placement="bottom">
            <Button
              type="default"
              size="small"
              icon={<HomeOutlined />}
              onClick={() => onNavigate('portal')}
              className="app-shell__back-portal-btn"
              aria-label="返回门户"
            />
            </Tooltip>
            <Dropdown
              trigger={["click"]}
              placement="bottomRight"
              menu={{
                items: PROTOTYPE_THEMES.map((themeOption) => ({
                  key: themeOption.id,
                  label: (
                    <div className="app-shell__theme-menu-item" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minWidth: 160, gap: 12 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <span className="app-shell__theme-color-dot" style={{ width: 10, height: 10, borderRadius: "50%", background: themeOption.badgeColor, display: "inline-block" }} />
                        <span>{themeOption.name}</span>
                        {themeOption.isDefault && <span style={{ fontSize: 11, color: "var(--color-text-3)", background: "var(--color-bg-2)", padding: "1px 5px", borderRadius: 10 }}>默认</span>}
                      </span>
                      {activeThemeId === themeOption.id && <CheckOutlined style={{ color: "var(--color-primary, #008ee0)" }} />}
                    </div>
                  ),
                  onClick: () => handleThemeSelect(themeOption.id),
                })),
              }}
            >
              <Tooltip title={`当前主题：${activeTheme.name}（点击切换）`} placement="bottom">
                <Button
                  type="default"
                  size="small"
                  icon={<BgColorsOutlined />}
                  className="app-shell__theme-btn"
                  aria-label="切换界面主题"
                />
              </Tooltip>
            </Dropdown>
            <Dropdown
              trigger={["click"]}
              placement="bottomRight"
              menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
            >
              <button type="button" className="app-shell__user-btn app-shell__user-trigger" aria-label="用户菜单">
                <Avatar size={22} style={{ backgroundColor: portalSettings.user.avatarColor }}>{portalSettings.user.userName.slice(0, 1)}</Avatar>
                <span className="app-shell__user-name">{portalSettings.user.userName}</span>
                <DownOutlined className="app-shell__user-arrow" />
              </button>
            </Dropdown>
          </div>
        </Header>
        {isSlateNavTrial && isTopNavTheme && slateSubItems.length > 0 && (
          <nav className="app-shell__slate-subnav" aria-label={`${slateActiveGroup?.label}子导航`}>
            {slateSubItems.map((item) => (
              <button key={item.key} type="button" className={item.key === currentRoute ? "is-active" : ""} aria-current={item.key === currentRoute ? "page" : undefined} onClick={() => onNavigate(item.key as AppRoute)}>{item.label}</button>
            ))}
          </nav>
        )}
        <Content className="app-shell__content" data-auto-hide-scrollbar>
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}
