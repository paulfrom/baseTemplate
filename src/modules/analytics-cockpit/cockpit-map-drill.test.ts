import { describe, expect, it } from "vitest"
import { buildDemoTrackRoutes } from "../../components/charts/trackMapDemoRoutes"
import { getCockpitMapSpec, resolveProvinceClick } from "./cockpit-map-drill"

const JIANGSU_CITIES = new Set(["南京", "苏州", "徐州", "无锡"])
const EAST_CITIES = new Set(["上海", "嘉定", "南京", "苏州", "徐州", "无锡", "杭州", "宁波", "温州", "合肥", "芜湖", "南昌", "赣州"])

describe("cockpit map drill demo data", () => {
  it("keeps the national view on the original demo routes", () => {
    const spec = getCockpitMapSpec({ level: "nation" })
    expect(spec.mapName).toBe("china-mainland")
    expect(spec.showInset).toBe(true)
    expect(spec.routes).toEqual(buildDemoTrackRoutes())
    expect(spec.areaNames).toContain("江苏省")
    expect(spec.areaNames).not.toContain("台湾省")
  })

  it("keeps east-region demo tracks inside the east provinces", () => {
    const spec = getCockpitMapSpec({ level: "region", region: "east" })
    expect(spec.mapName).toBe("cockpit-region-east")
    expect(spec.ariaLabel).toBe("华东区域在途物流轨迹图")
    expect(spec.routes.length).toBeGreaterThan(0)
    expect(spec.routes.every((route) => EAST_CITIES.has(route.originName) && EAST_CITIES.has(route.destName))).toBe(true)
    expect(spec.areaNames).toEqual(["上海市", "江苏省", "浙江省", "安徽省", "江西省"])
  })

  it("keeps Jiangsu demo tracks inside the province", () => {
    const spec = getCockpitMapSpec({ level: "province", region: "east", province: "江苏省" })
    expect(spec.mapName).toBe("cockpit-province-江苏省")
    expect(spec.drillable).toBe(false)
    expect(spec.routes.length).toBeGreaterThan(0)
    expect(spec.routes.every((route) => JIANGSU_CITIES.has(route.originName) && JIANGSU_CITIES.has(route.destName))).toBe(true)
  })

  it("maps official eight-region provinces and ignores others", () => {
    expect(resolveProvinceClick("山东省")).toEqual({ name: "山东省", region: "shandong" })
    expect(resolveProvinceClick("福建省")).toEqual({ name: "福建省", region: "south" })
    expect(resolveProvinceClick("西藏自治区")).toEqual({ name: "西藏自治区", region: "southwest" })
    expect(resolveProvinceClick("香港特别行政区")).toBeUndefined()
    expect(resolveProvinceClick("台湾省")).toBeUndefined()
  })
})
