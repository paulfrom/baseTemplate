import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { message } from "antd"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { act } from "react"
import { getPortalSettings, resetPortalSettings } from "../../app/portal-settings"
import { MenuManagementPage } from "./MenuManagementPage"

beforeEach(() => {
  window.localStorage.clear()
  resetPortalSettings()
})

afterEach(async () => {
  await act(async () => { message.destroy() })
  cleanup()
  resetPortalSettings()
})

describe("menu management", () => {
  it("shows the two-level menu tree and saves a new page menu", async () => {
    render(<MenuManagementPage />)
    expect(screen.getByRole("heading", { name: "菜单管理" })).toBeInTheDocument()
    expect(screen.getByText("系统配置")).toBeInTheDocument()
    expect(screen.getByText("共 5 个菜单节点")).toBeInTheDocument()

    fireEvent.click(screen.getByText("新增菜单"))
    fireEvent.change(screen.getByLabelText("菜单名称"), { target: { value: "快捷入口" } })
    fireEvent.click(screen.getByRole("button", { name: /保存菜单/ }))

    await waitFor(() => {
      expect(getPortalSettings().menus.some((menu) => menu.name === "快捷入口" && menu.route === "menu-management")).toBe(true)
    })
    expect(screen.getByText("快捷入口")).toBeInTheDocument()
  })

  it("persists the visibility switch and resets the tree", async () => {
    render(<MenuManagementPage />)
    fireEvent.click(screen.getByRole("switch", { name: "数据驾驶舱显示状态" }))
    await waitFor(() => {
      expect(getPortalSettings().menus.find((menu) => menu.id === "analytics-cockpit")?.visible).toBe(false)
    })
    fireEvent.click(screen.getByRole("button", { name: /恢复默认/ }))
    await waitFor(() => {
      expect(getPortalSettings().menus.find((menu) => menu.id === "analytics-cockpit")?.visible).toBe(true)
    })
  })
})
