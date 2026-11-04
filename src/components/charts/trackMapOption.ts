import type { EChartsOption } from "echarts"
import { MAP_MAINLAND, MAP_SOUTH_SEA } from "./EChart"

/** 单条在途路线（已聚合 task + record 的展示字段） */
export interface TrackRoute {
  /** 运单号 */
  taskNo: string
  /** 承运商 */
  carrier?: string
  /** 司机 */
  driver?: string
  /** 起点城市名 */
  originName: string
  /** 终点城市名 */
  destName: string
  /** 起点经纬度 [lng, lat] */
  originCoord: [number, number]
  /** 终点经纬度 [lng, lat] */
  destCoord: [number, number]
  /** 运输状态文案（已发运/待发运等） */
  statusLabel: string
  /** 轨迹健康状态 */
  trackStatusLabel: string
  /** 是否异常（偏离/中断） */
  abnormal: boolean
  /** 货物摘要 */
  goodsSummary?: string
  /** 预计到达 */
  eta?: string
}

export interface TrackMapTheme {
  /** 地图省份底色 */
  areaColor: string
  /** 地图省份边框 */
  borderColor: string
  /** 正常路线颜色 */
  lineNormal: string
  /** 异常路线颜色 */
  lineAbnormal: string
  /** 起点颜色 */
  originColor: string
  /** 终点颜色 */
  destColor: string
  /** 文字颜色 */
  textColor: string
  /** tooltip 背景色 */
  tooltipBg: string
  /** tooltip 边框色 */
  tooltipBorder: string
}

/** 亮色主题（默认） */
export const trackMapThemeLight: TrackMapTheme = {
  areaColor: "#f4f7fb",
  borderColor: "#dfe6ef",
  lineNormal: "#008ee0",
  lineAbnormal: "#f5222d",
  originColor: "#00b42a",
  destColor: "#ff7d00",
  textColor: "#5a6573",
  tooltipBg: "#ffffff",
  tooltipBorder: "#e8ecf2",
}

/** 暗色主题（[data-theme='dark']） */
export const trackMapThemeDark: TrackMapTheme = {
  areaColor: "#1a2433",
  borderColor: "#2a3848",
  lineNormal: "#3aa8ff",
  lineAbnormal: "#ff7875",
  originColor: "#73d13d",
  destColor: "#ffc069",
  textColor: "#9aa6b8",
  tooltipBg: "#1f1f1f",
  tooltipBorder: "#434343",
}
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] ?? c))
}

/**
 * 构造全国物流轨迹大屏 option。
 * 三层 series：
 * 1. lines —— 所有在途路线的弧线 + 流光动效（异常路线红色）
 * 2. effectScatter —— 起讫点涟漪光点（突出运输活跃节点）
 * 3. scatter —— 起讫点静态圆点 + 城市名标签（保证可读性）
 */
export function createTrackMapOption(
  routes: TrackRoute[],
  theme: TrackMapTheme = trackMapThemeLight,
): EChartsOption {
  // 不在数据项上设置 lineStyle —— 交给各 series 统一控制宽度/透明度，
  // 否则数据级样式会覆盖 series 级分层，主线/次线/异常线全部一样粗
  const buildLineData = (list: TrackRoute[]) =>
    list.map((r) => ({
      name: r.taskNo,
      value: r.taskNo,
      coords: [r.originCoord, r.destCoord],
      // 运单信息，供 tooltip 使用
      taskInfo: r,
    }))

  // 核心枢纽（业务辐射节点）：经过枢纽的路线为主线，节点与标签更强
  const HUB_CITIES = new Set(["北京", "上海", "广州", "深圳", "成都", "武汉", "西安", "沈阳", "长沙", "南京"])
  const isMainLine = (r: TrackRoute) => HUB_CITIES.has(r.originName) || HUB_CITIES.has(r.destName)
  const normalMain = routes.filter((r) => !r.abnormal && isMainLine(r))
  const normalMinor = routes.filter((r) => !r.abnormal && !isMainLine(r))
  const abnormalLines = routes.filter((r) => r.abnormal)

  // 起讫点（去重：同城市只画一个光点，value 计数）
  const nodeMap = new Map<string, { name: string; coord: [number, number]; count: number; type: "origin" | "dest" }>()
  routes.forEach((r) => {
    const oKey = `${r.originName}`
    const o = nodeMap.get(oKey)
    if (o) o.count++
    else nodeMap.set(oKey, { name: r.originName, coord: r.originCoord, count: 1, type: "origin" })
    const dKey = `${r.destName}`
    const d = nodeMap.get(dKey)
    if (d) d.count++
    else nodeMap.set(dKey, { name: r.destName, coord: r.destCoord, count: 1, type: "dest" })
  })

  const originNodes = [...nodeMap.values()].filter((n) => n.type === "origin")
  const destNodes = [...nodeMap.values()].filter((n) => n.type === "dest")

  const lineTooltipFormatter = (params: { data?: { taskInfo?: TrackRoute } }) => {
    const t = params.data?.taskInfo
    if (!t) return ""
    const statusColor = t.abnormal ? theme.lineAbnormal : theme.lineNormal
    const badge = (c: string, txt: string) =>
      `<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${c};margin-right:6px;vertical-align:middle"></span>${txt}`
    return [
      `<div style="font-weight:600;font-size:13px;margin-bottom:6px;padding-bottom:6px;border-bottom:1px solid ${theme.tooltipBorder}">${escapeHtml(t.taskNo)}</div>`,
      `<div style="color:#555;margin-bottom:3px">${badge(statusColor, escapeHtml(t.originName) + " → " + escapeHtml(t.destName))}</div>`,
      t.carrier ? `<div style="color:#888;font-size:11px">承运商　${escapeHtml(t.carrier)}</div>` : "",
      t.goodsSummary ? `<div style="color:#888;font-size:11px">货物　　${escapeHtml(t.goodsSummary)}</div>` : "",
      t.eta ? `<div style="color:#888;font-size:11px">预计到达 ${escapeHtml(t.eta)}</div>` : "",
      `<div style="margin-top:6px;padding-top:6px;border-top:1px solid ${theme.tooltipBorder};font-size:11px;color:#666">${badge(statusColor, "运输状态 " + escapeHtml(t.statusLabel))}</div>`,
      t.trackStatusLabel !== "轨迹正常" ? `<div style="color:${theme.lineAbnormal};font-size:11px">${badge(theme.lineAbnormal, "轨迹 " + escapeHtml(t.trackStatusLabel))}</div>` : "",
    ].filter(Boolean).join("")
  }

  const nodeTooltipFormatter = (params: { data?: { name?: string; count?: number; nodeType?: string } }) => {
    const d = params.data
    if (!d) return ""
    const label = d.nodeType === "origin" ? "发货节点" : "收货节点"
    return `<div style="font-weight:600">${escapeHtml(d.name ?? "")}</div><div style="color:#666">${label} · 活跃运单 ${d.count} 笔</div>`
  }

  return {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      backgroundColor: theme.tooltipBg,
      borderColor: theme.tooltipBorder,
      borderWidth: 1,
      textStyle: { color: theme.textColor, fontSize: 12 },
      formatter: (params: unknown) => {
        const p = params as { seriesType?: string; data?: { taskInfo?: TrackRoute; name?: string; count?: number; nodeType?: string } }
        if (p.seriesType === "lines") return lineTooltipFormatter({ data: p.data })
        if (p.seriesType === "effectScatter" || p.seriesType === "scatter") return nodeTooltipFormatter({ data: p.data })
        return ""
      },
    },
    legend: {
      show: true,
      bottom: 8,
      textStyle: { color: theme.textColor, fontSize: 12 },
      itemWidth: 14,
      itemHeight: 10,
      data: [
        { name: "正常运输", icon: "roundRect", itemStyle: { color: theme.lineNormal } },
        { name: "轨迹异常", icon: "roundRect", itemStyle: { color: theme.lineAbnormal } },
      ],
    },
    geo: {
      map: MAP_MAINLAND,
      roam: false,
      silent: false,
      layoutCenter: ["50%", "49%"],
      layoutSize: "135%",
      itemStyle: {
        areaColor: theme.areaColor,
        borderColor: theme.borderColor,
        borderWidth: 0.8,
      },
      emphasis: {
        itemStyle: { areaColor: theme.areaColor, borderColor: theme.borderColor },
        label: { show: false },
      },
      // 在底图上压一层，让省份名可见但不喧宾夺主
      label: { show: false },
      regions: [],
    },
    series: [
      // 1a. 正常主线弧线（经过核心枢纽，更醒目，带流光）
      {
        name: "正常运输",
        type: "lines",
        coordinateSystem: "geo",
        zlevel: 2,
        effect: {
          show: true,
          period: 5,
          trailLength: 0.35,
          symbol: "arrow",
          symbolSize: 6,
          color: theme.lineNormal,
        },
        lineStyle: { color: theme.lineNormal, width: 1.5, opacity: 0.55, curveness: 0.2 },
        data: buildLineData(normalMain),
      },
      // 1b. 正常次线弧线（非枢纽，降透明度降噪，无流光避免过跳）
      {
        name: "正常运输",
        type: "lines",
        coordinateSystem: "geo",
        zlevel: 1,
        effect: { show: false },
        lineStyle: { color: theme.lineNormal, width: 1, opacity: 0.22, curveness: 0.2 },
        data: buildLineData(normalMinor),
      },
      // 2. 异常路线弧线（红色，置于最上层，流光更慢警示感）
      {
        name: "轨迹异常",
        type: "lines",
        coordinateSystem: "geo",
        zlevel: 3,
        effect: {
          show: true,
          period: 8,
          trailLength: 0.3,
          symbol: "arrow",
          symbolSize: 6,
          color: theme.lineAbnormal,
        },
        lineStyle: { color: theme.lineAbnormal, width: 2.6, opacity: 0.95, curveness: 0.2 },
        data: buildLineData(abnormalLines),
      },
      // 3. 起点光点（涟漪，绿色）—— 仅核心枢纽，避免全图节点过密
      {
        name: "发货节点",
        type: "effectScatter",
        coordinateSystem: "geo",
        zlevel: 4,
        rippleEffect: { brushType: "stroke", period: 4.5, scale: 2.8 },
        symbolSize: (val: number[]) => 7 + Math.min(val[2], 5),
        itemStyle: { color: theme.originColor },
        data: originNodes.filter((n) => HUB_CITIES.has(n.name)).map((n) => ({ name: n.name, value: [n.coord[0], n.coord[1], n.count], nodeType: "origin" })),
      },
      // 4. 终点光点（涟漪，橙色）—— 仅核心枢纽
      {
        name: "收货节点",
        type: "effectScatter",
        coordinateSystem: "geo",
        zlevel: 4,
        rippleEffect: { brushType: "stroke", period: 4.5, scale: 2.8 },
        symbolSize: (val: number[]) => 7 + Math.min(val[2], 5),
        itemStyle: { color: theme.destColor },
        data: destNodes.filter((n) => HUB_CITIES.has(n.name)).map((n) => ({ name: n.name, value: [n.coord[0], n.coord[1], n.count], nodeType: "dest" })),
      },
      // 5. 静态圆点（全部节点，分级：枢纽更大更实，普通节点更小更轻）
      {
        name: "节点",
        type: "scatter",
        coordinateSystem: "geo",
        zlevel: 5,
        symbolSize: (val: number[]) => {
          const node = [...originNodes, ...destNodes].find((n) => n.coord[0] === val[0] && n.coord[1] === val[1])
          return node && HUB_CITIES.has(node.name) ? 6 : 3
        },
        data: [...originNodes, ...destNodes].map((node) => {
          const isHub = HUB_CITIES.has(node.name)
          return {
            name: node.name,
            value: [node.coord[0], node.coord[1], node.count],
            nodeType: node.type,
            itemStyle: {
              color: isHub ? theme.lineNormal : theme.borderColor,
              opacity: isHub ? 1 : 0.7,
            },
          }
        }),
      },
      // 6. 城市名标签（仅核心枢纽常显，降低标签密度）
      {
        name: "节点标签",
        type: "scatter",
        coordinateSystem: "geo",
        zlevel: 6,
        symbolSize: 0,
        label: {
          show: true,
          formatter: (params: unknown) => (params as { data?: { name?: string } }).data?.name ?? "",
          position: "right",
          color: theme.textColor,
          fontSize: 12,
          fontWeight: 600,
          // 标签光晕：避免城市名被轨迹线穿过时看不清
          textBorderColor: theme.tooltipBg,
          textBorderWidth: 3,
        },
        data: [...originNodes, ...destNodes].filter((n) => HUB_CITIES.has(n.name)).map((n) => ({ name: n.name, value: [n.coord[0], n.coord[1], n.count] })),
      },
    ],
  }
}

/** 南海诸岛小图 option（作为大图右下角 inset，沿用大屏方案） */
export function createSouthSeaInsetOption(theme: TrackMapTheme = trackMapThemeLight): EChartsOption {
  return {
    backgroundColor: "transparent",
    tooltip: { show: false },
    series: [
      {
        name: "南海诸岛",
        type: "map",
        map: MAP_SOUTH_SEA,
        roam: false,
        silent: true,
        left: 5,
        right: 5,
        top: 4,
        bottom: 4,
        label: { show: false },
        itemStyle: { areaColor: theme.areaColor, borderColor: theme.borderColor, borderWidth: 1 },
        emphasis: { disabled: true },
      },
    ],
  }
}
