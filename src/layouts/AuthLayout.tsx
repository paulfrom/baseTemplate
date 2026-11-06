import {
  BgColorsOutlined,
  CheckOutlined,
  DownOutlined,
  HomeOutlined,
  LeftOutlined,
  PoweroffOutlined,
  MenuOutlined,
  RightOutlined,
  UserOutlined,
} from "@ead/suid-icons"
import { Avatar, Button, Dropdown, Layout, Menu, message, Tooltip } from "@ead/suid"
import type { MenuProps } from "@ead/suid"
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { PortalIcon } from "../components/PortalIcon"
import {
  PORTAL_ROUTE_DEFINITIONS,
  findRouteConfig,
  getHighlightPath,
  getPathByRoute,
  type AppRoute,
} from "../../config/router.config"
import {
  PROTOTYPE_THEMES,
  type PrototypeThemeId,
} from "../../config/theme.config"
import { logout } from "../models/global"
import { usePortalSettings, type PortalIconKey, type PortalMenuItem } from "../models/portal-settings"

/**
 * 登录后的应用外壳（对应公司模板的 `layouts/AuthLayout`）：
 * 侧边栏 / 顶栏双布局、五套主题、面包屑与菜单高亮的框架实现。
 *
 * 新增页面时的接线点（都收敛到 config/router.config.ts）：
 * 1. 路由表补 `path` / `route` / `layout` / `component`；
 * 2. 需要进左侧导航的再补 `menu`（可见性由 portal-settings 管理）；
 * 3. 子页面用 `parentPath` 声明归属，面包屑与菜单高亮自动跟随。
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

const routeLabels = Object.fromEntries(
  PORTAL_ROUTE_DEFINITIONS.map((definition) => [definition.route, definition.label]),
) as Record<AppRoute, string>

const routeGroupLabels: Partial<Record<AppRoute, string>> = {
  "menu-management": "系统配置",
}

const routeToGroupMap: Partial<Record<AppRoute, string>> = {
  "menu-management": "system-config-group",
}

const systemLabels: Record<AppRoute, string> = {
  portal: "baseTemplate",
  dashboard: "baseTemplate",
  "sample-request": "baseTemplate",
  "workflow-example": "baseTemplate",
  "menu-management": "baseTemplate",
  login: "baseTemplate",
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
      // 页面菜单用路由表里的实际路径作为导航 key，目录分组才使用配置 id。
      key: item.type === "page" && item.route ? (getPathByRoute(item.route) ?? item.id) : item.id,
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

interface AppShellProps {
  children: ReactNode
  /** 当前地址路径，例如 /sample-request/form；菜单高亮与面包屑都由它推导。 */
  currentPath: string
  darkMode?: boolean
  currentTheme?: PrototypeThemeId
  onSelectTheme?: (themeId: PrototypeThemeId) => void
  onNavigate: (route: AppRoute) => void
}

export function AuthLayout({
  children,
  currentPath,
  currentTheme,
  onSelectTheme,
  darkMode,
  onNavigate,
}: AppShellProps) {
  // 子页面（表单 / 详情）归到父路径，菜单高亮与面包屑都落到列表页。
  const currentRoute: AppRoute =
    findRouteConfig(currentPath)?.route ??
    findRouteConfig(getHighlightPath(currentPath))?.route ??
    "portal"
  const highlightedPath = getHighlightPath(currentPath)
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

  /** 菜单 key 就是路由路径；未知路径（例如目录分组）不触发跳转。 */
  const navigateByPath = (path: string) => {
    const config = findRouteConfig(path)
    if (config) onNavigate(config.route)
  }

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    if (typeof key === "string") navigateByPath(key)
  }

  const handleUserMenuClick: MenuProps["onClick"] = ({ key }) => {
    if (typeof key !== "string") return
    if (key.startsWith("theme:")) {
      handleThemeSelect(key.slice("theme:".length) as PrototypeThemeId)
      return
    }
    if (key === "logout") {
      void logout()
      message.info("原型环境为纯前端演示，已清空本地演示会话")
      onNavigate("portal")
      return
    }
    navigateByPath(key)
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
    { key: "/menu-management", icon: <MenuOutlined />, label: "菜单管理" },
    { key: "/user/login", icon: <UserOutlined />, label: "登录示例" },
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
    { key: "/portal", icon: <HomeOutlined />, label: "返回门户" },
    { key: "logout", icon: <PoweroffOutlined />, label: "退出登录" },
  ]

  const slateMenu = isSlateNavTrial ? menuItems as NavigationItem[] : []
  const slateActiveGroup = slateMenu.find((item) => item.key === highlightedPath || navigationLeaves(item.children ?? []).some((leaf) => leaf.key === highlightedPath))
  const slateSubItems = slateActiveGroup?.children ? navigationLeaves(slateActiveGroup.children) : []

  return (
    <Layout className={`app-shell ${isTopNavTheme ? "app-shell--topnav" : ""} ${isSlateNavTrial ? "app-shell--slate-switch" : ""} ${isSlateNavTrial && isTopNavTheme ? "app-shell--slate-top" : ""}`} data-theme={activeThemeId}>
      {(!isTopNavTheme || isSlateNavTrial) && (
        <Sider
        className={`app-shell__sider ${!isSlateNavTrial && collapsed ? "app-shell__sider--collapsed" : ""}`}
        width="var(--sidebar-width)"
        collapsedWidth={64}
        collapsed={isSlateNavTrial ? false : collapsed}
        ref={(element) => { element?.toggleAttribute('inert', isSlateNavTrial && isTopNavTheme) }}
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
          selectedKeys={[highlightedPath]}
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
              selectedKeys={[highlightedPath]}
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
              <button key={item.key} type="button" className={item.key === highlightedPath ? "is-active" : ""} aria-current={item.key === highlightedPath ? "page" : undefined} onClick={() => navigateByPath(item.key)}>{item.label}</button>
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
