import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { message } from "@ead/suid"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { act } from "react"
import { getPortalSettings, resetPortalSettings } from "../../app/portal-settings"
import { PORTAL_ROUTE_DEFINITIONS } from "../../app/hash-navigation"
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

describe("router-backed menu management", () => {
  it("lists current router entries and filters them without an add action", async () => {
    render(<MenuManagementPage />)
    expect(screen.getByRole("heading", { name: "菜单管理" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /新增菜单/ })).not.toBeInTheDocument()
    expect(screen.getByText(`筛选结果 ${PORTAL_ROUTE_DEFINITIONS.length} / ${PORTAL_ROUTE_DEFINITIONS.length} 项`)).toBeInTheDocument()
    expect(screen.getByText("数据驾驶舱")).toBeInTheDocument()
    expect(screen.getByText("门户入口")).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText("名称 / 路由 / 分组 / 权限"), { target: { value: "user-settings" } })
    fireEvent.click(screen.getByRole("button", { name: /查询/ }))
    await waitFor(() => expect(screen.getByText(`筛选结果 1 / ${PORTAL_ROUTE_DEFINITIONS.length} 项`)).toBeInTheDocument())
    expect(screen.getByText("用户配置")).toBeInTheDocument()
    expect(screen.queryByText("数据驾驶舱")).not.toBeInTheDocument()
  })

  it("persists the visibility checkbox and restores router defaults", async () => {
    render(<MenuManagementPage />)
    fireEvent.click(screen.getByRole("switch", { name: "数据驾驶舱导航展示" }))
    await waitFor(() => {
      expect(getPortalSettings().menus.find((menu) => menu.id === "analytics-cockpit")?.visible).toBe(false)
    })
    fireEvent.click(screen.getByRole("button", { name: /恢复默认展示/ }))
    await waitFor(() => {
      expect(getPortalSettings().menus.find((menu) => menu.id === "analytics-cockpit")?.visible).toBe(true)
    })
  })
})
