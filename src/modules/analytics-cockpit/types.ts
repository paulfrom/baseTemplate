export type AnalyticsSubTab = "overview" | "fulfillment" | "allocation" | "cost" | "exception" | "carrier"

export type AnalyticsScope =
  | "all"
  | "east"
  | "shandong"
  | "south"
  | "north"
  | "central"
  | "southwest"
  | "northwest"
  | "northeast"
export type AnalyticsRegionMode = "volume" | "cost" | "exception"

export interface AnalyticsFilters {
  period: "month" | "quarter" | "year"
  scope: AnalyticsScope
  carrier: "all" | string
  region?: AnalyticsScope
}

export interface AnalyticsKpi {
  key: string
  label: string
  value: string
  trend: string
  trendLabel: string
  tone: "primary" | "success" | "warning" | "danger" | "neutral"
  definition: string
}

export interface AnalyticsRegionItem {
  key: AnalyticsScope
  name: string
  demandCount: number
  shippedTons: number
  costWan: number
  onTimeRate: number
  exceptionRate: number
}

export interface AnalyticsFulfillmentStatus {
  key: string
  label: string
  count: number
  color: string
}

export interface AnalyticsTrendPoint {
  label: string
  value: number
}

export interface AnalyticsAllocationMetric {
  label: string
  value: string
  percent?: number
  helper: string
  tone: "primary" | "success" | "warning"
}

export interface AnalyticsExceptionItem {
  label: string
  count: number
  percent: number
  color: string
}

export interface AnalyticsCarrierPerformance {
  key: string
  rank: number
  name: string
  contractAmountWan: number
  shippedTons: number
  onTimeRate: number
  exceptionRate: number
  unitCost: number
  score: number
  trend: "up" | "flat" | "down"
}

export interface AnalyticsOverviewData {
  periodLabel: string
  scopeLabel: string
  carrierLabel: string
  kpis: AnalyticsKpi[]
  regions: AnalyticsRegionItem[]
  fulfillmentStatuses: AnalyticsFulfillmentStatus[]
  fulfillmentHealth: "良好" | "关注" | "风险"
  averageCycle: string
  overdueCount: number
  costTrend: AnalyticsTrendPoint[]
  unitCostTrend: AnalyticsTrendPoint[]
  qualityTrend: AnalyticsTrendPoint[]
  exceptionTrend: AnalyticsTrendPoint[]
  allocationMetrics: AnalyticsAllocationMetric[]
  exceptionItems: AnalyticsExceptionItem[]
  carrierPerformance: AnalyticsCarrierPerformance[]
}

/** 保留旧数据结构名称，避免其他原型测试或模块导入时产生无意义的破坏性变更。 */
export interface AnalyticsMetricItem {
  key: string
  name: string
  value: string
  change: string
  isUp: boolean
}
