import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act } from "react"
import { resetPortalSettings, setPortalMenuVisibility } from "./portal-settings"
import { AppShell, PROTOTYPE_THEMES, type PrototypeThemeId } from "./AppShell"

/**
 * 模板版 AppShell 回归：布局骨架、动态菜单项、导航回调、
 * 侧边栏折叠与顶栏主题变体。调整 Router 菜单或展示规则后在此补充对应用例。
 */

beforeEach(() => {
  localStorage.clear()
  resetPortalSettings()
})

afterEach(() => {
  cleanup()
  localStorage.clear()
  resetPortalSettings()
})

function renderShell(props: { currentTheme?: PrototypeThemeId } = {}) {
  const onNavigate = vi.fn()
  const onSelectTheme = vi.fn()
  render(
    <AppShell
      currentRoute="analytics-cockpit"
      darkMode={false}
      onNavigate={onNavigate}
      onSelectTheme={onSelectTheme}
      {...props}
    >
      <div data-testid="page-content">页面内容</div>
    </AppShell>,
  )
  return { onNavigate, onSelectTheme }
}

describe("AppShell (template)", () => {
  it("renders brand, the cockpit menu item, system group and page content", () => {
    renderShell()

    // 品牌名同时出现在侧边栏 brand 与面包屑首节，用 getAllByText
    expect(screen.getAllByText("baseTemplate").length).toBeGreaterThan(0)
    expect(screen.getAllByRole("menuitem")).toHaveLength(3)
    expect(screen.getByRole("menuitem", { name: /申请单示例/ })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: /数据驾驶舱/ })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: /系统配置/ })).toBeInTheDocument()
    expect(screen.getByTestId("page-content")).toBeInTheDocument()
  })

  it("honors the router-backed menu visibility setting", async () => {
    renderShell()
    act(() => setPortalMenuVisibility("analytics-cockpit", false))

    await waitFor(() => {
      expect(screen.queryByRole("menuitem", { name: /数据驾驶舱/ })).not.toBeInTheDocument()
    })
    act(() => setPortalMenuVisibility("analytics-cockpit", true))
    expect(await screen.findByRole("menuitem", { name: /数据驾驶舱/ })).toBeInTheDocument()
  })

  it("navigates to the cockpit route when the menu item is clicked", () => {
    const { onNavigate } = renderShell()

    fireEvent.click(screen.getByRole("menuitem", { name: /数据驾驶舱/ }))

    expect(onNavigate).toHaveBeenCalledWith("analytics-cockpit")
  })

  it("opens the user menu and navigates to user settings", async () => {
    const { onNavigate } = renderShell()

    fireEvent.click(screen.getByRole("button", { name: "用户菜单" }))
    await waitFor(() => expect(screen.getByText("用户配置")).toBeInTheDocument())
    fireEvent.click(screen.getByText("用户配置"))

    expect(onNavigate).toHaveBeenCalledWith("user-settings")
  })

  it("navigates back to the portal from the header action", () => {
    const { onNavigate } = renderShell()

    fireEvent.click(screen.getByRole("button", { name: "返回门户" }))

    expect(onNavigate).toHaveBeenCalledWith("portal")
  })

  it("collapses and expands the sidebar", () => {
    renderShell()

    fireEvent.click(screen.getByRole("button", { name: "收起导航菜单" }))
    expect(document.querySelector(".app-shell__sider--collapsed")).not.toBeNull()

    fireEvent.click(screen.getByRole("button", { name: "展开导航菜单" }))
    expect(document.querySelector(".app-shell__sider--collapsed")).toBeNull()
  })

  it("switches to the top navigation layout for topnav themes", () => {
    const { onNavigate } = renderShell({ currentTheme: "aurora" })

    expect(document.querySelector(".app-shell__sider")).toBeNull()
    expect(document.querySelector(".app-shell__topnav-menu")).not.toBeNull()

    fireEvent.click(screen.getByRole("button", { name: "返回门户首页" }))
    expect(onNavigate).toHaveBeenCalledWith("portal")
  })

  it("renders the slate trial nav with the side/top layout toggle", () => {
    renderShell({ currentTheme: "slate" })

    // slate 默认侧边布局（app-shell--slate-switch），可切换到顶部导航
    expect(document.querySelector(".app-shell--slate-switch")).not.toBeNull()
    expect(localStorage.getItem("prototype_slate_nav_layout") ?? "side").toBe("side")
    fireEvent.click(screen.getByRole("button", { name: "切换到顶部导航" }))
    expect(localStorage.getItem("prototype_slate_nav_layout")).toBe("top")
  })

  it("exposes the five prototype themes", () => {
    expect(PROTOTYPE_THEMES.map((theme) => theme.id)).toEqual([
      "light",
      "dark",
      "aurora",
      "obsidian",
      "slate",
    ])
    expect(PROTOTYPE_THEMES.find((theme) => theme.isDefault)?.id).toBe("light")
  })
})
