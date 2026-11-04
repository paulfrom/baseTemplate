import type { EChartsOption, EffectScatterSeriesOption, LineSeriesOption, LinesSeriesOption, MapSeriesOption, ScatterSeriesOption } from "echarts"
import { createTrendOption, trendThemeDark, trendThemeLight } from "../../components/charts/trendChartOption"
import type { TrendSeries } from "../../components/charts/trendChartOption"
import { createTrackMapOption, createSouthSeaInsetOption, trackMapThemeDark, trackMapThemeLight } from "../../components/charts/trackMapOption"
import type { TrackRoute } from "../../components/charts/trackMapOption"

export interface CockpitPalette {
  dark: boolean
  reducedMotion?: boolean
  primary: string
  warning: string
  success: string
  text: string
  border: string
}

/** 只调整驾驶舱的图表表现，不改变共用趋势图或地图的默认样式。 */
export function createCockpitTrendOption(series: TrendSeries[], palette: CockpitPalette, compact = false): EChartsOption {
  const option = createTrendOption(series, palette.dark ? trendThemeDark : trendThemeLight)
  return {
    ...option,
    animation: false,
    grid: { left: compact ? 30 : 46, right: compact ? 12 : 48, top: compact ? 12 : 40, bottom: 24, containLabel: false },
    legend: { ...option.legend, show: !compact, textStyle: { color: palette.text, fontSize: 12 } },
    xAxis: { ...option.xAxis, axisLabel: { color: palette.text, fontSize: 12, interval: compact ? 4 : "auto", showMinLabel: true, showMaxLabel: true } },
    yAxis: (Array.isArray(option.yAxis) ? option.yAxis : []).map((axis) => ({
      ...axis,
      splitNumber: compact ? 2 : 4,
      axisLabel: { color: palette.text, fontSize: 12 },
    })),
    series: (option.series as LineSeriesOption[]).map((item) => ({ ...item, symbolSize: compact ? 4 : 5, showSymbol: true })),
  }
}

export interface CockpitMapViewOptions {
  mapName?: string
  areaNames?: string[]
  focus?: boolean
  drillable?: boolean
}

export function createCockpitMapOptions(
  routes: TrackRoute[],
  dark: boolean,
  reducedMotion = false,
  view: CockpitMapViewOptions = {},
) {
  const theme = dark ? trackMapThemeDark : trackMapThemeLight
  const option = createTrackMapOption(routes, theme)
  const mapName = view.mapName ?? (option.geo as { map?: string } | undefined)?.map ?? "china-mainland"
  let series: Array<LinesSeriesOption | ScatterSeriesOption | EffectScatterSeriesOption | MapSeriesOption> = (option.series as (LinesSeriesOption | ScatterSeriesOption | EffectScatterSeriesOption)[])
    .filter((item) => item.type !== "effectScatter")
    .map((item) => item.type === "lines"
      ? { ...item, effect: { ...item.effect, show: !reducedMotion && item.effect?.show === true, symbolSize: 4, trailLength: 0.16, period: item.name === "轨迹异常" ? 8 : 6 }, lineStyle: { ...item.lineStyle, width: item.name === "轨迹异常" ? 1.8 : 1.2, opacity: item.name === "轨迹异常" ? 0.85 : 0.45, type: item.name === "轨迹异常" ? "dashed" as const : "solid" as const } }
      : { ...item, labelLayout: { hideOverlap: true } })

  if (view.focus) {
    const normal = series.filter((item) => item.type === "lines" && item.name === "正常运输") as LinesSeriesOption[]
    const others = series.filter((item) => !(item.type === "lines" && item.name === "正常运输"))
    const template = normal.find((item) => item.effect?.show) ?? normal[0]
    if (template) {
      const lineData: unknown[] = []
      for (const item of normal) {
        if (Array.isArray(item.data)) lineData.push(...item.data)
      }
      series = [{
        ...template,
        data: lineData as never,
        effect: { ...template.effect, show: !reducedMotion, symbolSize: 4, trailLength: 0.16, period: 6 },
        lineStyle: { ...template.lineStyle, width: 1.5, opacity: 0.7 },
      }, ...others]
    }
    const nodes = series.find((item) => item.name === "节点") as ScatterSeriesOption | undefined
    const labeled = (nodes?.data as Array<{ name?: string; value?: unknown }> | undefined)?.map((node) => ({ name: node.name, value: node.value }))
    series = series.map((item) => item.name === "节点标签" ? { ...item, data: labeled } : item) as typeof series
  }

  if (view.areaNames?.length) {
    series = [
      {
        type: "map",
        map: mapName,
        geoIndex: 0,
        zlevel: 0,
        silent: false,
        selectedMode: false,
        itemStyle: { areaColor: "transparent", borderWidth: 0 },
        emphasis: {
          itemStyle: { areaColor: dark ? "rgba(58,168,255,0.16)" : "rgba(0,142,224,0.12)", borderColor: theme.lineNormal, borderWidth: 1 },
          label: { show: true, color: theme.textColor, fontWeight: 600, fontSize: 12 },
        },
        data: view.areaNames.map((name) => ({ name })),
      } as MapSeriesOption,
      ...series,
    ]
  }

  const originalFormatter = (option.tooltip as { formatter?: (params: unknown) => string } | undefined)?.formatter
  return {
    main: {
      ...option,
      animation: false,
      geo: {
        ...option.geo,
        map: mapName,
        layoutCenter: undefined,
        layoutSize: undefined,
        left: 8,
        right: 8,
        top: 8,
        bottom: 32,
        preserveAspect: "contain",
        silent: false,
        emphasis: {
          itemStyle: { areaColor: dark ? "#243447" : "#e7f3fb", borderColor: theme.lineNormal },
          label: { show: true, color: theme.textColor },
        },
      },
      tooltip: {
        ...option.tooltip,
        formatter: (params: unknown) => {
          const item = params as { componentType?: string; seriesType?: string; name?: string }
          if (item.componentType === "geo" || item.seriesType === "map") {
            return view.drillable === false ? (item.name ?? "") : `${item.name ?? ""}<br/>点击查看内部轨迹`
          }
          return originalFormatter?.(params) ?? ""
        },
      },
      series,
    } as EChartsOption,
    inset: createSouthSeaInsetOption(theme),
  }
}
