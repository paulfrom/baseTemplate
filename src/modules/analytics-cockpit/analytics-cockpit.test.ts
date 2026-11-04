import { describe, expect, it } from "vitest"
import { getAnalyticsOverview, MOCK_ANALYTICS_METRICS } from "./mockData"

describe("analytics cockpit mock contract", () => {
  it("provides a decision-oriented overview metric set", () => {
    const overview = getAnalyticsOverview({ period: "month", scope: "all", carrier: "all" })

    expect(overview.kpis).toHaveLength(8)
    expect(overview.kpis.map((item) => item.label)).toEqual([
      "物流需求量",
      "实际发运量",
      "物流费用",
      "平均单吨物流成本",
      "准时到货率",
      "平均装载率",
      "物流异常率",
      "累计降本金额",
    ])
    expect(overview.kpis.every((item) => item.definition.length > 0)).toBe(true)
  })

  it("uses the same filter scope for regions, KPIs and carrier volume", () => {
    const national = getAnalyticsOverview({ period: "month", scope: "all", carrier: "all" })
    const east = getAnalyticsOverview({ period: "month", scope: "east", carrier: "all" })

    expect(east.scopeLabel).toBe("华东区域")
    expect(east.kpis[0]?.value).not.toBe(national.kpis[0]?.value)
    expect(east.carrierPerformance[0]?.shippedTons).toBeLessThan(national.carrierPerformance[0]?.shippedTons || 0)
  })

  it("covers all 8 major logistics regions", () => {
    const overview = getAnalyticsOverview({ period: "month", scope: "all", carrier: "all" })

    expect(overview.regions).toHaveLength(8)
    expect(overview.regions.map((r) => r.name)).toEqual([
      "华东区域",
      "山东区域",
      "华南区域",
      "华北区域",
      "华中区域",
      "西南区域",
      "西北区域",
      "东北区域",
    ])

    // 验证八大区域合计数据与全国大盘守恒
    const totalDemands = overview.regions.reduce((sum, r) => sum + r.demandCount, 0)
    expect(totalDemands).toBe(1286)

    const totalShippedTons = overview.regions.reduce((sum, r) => sum + r.shippedTons, 0)
    expect(totalShippedTons).toBe(38620)

    const totalCost = Number(overview.regions.reduce((sum, r) => sum + r.costWan, 0).toFixed(1))
    expect(totalCost).toBe(738.6)
  })

  it("changes aggregate values with the selected period", () => {
    const month = getAnalyticsOverview({ period: "month", scope: "all", carrier: "all" })
    const quarter = getAnalyticsOverview({ period: "quarter", scope: "all", carrier: "all" })

    expect(quarter.periodLabel).toBe("2026年第三季度")
    expect(Number(quarter.kpis[0]?.value.replace(/[^0-9.]/g, ""))).toBeGreaterThan(Number(month.kpis[0]?.value.replace(/[^0-9.]/g, "")))
  })

  it("can narrow the carrier performance view to one carrier", () => {
    const carrier = "顺丰物流运输有限公司"
    const overview = getAnalyticsOverview({ period: "month", scope: "all", carrier })

    expect(overview.carrierLabel).toBe(carrier)
    expect(overview.carrierPerformance).toHaveLength(1)
    expect(overview.carrierPerformance[0]?.name).toBe(carrier)
  })

  it("ranks carriers by contract amount descending rather than composite score", () => {
    const overview = getAnalyticsOverview({ period: "month", scope: "all", carrier: "all" })
    const amounts = overview.carrierPerformance.map((c) => c.contractAmountWan)
    expect(amounts).toEqual([...amounts].sort((a, b) => b - a))
    const kyIndex = overview.carrierPerformance.findIndex((c) => c.name.includes("跨越"))
    const dbIndex = overview.carrierPerformance.findIndex((c) => c.name.includes("德邦"))
    expect(kyIndex).toBeLessThan(dbIndex)
    expect(overview.carrierPerformance[0]?.contractAmountWan).toBe(3860)
  })

  it("keeps the legacy export available for existing module consumers", () => {
    expect(MOCK_ANALYTICS_METRICS).toHaveLength(4)
    expect(MOCK_ANALYTICS_METRICS[0]?.name).toBe("物流需求量")
  })
})
