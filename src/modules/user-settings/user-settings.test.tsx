import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { message } from "antd"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act } from "react"
import { getPortalSettings, resetPortalSettings } from "../../app/portal-settings"
import { UserSettingsPage } from "./UserSettingsPage"

beforeEach(() => {
  window.localStorage.clear()
  resetPortalSettings()
})

afterEach(async () => {
  await act(async () => { message.destroy() })
  cleanup()
  resetPortalSettings()
})

describe("user settings", () => {
  it("saves the profile and synchronizes the shared user state", async () => {
    render(<UserSettingsPage currentTheme="light" />)
    fireEvent.change(screen.getByLabelText("显示名称"), { target: { value: "门户管理员" } })
    fireEvent.click(screen.getByRole("button", { name: /保存资料/ }))

    await waitFor(() => expect(getPortalSettings().user.userName).toBe("门户管理员"))
    expect(screen.getByText("当前用户：门户管理员")).toBeInTheDocument()
  })

  it("applies the selected theme and saves notification preferences", async () => {
    const onThemeSelect = vi.fn()
    render(<UserSettingsPage currentTheme="light" onThemeSelect={onThemeSelect} />)

    fireEvent.click(screen.getByRole("tab", { name: /偏好设置/ }))
    fireEvent.click(screen.getByRole("radio", { name: /星穹夜/ }))
    fireEvent.click(screen.getByRole("button", { name: /保存偏好/ }))
    await waitFor(() => expect(getPortalSettings().user.defaultTheme).toBe("obsidian"))
    expect(onThemeSelect).toHaveBeenCalledWith("obsidian")
    expect(window.localStorage.getItem("prototype_theme_id")).toBe("obsidian")

    fireEvent.click(screen.getByRole("tab", { name: /通知设置/ }))
    fireEvent.click(screen.getByRole("switch", { name: "邮件通知" }))
    fireEvent.click(screen.getByRole("button", { name: /保存通知设置/ }))
    await waitFor(() => expect(getPortalSettings().user.notifications.email).toBe(false))
  })
})
