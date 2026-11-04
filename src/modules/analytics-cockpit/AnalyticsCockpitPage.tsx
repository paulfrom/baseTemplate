import {
  ArrowDownOutlined, ArrowUpOutlined, ClockCircleOutlined, DownloadOutlined,
  InfoCircleOutlined, MinusOutlined, ReloadOutlined,
} from "@ead/suid-icons"
import { Button, Card, Progress, Segmented, Select, Space, Table, Tag, Tooltip, Typography, message } from "@ead/suid"
import type { TableColumnsType } from "@ead/suid"
import { useEffect, useMemo, useRef, useState } from "react"
import "./analytics-cockpit.css"
import { EChart } from "../../components/charts/EChart"
import { CockpitTrackMap } from "./CockpitTrackMap"
import { createCockpitTrendOption } from "./cockpit-chart-options"
import type { CockpitPalette } from "./cockpit-chart-options"
import { ANALYTICS_CARRIERS, ANALYTICS_SCOPE_LABELS, getAnalyticsOverview } from "./mockData"
import type { AnalyticsFilters, AnalyticsKpi, AnalyticsOverviewData, AnalyticsRegionItem, AnalyticsRegionMode, AnalyticsScope, AnalyticsSubTab } from "./types"

const { Text, Title } = Typography
interface PageProps { subTab?: AnalyticsSubTab }
function formatNumber(value: number, digits = 0) {
  return value.toLocaleString("zh-CN", { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

/** 拆开显示数值与单位，保留传入的指标值及其业务口径。 */
function MetricValue({ value }: { value: string }) {
  const parts = value.match(/^([¥￥]?)([\d,.]+)\s*(.*)$/)
  if (!parts) return <>{value}</>
  const unit = parts[1] ? parts[3].trim() === "万" ? "万元" : parts[3].includes("/") ? "元/t" : "元" : parts[3]
  return <>{parts[2]}{unit && <span className="analytics-cockpit__value-unit">{unit}</span>}</>
}

function KpiStrip({ items }: { items: AnalyticsKpi[] }) {
  return <div className="analytics-cockpit__kpi-strip" role="list" aria-label="核心指标">
    {items.map((item) => <div key={item.key} className={`analytics-cockpit__kpi-cell analytics-cockpit__kpi-cell--${item.key}`} role="listitem">
      <Tooltip title={item.definition}><button type="button" className="analytics-cockpit__kpi-label analytics-cockpit__definition" aria-label={`${item.label}指标口径`}>{item.label}</button></Tooltip>
      <div className="analytics-cockpit__kpi-value"><MetricValue value={item.value} /></div>
      <div className={`analytics-cockpit__kpi-change analytics-cockpit__kpi-change--${item.tone}`}>
        <strong>{item.trend.startsWith("-") ? <ArrowDownOutlined /> : item.trend.startsWith("+") ? <ArrowUpOutlined /> : null} {item.trend.replace(/^[+-]/, "").replace("pct", "个百分点")}</strong><span>{item.trendLabel}</span>
      </div>
    </div>)}
  </div>
}

function ControlTower({ data, palette }: { data: AnalyticsOverviewData; palette: CockpitPalette }) {
  const total = data.fulfillmentStatuses.reduce((sum, item) => sum + item.count, 0)
  const healthTone = data.fulfillmentHealth === "良好" ? "success" : data.fulfillmentHealth === "风险" ? "danger" : "warning"
  const exceptionKpi = data.kpis.find((item) => item.key === "exception")
  const exceptionOption = useMemo(() => createCockpitTrendOption([{ name: "异常率(%)", data: data.exceptionTrend, color: palette.warning, yAxis: "left" }], palette, true), [data.exceptionTrend, palette])
  return <div className="analytics-cockpit__tower">
    <Card className="analytics-cockpit__panel analytics-cockpit__status-panel">
      <div className="analytics-cockpit__panel-head"><h2 className="analytics-cockpit__panel-title">履约运行态势</h2></div>
      <div className={`analytics-cockpit__health analytics-cockpit__health--${healthTone}`}><span>履约健康度</span><strong>{data.fulfillmentHealth}</strong></div>
      <div className="analytics-cockpit__status-list">{data.fulfillmentStatuses.map((item) => <div className="analytics-cockpit__status-row" key={item.key}>
        <span>{item.label}</span><Progress aria-label={`${item.label}占比`} percent={total ? item.count / total * 100 : 0} showInfo={false} strokeColor={item.key === "completed" ? "var(--analytics-success)" : item.key === "pending-allocation" ? "var(--analytics-warning)" : item.key === "in-transit" ? "var(--color-primary)" : "var(--analytics-region-bar)"} size="small" /><strong>{formatNumber(item.count)}</strong>
      </div>)}</div>
      <div className="analytics-cockpit__tower-footer"><div><span>履约周期</span><strong>{data.averageCycle}</strong></div><div><span>超期任务</span><strong className="analytics-cockpit__warning">{data.overdueCount}<small> 笔</small></strong></div></div>
    </Card>
    <CockpitTrackMap palette={palette} />
    <Card className="analytics-cockpit__panel analytics-cockpit__risk-panel">
      <div className="analytics-cockpit__panel-head"><h2 className="analytics-cockpit__panel-title">异常风险</h2></div>
      <div className="analytics-cockpit__exception-highlight"><strong><MetricValue value={exceptionKpi?.value ?? "--"} /></strong><span>当前异常率</span></div>
      <div className="analytics-cockpit__exception-improve"><ArrowDownOutlined /> {exceptionKpi?.trend.replace("-", "").replace("pct", "个百分点")}<span>较上月改善</span></div>
      <div className="analytics-cockpit__exception-list">{data.exceptionItems.map((item, index) => <div className="analytics-cockpit__exception-item" key={item.label}>
        <span>{item.label}</span><Progress aria-label={`${item.label}异常数量对比`} percent={Math.max(...data.exceptionItems.map((entry) => entry.count)) ? item.count / Math.max(...data.exceptionItems.map((entry) => entry.count)) * 100 : 0} showInfo={false} strokeColor={index === 0 ? "var(--analytics-risk-bar)" : "var(--analytics-neutral-bar)"} size="small" /><strong>{formatNumber(item.count)}</strong>
      </div>)}</div>
      <div className="analytics-cockpit__mini-trend"><Text type="secondary">异常率趋势 · 近 6 月</Text><div className="analytics-cockpit__mini-chart"><EChart option={exceptionOption} ariaLabel="异常率趋势" minHeight={0} /></div></div>
    </Card>
  </div>
}

function regionMetric(region: AnalyticsRegionItem, mode: AnalyticsRegionMode) {
  if (mode === "cost") return { number: region.costWan, value: `¥${formatNumber(region.costWan, 1)} 万` }
  if (mode === "exception") return { number: region.exceptionRate, value: `${region.exceptionRate.toFixed(1)}%` }
  return { number: region.shippedTons, value: `${formatNumber(region.shippedTons)} t` }
}

function RegionSummary({ data, mode, selected, onModeChange, onSelect }: {
  data: AnalyticsOverviewData; mode: AnalyticsRegionMode; selected: AnalyticsScope
  onModeChange: (mode: AnalyticsRegionMode) => void; onSelect: (scope: AnalyticsScope) => void
}) {
  const max = Math.max(0, ...data.regions.map((region) => regionMetric(region, mode).number))
  return <Card className="analytics-cockpit__panel analytics-cockpit__region-panel">
    <div className="analytics-cockpit__panel-head"><h2 className="analytics-cockpit__panel-title">区域表现</h2><div className="analytics-cockpit__region-controls"><span className="analytics-cockpit__panel-meta">区域指标</span><Segmented aria-label="区域指标" size="small" value={mode} onChange={(value) => onModeChange(value as AnalyticsRegionMode)} options={[{ label: "发运量", value: "volume" }, { label: "物流费用", value: "cost" }, { label: "异常率", value: "exception" }]} /></div></div>
    <div className="analytics-cockpit__region-summary">{data.regions.map((region) => {
      const metric = regionMetric(region, mode)
      return <button key={region.key} type="button" aria-pressed={selected === region.key} className="analytics-cockpit__region-chip" onClick={() => onSelect(region.key)}>
        <span className="analytics-cockpit__region-chip-name">{region.name}</span><span className="analytics-cockpit__region-chip-value"><MetricValue value={metric.value} /></span>
        <Progress percent={max ? Math.max(8, Math.round(metric.number / max * 100)) : 0} showInfo={false} size="small" strokeColor={selected === region.key ? "var(--color-primary)" : mode === "exception" ? "var(--analytics-warning)" : "var(--analytics-region-bar)"} />
      </button>
    })}</div>
  </Card>
}

function AnalysisLayer({ data, palette }: { data: AnalyticsOverviewData; palette: CockpitPalette }) {
  const [trendView, setTrendView] = useState<"cost" | "quality">("cost")
  const option = useMemo(() => createCockpitTrendOption(trendView === "cost" ? [
    { name: "物流费用(万元)", data: data.costTrend, color: palette.primary, yAxis: "left" },
    { name: "单吨成本(元)", data: data.unitCostTrend, color: palette.warning, yAxis: "right", dashed: true },
  ] : [
    { name: "准时到货率(%)", data: data.qualityTrend, color: palette.success, yAxis: "left" },
    { name: "异常率(%)", data: data.exceptionTrend, color: palette.warning, yAxis: "right", dashed: true },
  ], palette), [trendView, data, palette])
  return <>
    <div className="analytics-cockpit__analysis">
      <Card className="analytics-cockpit__panel"><div className="analytics-cockpit__panel-head"><h2 className="analytics-cockpit__panel-title">经营趋势</h2><Segmented aria-label="经营趋势指标" size="small" value={trendView} onChange={(value) => setTrendView(value as "cost" | "quality")} options={[{ label: "成本效率", value: "cost" }, { label: "履约质量", value: "quality" }]} /></div><div className="analytics-cockpit__trend-chart"><EChart option={option} ariaLabel={trendView === "cost" ? "成本效率趋势" : "履约质量趋势"} minHeight={0} /></div></Card>
      <Card className="analytics-cockpit__panel"><div className="analytics-cockpit__panel-head"><h2 className="analytics-cockpit__panel-title">承运商 TOP5</h2></div>
        <div className="analytics-cockpit__rank-list">{data.carrierPerformance.slice(0, 5).map((item) => <div className="analytics-cockpit__rank-item" key={item.key}>
          <span className="analytics-cockpit__rank-no">{String(item.rank).padStart(2, "0")}</span><div className="analytics-cockpit__rank-body"><Tooltip title={item.name}><div className="analytics-cockpit__rank-name">{item.name}</div></Tooltip><div className="analytics-cockpit__rank-meta"><span>准时 {item.onTimeRate.toFixed(1)}%</span><span>异常 {item.exceptionRate.toFixed(1)}%</span></div></div>
          <div className="analytics-cockpit__rank-score">
            <strong>¥{item.contractAmountWan.toLocaleString()}万</strong>
            <span className="analytics-cockpit__rank-score-sub">
              <span>评分 {item.score.toFixed(1)}</span>
              <span aria-label={item.trend === "up" ? "评分上升" : item.trend === "down" ? "评分下降" : "评分持平"}>
                {item.trend === "up" ? <ArrowUpOutlined className="analytics-cockpit__success" /> : item.trend === "down" ? <ArrowDownOutlined className="analytics-cockpit__danger" /> : <MinusOutlined />}
              </span>
            </span>
          </div>
        </div>)}</div>
      </Card>
    </div>
    <Card className="analytics-cockpit__panel"><div className="analytics-cockpit__panel-head"><h2 className="analytics-cockpit__panel-title">配载与运输效率</h2></div>
      <div className="analytics-cockpit__alloc-grid">{data.allocationMetrics.map((item) => <div className="analytics-cockpit__alloc-cell" key={item.label}><div className="analytics-cockpit__alloc-label">{item.label}</div><div className="analytics-cockpit__alloc-value"><MetricValue value={item.value} /></div>{item.percent !== undefined && <Progress percent={item.percent} showInfo={false} strokeColor={item.tone === "success" ? "var(--analytics-success)" : item.tone === "warning" ? "var(--analytics-warning)" : "var(--color-primary)"} size="small" />}<div className="analytics-cockpit__alloc-helper">{item.helper}</div></div>)}</div>
    </Card>
  </>
}

export function AnalyticsCockpitPage(_props: PageProps) {
  const [regionMode, setRegionMode] = useState<AnalyticsRegionMode>("volume")
  const [selectedRegion, setSelectedRegion] = useState<AnalyticsScope>("all")
  const [filters, setFilters] = useState<AnalyticsFilters>({ period: "month", scope: "all", carrier: "all" })
  const [messageApi, contextHolder] = message.useMessage()
  const data = useMemo(() => getAnalyticsOverview({ ...filters, region: selectedRegion }), [filters, selectedRegion])
  const pageRef = useRef<HTMLDivElement>(null)
  const [palette, setPalette] = useState<CockpitPalette>({ dark: false, primary: "#008ee0", warning: "#ad6800", success: "#087f2e", text: "#667085", border: "#e8e8e8" })

  // Canvas 不解析 CSS var()；读取本页真实主题色，并观察最近的主题容器。
  useEffect(() => {
    const page = pageRef.current
    if (!page) return
    const themeRoot = page.closest("[data-theme]") ?? document.documentElement
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const detect = () => {
      const style = getComputedStyle(page)
      const color = (name: string, fallback: string) => {
        let value = style.getPropertyValue(name).trim() || fallback
        const nested = value.match(/^var\((--[\w-]+)/)
        if (nested) value = style.getPropertyValue(nested[1]).trim() || fallback
        return value.startsWith("var(") ? fallback : value
      }
      const currentTheme = themeRoot.getAttribute("data-theme")
      const isDarkTheme = currentTheme === "dark" || currentTheme === "obsidian" || currentTheme === "slate"
      setPalette({
        dark: isDarkTheme,
        reducedMotion: motionQuery.matches,
        primary: color("--color-primary", "#008ee0"),
        warning: color("--analytics-warning", "#c47517"),
        success: color("--analytics-success", "#178466"),
        text: color("--analytics-muted", "#718096"),
        border: color("--color-border-soft", "#e8e8e8"),
      })
    }
    detect()
    motionQuery.addEventListener("change", detect)
    const observer = new MutationObserver(detect)
    observer.observe(themeRoot, { attributes: true, attributeFilter: ["data-theme"] })
    return () => { observer.disconnect(); motionQuery.removeEventListener("change", detect) }
  }, [])

  const updateFilter = <K extends keyof AnalyticsFilters>(key: K, value: AnalyticsFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }))
    if (key === "scope") setSelectedRegion(value as AnalyticsScope)
  }

  return (
    <div ref={pageRef} className="prototype-page prototype-dashboard-page analytics-cockpit">
      {contextHolder}

      {/* 紧凑顶部控制区：标题 + 工具栏合一 */}
      <div className="analytics-cockpit__topbar">
        <div className="analytics-cockpit__topbar-left">
          <Title level={1} className="analytics-cockpit__topbar-title">数据驾驶舱</Title>
          <Text className="analytics-cockpit__subtitle">总览物流规模、履约质量与成本效率</Text>
        </div>
        <Space wrap className="analytics-cockpit__topbar-actions">
          <Tag color="processing">原型演示数据</Tag>
          <Text type="secondary" className="analytics-cockpit__update-time"><ClockCircleOutlined /> 演示数据快照</Text>
          <Button icon={<ReloadOutlined />} onClick={() => messageApi.success("数据驾驶舱已刷新（Mock 数据）")}>刷新</Button>
          <Button icon={<DownloadOutlined />} onClick={() => messageApi.info("原型演示：暂不生成真实报表文件")}>导出</Button>
        </Space>
      </div>

      {/* 紧凑筛选工具栏（不再用独立大 Card） */}
      <div className="analytics-cockpit__toolbar">
        <label className="analytics-cockpit__toolbar-item">
          <span>统计周期</span>
          <Select aria-label="统计周期" value={filters.period} onChange={(value) => updateFilter("period", value)} options={[{ label: "本月", value: "month" }, { label: "本季度", value: "quarter" }, { label: "本年度", value: "year" }]} />
        </label>
        <label className="analytics-cockpit__toolbar-item">
          <span>组织范围</span>
          <Select aria-label="组织范围" value={filters.scope} onChange={(value) => updateFilter("scope", value)} options={Object.entries(ANALYTICS_SCOPE_LABELS).map(([value, label]) => ({ value, label }))} />
        </label>
        <label className="analytics-cockpit__toolbar-item">
          <span>承运商</span>
          <Select aria-label="承运商" value={filters.carrier} onChange={(value) => updateFilter("carrier", value)} options={[{ value: "all", label: "全部承运商" }, ...ANALYTICS_CARRIERS.map((value) => ({ value, label: value }))]} />
        </label>
        <span className="analytics-cockpit__toolbar-summary">{data.periodLabel} · {data.scopeLabel} · {data.carrierLabel}</span>
      </div>

      {/* KPI 指标带：8 个单行 */}
      <KpiStrip items={data.kpis} />

      <ControlTower data={data} palette={palette} />
      <RegionSummary data={data} mode={regionMode} selected={selectedRegion} onModeChange={setRegionMode} onSelect={(region) => {
        setSelectedRegion(region)
        setFilters((current) => ({ ...current, scope: region }))
      }} />
      <AnalysisLayer data={data} palette={palette} />

      {/* 二级详情：承运商完整表格（退出一级视觉） */}
      <details className="analytics-cockpit__details">
        <summary>查看承运商综合表现明细</summary>
      <Card className="analytics-cockpit__panel analytics-cockpit__detail-table">
        <div className="analytics-cockpit__table-head">
          <div><h2 className="analytics-cockpit__panel-title">承运商综合表现（明细）</h2><div className="analytics-cockpit__table-note">口径：{data.periodLabel} · {data.scopeLabel} · {data.carrierLabel}</div></div>
        </div>
        <Table
          className="analytics-cockpit__table"
          rowKey="key"
          dataSource={data.carrierPerformance}
          columns={[
            { title: "排名", dataIndex: "rank", width: 70, align: "center", render: (value: number) => <span className={`analytics-cockpit__rank-no analytics-cockpit__rank-no--${value <= 3 ? `r${value}` : "normal"}`}>{value}</span> },
            { title: "承运商", dataIndex: "name", render: (value: string) => <span className="analytics-cockpit__carrier-name">{value}</span> },
            { title: "合同额", dataIndex: "contractAmountWan", width: 110, align: "right", render: (value: number) => `¥${value.toLocaleString()}万` },
            { title: "承运量", dataIndex: "shippedTons", width: 110, align: "right", render: (value: number) => `${formatNumber(value)} t` },
            { title: "准时到货率", dataIndex: "onTimeRate", width: 120, align: "right", render: (value: number) => <Tag color={value >= 97 ? "success" : value >= 95 ? "processing" : "warning"}>{value.toFixed(1)}%</Tag> },
            { title: "异常率", dataIndex: "exceptionRate", width: 90, align: "right", render: (value: number) => `${value.toFixed(1)}%` },
            { title: "单吨成本", dataIndex: "unitCost", width: 110, align: "right", render: (value: number) => `¥${value}` },
            { title: "综合评分", dataIndex: "score", width: 100, align: "right", render: (value: number) => <strong>{value.toFixed(1)}</strong> },
            { title: "趋势", dataIndex: "trend", width: 70, align: "center", render: (value: string) => value === "up" ? <ArrowUpOutlined style={{ color: "var(--color-success)" }} /> : value === "down" ? <ArrowDownOutlined style={{ color: "var(--color-error)" }} /> : <MinusOutlined style={{ color: "var(--color-text-3)" }} /> },
          ] as TableColumnsType<AnalyticsOverviewData["carrierPerformance"][number]>}
          scroll={{ x: 980 }}
          pagination={false}
          size="middle"
          locale={{ emptyText: "暂无承运商绩效数据" }}
        />
      </Card>
      </details>
      <Text className="analytics-cockpit__footnote"><InfoCircleOutlined /> 以上指标为高保真原型演示数据；降本基准、健康指数和 AI 配载价值尚未形成正式生产口径。</Text>
    </div>
  )
}
