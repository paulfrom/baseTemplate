import type { EChartsOption } from "echarts"

export interface TrendSeries {
  /** 系列名称（图例 + tooltip） */
  name: string
  /** 数据点，value 为数值，label 为 X 轴类目 */
  data: { label: string; value: number }[]
  /** 线色 */
  color: string
  /** 归属 Y 轴：left（主轴）或 right（副轴） */
  yAxis: "left" | "right"
  /** 是否虚线（副指标常用） */
  dashed?: boolean
}

export interface TrendChartTheme {
  /** 坐标轴/文字色 */
  textColor: string
  /** 网格线色 */
  splitLineColor: string
}

export const trendThemeLight: TrendChartTheme = {
  textColor: "#8a94a6",
  splitLineColor: "#eef1f6",
}

export const trendThemeDark: TrendChartTheme = {
  textColor: "#6b7686",
  splitLineColor: "#262d3a",
}

/**
 * 构造双 Y 轴折线趋势图 option。
 * 关键点：每个系列使用真实坐标轴刻度，避免旧 SVG 方案"各自归一化后画在同一画布"
 * 造成的视觉斜率不可比较问题。主轴/副轴明确分离，单位不同的指标各归其轴。
 */
export function createTrendOption(series: TrendSeries[], theme: TrendChartTheme = trendThemeLight): EChartsOption {
  const isDark = theme === trendThemeDark
  const labels = series[0]?.data.map((d) => d.label) ?? []
  const hasRight = series.some((s) => s.yAxis === "right")
  return {
    backgroundColor: "transparent",
    grid: { left: 44, right: hasRight ? 48 : 20, top: 28, bottom: 28, containLabel: false },
    tooltip: {
      trigger: "axis",
      backgroundColor: isDark ? "#1f1f1f" : "#ffffff",
      borderColor: theme.splitLineColor,
      textStyle: { color: isDark ? "#e0e6ed" : "#333" },
    },
    legend: {
      show: true,
      top: 0,
      itemWidth: 14,
      itemHeight: 8,
      textStyle: { color: theme.textColor, fontSize: 11 },
      data: series.map((s) => s.name),
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: labels,
      axisLine: { lineStyle: { color: theme.splitLineColor } },
      axisLabel: { color: theme.textColor, fontSize: 11 },
      axisTick: { show: false },
    },
    yAxis: [
      {
        type: "value",
        scale: true,
        splitLine: { lineStyle: { color: theme.splitLineColor } },
        axisLabel: { color: theme.textColor, fontSize: 11 },
      },
      ...(hasRight
        ? [{
            type: "value" as const,
            scale: true,
            splitLine: { show: false },
            axisLabel: { color: theme.textColor, fontSize: 11 },
          }]
        : []),
    ],
    series: series.map((s) => ({
      name: s.name,
      type: "line" as const,
      yAxisIndex: s.yAxis === "right" ? 1 : 0,
      data: s.data.map((d) => d.value),
      smooth: true,
      symbol: "circle",
      symbolSize: 5,
      showSymbol: false,
      lineStyle: { color: s.color, width: 2, type: s.dashed ? ("dashed" as const) : ("solid" as const) },
      itemStyle: { color: s.color },
      emphasis: { focus: "series" },
    })),
  }
}
