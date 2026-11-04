import { useEffect, useRef } from "react"
// 按需引入 ECharts 模块：只引入地图轨迹场景需要的部分，控制打包体积
import { LinesChart, MapChart, EffectScatterChart, ScatterChart, LineChart } from "echarts/charts"
import { GeoComponent, GridComponent, TooltipComponent, LegendComponent } from "echarts/components"
import { init, registerMap, use as registerEChartsModules } from "echarts/core"
import type { EChartsCoreOption as EChartsOption, EChartsType } from "echarts/core"
import { CanvasRenderer } from "echarts/renderers"
import chinaProvinceGeoJson from "./assets/china-provinces.json"

// 南海诸岛与海南岛主岛分离处理（沿用大屏方案，保证九段线小图与主图分别渲染）
const SOUTH_SEA_ADCODE = "100000_JD"
const HAINAN_ADCODE = "460000"
const MAIN_MAP_MIN_LATITUDE = 18

function getMaxLatitude(coordinates: unknown): number {
  if (!Array.isArray(coordinates)) return Number.NEGATIVE_INFINITY
  if (typeof coordinates[0] === "number" && typeof coordinates[1] === "number") {
    return coordinates[1]
  }
  return Math.max(...coordinates.map(getMaxLatitude))
}

const hainanFeature = chinaProvinceGeoJson.features.find(
  (feature) => String(feature.properties.adcode) === HAINAN_ADCODE,
)
// 主图：去掉九段线小图框，海南只保留纬度≥18°的主岛部分
export const mainlandGeoJson = {
  ...chinaProvinceGeoJson,
  features: chinaProvinceGeoJson.features
    .filter((feature) => String(feature.properties.adcode) !== SOUTH_SEA_ADCODE)
    .map((feature) => String(feature.properties.adcode) !== HAINAN_ADCODE
      ? feature
      : {
          ...feature,
          geometry: {
            ...feature.geometry,
            coordinates: feature.geometry.coordinates.filter(
              (polygon) => getMaxLatitude(polygon) >= MAIN_MAP_MIN_LATITUDE,
            ),
          },
        }),
}
// 南海诸岛小图：九段线框 + 海南纬度<18°的岛礁
const southSeaGeoJson = {
  ...chinaProvinceGeoJson,
  features: [
    ...chinaProvinceGeoJson.features
      .filter((feature) => String(feature.properties.adcode) === SOUTH_SEA_ADCODE)
      .map((feature) => ({
        ...feature,
        properties: { ...feature.properties, name: "南海诸岛" },
      })),
    ...(hainanFeature
      ? [{
          ...hainanFeature,
          properties: { ...hainanFeature.properties, name: "南海岛礁" },
          geometry: {
            ...hainanFeature.geometry,
            coordinates: hainanFeature.geometry.coordinates.filter(
              (polygon) => getMaxLatitude(polygon) < MAIN_MAP_MIN_LATITUDE,
            ),
          },
        }]
      : []),
  ],
}

registerEChartsModules([
  MapChart,
  LinesChart,
  EffectScatterChart,
  ScatterChart,
  LineChart,
  GeoComponent,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer,
])

// 地图名常量对外暴露，供 option 构造器复用
export const MAP_MAINLAND = "china-mainland"
export const MAP_SOUTH_SEA = "china-south-sea"

registerMap(MAP_MAINLAND, mainlandGeoJson as Parameters<typeof registerMap>[1])
registerMap(MAP_SOUTH_SEA, southSeaGeoJson as Parameters<typeof registerMap>[1])

export interface EChartClickEvent {
  componentType?: string
  seriesType?: string
  name?: string
  dataIndex?: number
  data?: unknown
}

interface EChartProps {
  option: EChartsOption
  ariaLabel: string
  className?: string
  /** 触发 option 全量重建（notMerge）。地图类图表选中态易残留，建议开启。 */
  forceNotMerge?: boolean
  onClick?: (event: EChartClickEvent) => void
  /** 容器最小高度，默认 280；南海诸岛等小图传 0 关闭 */
  minHeight?: number
}

/**
 * 轻量 ECharts 容器：仅注册地图/线/点相关模块。
 * 每次渲染根据 forceNotMerge 或自动检测 map 系列决定增量/全量更新。
 */
export function EChart({ option, ariaLabel, className = "", forceNotMerge, onClick, minHeight }: EChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<EChartsType | null>(null)
  const onClickRef = useRef(onClick)
  onClickRef.current = onClick

  const hasMapSeries = Array.isArray(option.series)
    ? option.series.some((s) => typeof s === "object" && s !== null && (s as { type?: string }).type === "map")
    : typeof option.series === "object" && option.series !== null && (option.series as { type?: string }).type === "map"
  const notMerge = forceNotMerge ?? hasMapSeries

  useEffect(() => {
    if (!containerRef.current) return
    const chart = init(containerRef.current, undefined, { renderer: "canvas" })
    chart.on("click", (params: EChartClickEvent) => onClickRef.current?.(params))
    const resizeObserver = new ResizeObserver(() => chart.resize())
    resizeObserver.observe(containerRef.current)
    chartRef.current = chart
    return () => {
      resizeObserver.disconnect()
      chart.dispose()
      chartRef.current = null
    }
  }, [])

  useEffect(() => {
    chartRef.current?.setOption(option, { notMerge, lazyUpdate: true })
  }, [option, notMerge])

  return (
    <div
      ref={containerRef}
      className={`echart ${className}`}
      role="img"
      aria-label={ariaLabel}
      style={{ width: "100%", height: "100%", minHeight: minHeight ?? 280 }}
    />
  )
}
