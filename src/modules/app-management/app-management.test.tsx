import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { message } from "@ead/suid"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { act } from "react"
import { getPortalSettings, resetPortalSettings } from "../../app/portal-settings"
import { AppManagementPage } from "./AppManagementPage"

beforeEach(() => {
  window.localStorage.clear()
  resetPortalSettings()
})

afterEach(async () => {
  await act(async () => { message.destroy() })
  cleanup()
  resetPortalSettings()
})

describe("application management", () => {
  it("filters applications and persists the portal visibility switch", async () => {
    render(<AppManagementPage />)
    expect(screen.getByRole("heading", { name: "应用管理" })).toBeInTheDocument()
    expect(screen.getByText("共 6 个应用")).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText("应用名称 / 编码 / 路由"), { target: { value: "驾驶舱" } })
    fireEvent.click(screen.getByRole("button", { name: /查询/ }))
    await waitFor(() => expect(screen.getByText("共 1 个应用")).toBeInTheDocument())

    fireEvent.click(screen.getByRole("switch", { name: "数据驾驶舱门户展示" }))
    await waitFor(() => {
      expect(getPortalSettings().applications.find((app) => app.id === "app-cockpit")?.visibleOnPortal).toBe(false)
    })
  })

  it("enters the configured application route", () => {
    window.location.hash = "#/app-management"
    render(<AppManagementPage />)
    fireEvent.click(screen.getByLabelText("进入数据驾驶舱"))
    expect(window.location.hash).toBe("#/analytics-cockpit")
  })

  it("creates an application from the editor", async () => {
    render(<AppManagementPage />)
    fireEvent.click(screen.getByRole("button", { name: /新建应用/ }))
    fireEvent.change(screen.getByLabelText("应用名称"), { target: { value: "新门户应用" } })
    fireEvent.change(screen.getByLabelText("应用编码"), { target: { value: "new-portal-app" } })
    fireEvent.click(screen.getByRole("button", { name: /保存配置/ }))

    await waitFor(() => {
      expect(getPortalSettings().applications.some((app) => app.code === "new-portal-app")).toBe(true)
    })
    expect(await screen.findByText("新门户应用")).toBeInTheDocument()
  })
})
