import { beforeEach, describe, expect, it } from "vitest"
import {
  getPortalSettings,
  removePortalApplication,
  resetPortalApplications,
  resetPortalMenus,
  resetPortalSettings,
  savePortalApplication,
  setPortalMenuVisibility,
  updatePortalUser,
} from "./portal-settings"
import { PORTAL_ROUTE_DEFINITIONS } from "../../config/router.config"

beforeEach(() => {
  window.localStorage.clear()
  resetPortalSettings()
})

describe("portal settings local store", () => {
  it("provides router-backed menus, applications and user configuration", () => {
    const settings = getPortalSettings()
    expect(settings.version).toBe(1)
    expect(settings.applications).toHaveLength(4)
    expect(settings.menus.filter((menu) => menu.type === "page").map((menu) => menu.route)).toEqual(
      PORTAL_ROUTE_DEFINITIONS.map((definition) => definition.route),
    )
    expect(settings.menus.find((menu) => menu.id === "portal")?.visible).toBe(false)
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
    expect(JSON.parse(window.localStorage.getItem("prototype_portal_settings_v1") ?? "{}").applications).toHaveLength(5)

    savePortalApplication({ ...application, status: "disabled" })
    expect(getPortalSettings().applications.find((item) => item.id === "app-test")?.status).toBe("enabled")
    removePortalApplication("app-test")
    expect(getPortalSettings().applications).toHaveLength(4)

    savePortalApplication(application)
    resetPortalApplications()
    expect(getPortalSettings().applications).toHaveLength(4)
    expect(getPortalSettings().applications.some((item) => item.id === "app-test")).toBe(false)
  })

  it("persists only router menu visibility and keeps user notification siblings", () => {
    setPortalMenuVisibility("menu-management", false)
    expect(getPortalSettings().menus.find((menu) => menu.id === "menu-management")?.visible).toBe(false)
    expect(JSON.parse(window.localStorage.getItem("prototype_portal_settings_v1") ?? "{}").menus.find((menu: { id: string }) => menu.id === "menu-management").visible).toBe(false)

    updatePortalUser({ userName: "门户管理员", notifications: { ...getPortalSettings().user.notifications, email: false } })
    updatePortalUser({ defaultTheme: "obsidian" })
    expect(getPortalSettings().user).toMatchObject({ userName: "门户管理员", defaultTheme: "obsidian" })
    expect(getPortalSettings().user.notifications.email).toBe(false)
    expect(getPortalSettings().user.notifications.website).toBe(true)

    resetPortalMenus()
    expect(getPortalSettings().menus.find((menu) => menu.id === "menu-management")?.visible).toBe(true)
    expect(getPortalSettings().user.userName).toBe("门户管理员")
  })
})
