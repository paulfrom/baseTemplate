import { beforeEach, describe, expect, it } from "vitest"
import {
  getPortalSettings,
  removePortalApplication,
  removePortalMenu,
  resetPortalApplications,
  resetPortalMenus,
  resetPortalSettings,
  savePortalApplication,
  savePortalMenu,
  updatePortalUser,
} from "./portal-settings"

beforeEach(() => {
  window.localStorage.clear()
  resetPortalSettings()
})

describe("portal settings local store", () => {
  it("provides the built-in menu, application and user configuration", () => {
    const settings = getPortalSettings()
    expect(settings.version).toBe(1)
    expect(settings.applications).toHaveLength(6)
    expect(settings.menus.map((menu) => menu.id)).toEqual([
      "analytics-cockpit",
      "system-config-group",
      "menu-management",
      "app-management",
      "user-settings",
    ])
    expect(settings.user.userName).toBe("管理员")
  })

  it("persists application changes and supports deleting and restoring them", () => {
    const application = {
      ...getPortalSettings().applications[0],
      id: "app-test",
      name: "测试应用",
      code: "test-app",
      visibleOnPortal: true,
    }
    savePortalApplication(application)
    expect(getPortalSettings().applications.find((item) => item.id === "app-test")).toMatchObject({ name: "测试应用", visibleOnPortal: true })
    expect(JSON.parse(window.localStorage.getItem("prototype_portal_settings_v1") ?? "{}").applications).toHaveLength(7)

    savePortalApplication({ ...application, status: "disabled" })
    expect(getPortalSettings().applications.find((item) => item.id === "app-test")?.status).toBe("disabled")
    removePortalApplication("app-test")
    expect(getPortalSettings().applications).toHaveLength(6)

    savePortalApplication(application)
    resetPortalApplications()
    expect(getPortalSettings().applications).toHaveLength(6)
    expect(getPortalSettings().applications.some((item) => item.id === "app-test")).toBe(false)
  })

  it("persists menu hierarchy and user notification preferences without losing sibling settings", () => {
    const menu = {
      ...getPortalSettings().menus[1],
      id: "custom-group",
      name: "自定义分组",
      sort: 80,
    }
    savePortalMenu(menu)
    savePortalMenu({
      ...getPortalSettings().menus[0],
      id: "custom-page",
      parentId: "custom-group",
      name: "自定义页面",
      route: "app-management",
    })
    expect(getPortalSettings().menus.find((item) => item.id === "custom-page")).toMatchObject({ parentId: "custom-group", route: "app-management" })

    updatePortalUser({ userName: "门户管理员", notifications: { ...getPortalSettings().user.notifications, email: false } })
    updatePortalUser({ defaultTheme: "obsidian" })
    expect(getPortalSettings().user).toMatchObject({ userName: "门户管理员", defaultTheme: "obsidian" })
    expect(getPortalSettings().user.notifications.email).toBe(false)
    expect(getPortalSettings().user.notifications.website).toBe(true)

    removePortalMenu("custom-page")
    removePortalMenu("custom-group")
    expect(getPortalSettings().menus).toHaveLength(5)
    resetPortalMenus()
    expect(getPortalSettings().user.userName).toBe("门户管理员")
  })
})
