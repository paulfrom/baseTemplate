import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act } from "react"
import { resetPortalSettings, setPortalMenuVisibility } from "../models/portal-settings"
import { PROTOTYPE_THEMES, type PrototypeThemeId } from "../../config/theme.config"
import { AuthLayout } from "./AuthLayout"

/**
 * 应用外壳回归：布局骨架、动态菜单项、导航回调、
 * 侧边栏折叠与顶栏主题变体。调整路由表菜单或展示规则后在此补充对应用例。
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

function renderShell(props: { currentTheme?: PrototypeThemeId; currentPath?: string } = {}) {
  const onNavigate = vi.fn()
  const onSelectTheme = vi.fn()
  render(
    <AuthLayout
      currentPath="/sample-request"
      darkMode={false}
      onNavigate={onNavigate}
      onSelectTheme={onSelectTheme}
      {...props}
    >
      <div data-testid="page-content">页面内容</div>
    </AuthLayout>,
  )
  return { onNavigate, onSelectTheme }
}

describe("AuthLayout (template)", () => {
  it("renders brand, the sample-request menu item, system group and page content", () => {
    renderShell()

    // 品牌名同时出现在侧边栏 brand 与面包屑首节，用 getAllByText
    expect(screen.getAllByText("baseTemplate").length).toBeGreaterThan(0)
    expect(screen.getAllByRole("menuitem")).toHaveLength(3)
    expect(screen.getByRole("menuitem", { name: /申请单示例/ })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: /工作台/ })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: /系统配置/ })).toBeInTheDocument()
    expect(screen.getByTestId("page-content")).toBeInTheDocument()
  })

  it("honors the router-backed menu visibility setting", async () => {
    renderShell()
    act(() => setPortalMenuVisibility("sample-request", false))

    await waitFor(() => {
      expect(screen.queryByRole("menuitem", { name: /申请单示例/ })).not.toBeInTheDocument()
    })
    act(() => setPortalMenuVisibility("sample-request", true))
    expect(await screen.findByRole("menuitem", { name: /申请单示例/ })).toBeInTheDocument()
  })

  it("navigates to the matching route when the menu item is clicked", () => {
    const { onNavigate } = renderShell()

    fireEvent.click(screen.getByRole("menuitem", { name: /工作台/ }))

    expect(onNavigate).toHaveBeenCalledWith("dashboard")
  })

  it("opens the user menu and navigates to the login demo page", async () => {
    const { onNavigate } = renderShell()

    fireEvent.click(screen.getByRole("button", { name: "用户菜单" }))
    fireEvent.click(await screen.findByText("登录示例"))

    expect(onNavigate).toHaveBeenCalledWith("login")
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
