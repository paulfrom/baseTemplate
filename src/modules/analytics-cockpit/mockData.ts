import type {
  AnalyticsCarrierPerformance,
  AnalyticsExceptionItem,
  AnalyticsFilters,
  AnalyticsFulfillmentStatus,
  AnalyticsMetricItem,
  AnalyticsOverviewData,
  AnalyticsRegionItem,
  AnalyticsScope,
} from "./types"

export const ANALYTICS_SCOPE_LABELS: Record<AnalyticsScope, string> = {
  all: "全国",
  east: "华东区域",
  shandong: "山东区域",
  south: "华南区域",
  north: "华北区域",
  central: "华中区域",
  southwest: "西南区域",
  northwest: "西北区域（不含西藏）",
  northeast: "东北区域",
}

export const ANALYTICS_CARRIERS = [
  "示例供应链物流有限公司",
  "顺丰物流运输有限公司",
  "德邦物流运输有限公司",
  "跨越物流运输有限公司",
  "货拉拉物流运输有限公司",
]

const BASE_REGIONS: AnalyticsRegionItem[] = [
  { key: "east", name: "华东区域", demandCount: 280, shippedTons: 8650, costWan: 163.2, onTimeRate: 97.8, exceptionRate: 1.6 },
  { key: "shandong", name: "山东区域", demandCount: 260, shippedTons: 7800, costWan: 144.5, onTimeRate: 98.2, exceptionRate: 1.4 },
  { key: "south", name: "华南区域", demandCount: 210, shippedTons: 6240, costWan: 118.6, onTimeRate: 97.1, exceptionRate: 2.1 },
  { key: "north", name: "华北区域", demandCount: 165, shippedTons: 4950, costWan: 95.8, onTimeRate: 96.5, exceptionRate: 2.5 },
  { key: "central", name: "华中区域", demandCount: 145, shippedTons: 4320, costWan: 83.2, onTimeRate: 96.0, exceptionRate: 2.8 },
  { key: "southwest", name: "西南区域", demandCount: 115, shippedTons: 3460, costWan: 69.5, onTimeRate: 95.8, exceptionRate: 3.2 },
  { key: "northwest", name: "西北区域", demandCount: 65, shippedTons: 1950, costWan: 38.6, onTimeRate: 95.2, exceptionRate: 3.6 },
  { key: "northeast", name: "东北区域", demandCount: 46, shippedTons: 1250, costWan: 25.2, onTimeRate: 95.5, exceptionRate: 3.4 },
]

const BASE_STATUSES: AnalyticsFulfillmentStatus[] = [
  { key: "pending-allocation", label: "待配载", count: 108, color: "var(--color-warning)" },
  { key: "pending-dispatch", label: "待派单", count: 52, color: "var(--color-info)" },
  { key: "pending-confirm", label: "待承运确认", count: 24, color: "#7a5af8" },
  { key: "pending-departure", label: "待发运", count: 63, color: "#36bffa" },
  { key: "in-transit", label: "运输中", count: 315, color: "var(--color-primary)" },
  { key: "pending-receipt", label: "待签收", count: 72, color: "#f79009" },
  { key: "completed", label: "已完成", count: 652, color: "var(--color-success)" },
]

const BASE_CARRIERS: AnalyticsCarrierPerformance[] = [
  { key: "carrier-001", rank: 1, name: "示例供应链物流有限公司", contractAmountWan: 3860, shippedTons: 8230, onTimeRate: 98.2, exceptionRate: 1.2, unitCost: 176, score: 96.5, trend: "up" },
  { key: "carrier-002", rank: 2, name: "顺丰物流运输有限公司", contractAmountWan: 2950, shippedTons: 6850, onTimeRate: 97.5, exceptionRate: 1.8, unitCost: 181, score: 94.8, trend: "flat" },
  { key: "carrier-003", rank: 3, name: "跨越物流运输有限公司", contractAmountWan: 2180, shippedTons: 4380, onTimeRate: 95.9, exceptionRate: 3.1, unitCost: 188, score: 89.4, trend: "down" },
  { key: "carrier-004", rank: 4, name: "德邦物流运输有限公司", contractAmountWan: 1740, shippedTons: 5720, onTimeRate: 96.8, exceptionRate: 2.4, unitCost: 184, score: 92.6, trend: "up" },
  { key: "carrier-005", rank: 5, name: "货拉拉物流运输有限公司", contractAmountWan: 860, shippedTons: 3260, onTimeRate: 94.6, exceptionRate: 4.2, unitCost: 193, score: 86.8, trend: "flat" },
]

const PERIOD_LABELS: Record<AnalyticsFilters["period"], string> = {
  month: "2026年08月",
  quarter: "2026年第三季度",
  year: "2026年度",
}

const scaleNumber = (value: number, factor: number, digits = 0) => Number((value * factor).toFixed(digits))

function selectedFactor(filters: AnalyticsFilters) {
  const scopeFactor: Record<AnalyticsScope, number> = {
    all: 1,
    east: 0.22,
    shandong: 0.2,
    south: 0.16,
    north: 0.13,
    central: 0.11,
    southwest: 0.09,
    northwest: 0.05,
    northeast: 0.04,
  }
  const carrierFactor = filters.carrier === "all" ? 1 : 0.24
  const periodFactor: Record<AnalyticsFilters["period"], number> = { month: 1, quarter: 2.8, year: 10.2 }
  return scopeFactor[filters.scope] * carrierFactor * periodFactor[filters.period]
}

function withCarrierFilter(items: AnalyticsCarrierPerformance[], carrier: AnalyticsFilters["carrier"]) {
  const filtered = carrier === "all" ? items : items.filter((item) => item.name === carrier)
  return filtered.map((item, index) => ({ ...item, rank: index + 1 }))
}

export function getAnalyticsOverview(filters: AnalyticsFilters): AnalyticsOverviewData {
  const factor = selectedFactor(filters)
  const scopeLabel = ANALYTICS_SCOPE_LABELS[filters.scope]
  const carrierLabel = filters.carrier === "all" ? "全部承运商" : filters.carrier
  const scopedRegion = filters.region && filters.region !== "all" ? filters.region : filters.scope
  const selectedRegion = BASE_REGIONS.find((item) => item.key === scopedRegion)
  const onTimeRate = selectedRegion?.onTimeRate ?? 96.8
  const exceptionRate = selectedRegion?.exceptionRate ?? 2.8

  const regions = BASE_REGIONS.map((item) => ({
    ...item,
    demandCount: Math.max(1, scaleNumber(item.demandCount, factor)),
    shippedTons: Math.max(1, scaleNumber(item.shippedTons, factor)),
    costWan: scaleNumber(item.costWan, factor, 1),
  }))
  const fulfillmentStatuses = BASE_STATUSES.map((item) => ({
    ...item,
    count: Math.max(1, scaleNumber(item.count, factor)),
  }))
  const shippedTons = Math.max(1, scaleNumber(38620, factor))
  const logisticsCost = scaleNumber(738.6, factor, 1)
  const savings = scaleNumber(46.8, factor, 1)
  const kpis = [
    { key: "demand", label: "物流需求量", value: `${scaleNumber(1286, factor).toLocaleString()} 笔`, trend: "+12.6%", trendLabel: "环比上月", tone: "primary" as const, definition: "筛选周期内已进入物流履约管理范围的需求单数量" },
    { key: "shipment", label: "实际发运量", value: `${shippedTons.toLocaleString()} t`, trend: "+8.2%", trendLabel: "环比上月", tone: "primary" as const, definition: "筛选周期内已生成运输任务并进入发运链路的货量" },
    { key: "cost", label: "物流费用", value: `¥${logisticsCost.toFixed(1)} 万`, trend: "+4.7%", trendLabel: "环比上月", tone: "warning" as const, definition: "演示口径：运输基础费及已确认附加费用合计" },
    { key: "unit-cost", label: "平均单吨物流成本", value: `¥${(182.4 * (filters.carrier === "all" ? 1 : 0.97)).toFixed(1)} / t`, trend: "-5.6%", trendLabel: "环比上月", tone: "success" as const, definition: "演示口径：物流费用 ÷ 实际发运量" },
    { key: "on-time", label: "准时到货率", value: `${onTimeRate.toFixed(1)}%`, trend: "+1.3 pct", trendLabel: "环比上月", tone: "success" as const, definition: "演示口径：在承诺到货时间内完成到货确认的任务占比" },
    { key: "load", label: "平均装载率", value: "87.6%", trend: "+3.8 pct", trendLabel: "环比上月", tone: "success" as const, definition: "演示口径：已配载任务的计划装载量与可用运力之比" },
    { key: "exception", label: "物流异常率", value: `${exceptionRate.toFixed(1)}%`, trend: "-0.8 pct", trendLabel: "环比上月", tone: "success" as const, definition: "筛选周期内产生异常记录的运输任务占比" },
    { key: "saving", label: "累计降本金额", value: `¥${savings.toFixed(1)} 万`, trend: "5.96%", trendLabel: "较基准成本", tone: "success" as const, definition: "演示口径：基准物流费用与实际物流费用的差额，基准尚待技术和财务确认" },
  ]

  const exceptionItems: AnalyticsExceptionItem[] = [
    { label: "运输延迟", count: Math.max(1, scaleNumber(32, factor)), percent: 32, color: "var(--color-warning)" },
    { label: "轨迹异常", count: Math.max(1, scaleNumber(21, factor)), percent: 21, color: "var(--color-primary)" },
    { label: "货损货差", count: Math.max(1, scaleNumber(17, factor)), percent: 17, color: "var(--color-error)" },
    { label: "签收异常", count: Math.max(1, scaleNumber(13, factor)), percent: 13, color: "#7a5af8" },
    { label: "费用异常", count: Math.max(1, scaleNumber(10, factor)), percent: 10, color: "#36bffa" },
  ]

  return {
    periodLabel: PERIOD_LABELS[filters.period],
    scopeLabel,
    carrierLabel,
    kpis,
    regions,
    fulfillmentStatuses,
    fulfillmentHealth: exceptionRate <= 2.5 ? "良好" : exceptionRate <= 3.5 ? "关注" : "风险",
    averageCycle: "2.8 天",
    overdueCount: Math.max(1, scaleNumber(26, factor)),
    costTrend: [704, 718, 731, 722, 749, 738.6].map((value, index) => ({ label: `${index + 3}月`, value: scaleNumber(value, factor, 1) })),
    unitCostTrend: [194, 191, 188, 186, 184, 182.4].map((value, index) => ({ label: `${index + 3}月`, value: scaleNumber(value, 1, 1) })),
    qualityTrend: [95.1, 95.7, 96.0, 95.8, 96.5, onTimeRate].map((value, index) => ({ label: `${index + 3}月`, value })),
    exceptionTrend: [3.9, 3.6, 3.4, 3.1, 2.9, exceptionRate].map((value, index) => ({ label: `${index + 3}月`, value })),
    allocationMetrics: [
      { label: "配载完成率", value: "91.2%", percent: 91.2, helper: "进入承运需求生成链路", tone: "primary" as const },
      { label: "平均装载率", value: "87.6%", percent: 87.6, helper: "按计划装载量测算", tone: "success" as const },
      { label: "拼载需求占比", value: "42.3%", percent: 42.3, helper: "存在两笔及以上合并需求", tone: "primary" as const },
      { label: "低载任务", value: "23 笔", helper: "装载率低于 70%", tone: "warning" as const },
    ],
    exceptionItems,
    carrierPerformance: withCarrierFilter(BASE_CARRIERS, filters.carrier).map((item) => ({
      ...item,
      contractAmountWan: Math.max(1, scaleNumber(item.contractAmountWan, factor)),
      shippedTons: Math.max(1, scaleNumber(item.shippedTons, factor)),
    })),
  }
}

/** 兼容旧测试和外部导入；新页面使用 getAnalyticsOverview。 */
export const MOCK_ANALYTICS_METRICS: AnalyticsMetricItem[] = getAnalyticsOverview({ period: "month", scope: "all", carrier: "all" }).kpis.slice(0, 4).map((item) => ({
  key: item.key,
  name: item.label,
  value: item.value,
  change: item.trend,
  isUp: item.tone === "success" || item.tone === "primary",
}))
