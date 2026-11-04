import { registerMap } from "echarts/core"
import { buildDemoTrackRoutes } from "../../components/charts/trackMapDemoRoutes"
import type { TrackRoute } from "../../components/charts/trackMapOption"
import type { AnalyticsScope } from "./types"

export type CockpitMapRegion = Exclude<AnalyticsScope, "all">
export type CockpitMapView =
  | { level: "nation" }
  | { level: "region"; region: CockpitMapRegion }
  | { level: "province"; region: CockpitMapRegion; province: string }

export interface CockpitMapSpec {
  mapName: string
  routes: TrackRoute[]
  areaNames: string[]
  title: string
  ariaLabel: string
  showInset: boolean
  focus: boolean
  drillable: boolean
}

/** 与字典/区域表现一致的八大区域，不含港澳台。 */
export const COCKPIT_REGION_PROVINCES: Record<CockpitMapRegion, string[]> = {
  east: ["上海市", "江苏省", "浙江省", "安徽省", "江西省"],
  shandong: ["山东省"],
  south: ["广东省", "广西壮族自治区", "海南省", "福建省"],
  north: ["北京市", "天津市", "河北省", "山西省", "内蒙古自治区"],
  central: ["河南省", "湖北省", "湖南省"],
  southwest: ["重庆市", "四川省", "贵州省", "云南省", "西藏自治区"],
  northwest: ["陕西省", "甘肃省", "青海省", "宁夏回族自治区", "新疆维吾尔自治区"],
  northeast: ["辽宁省", "吉林省", "黑龙江省"],
}

export const COCKPIT_REGION_LABELS: Record<CockpitMapRegion, string> = {
  east: "华东区域",
  shandong: "山东区域",
  south: "华南区域",
  north: "华北区域",
  central: "华中区域",
  southwest: "西南区域",
  northwest: "西北区域",
  northeast: "东北区域",
}

export const COCKPIT_MAP_REGION_OPTIONS = [
  { value: "all", label: "全国" },
  ...Object.entries(COCKPIT_REGION_LABELS).map(([value, label]) => ({ value, label })),
]

export const PROVINCE_TO_REGION = Object.fromEntries(
  Object.entries(COCKPIT_REGION_PROVINCES).flatMap(([region, provinces]) =>
    provinces.map((province) => [province, region as CockpitMapRegion]),
  ),
) as Record<string, CockpitMapRegion>

const CARRIERS = ["中铁快运", "顺丰冷运", "京东物流", "安能物流", "跨越速运", "德邦快递", "中通快运"] as const
const GOODS = [
  "水泥 32t",
  "钢筋 45t",
  "装配式构件 28t",
  "商品混凝土 38t",
  "钢结构 52t",
  "机电管线 18t",
  "装饰材料 22t",
  "保温板 16t",
] as const

interface DemoCity {
  name: string
  coord: [number, number]
  province: string
  region: CockpitMapRegion
}

const DEMO_CITIES: DemoCity[] = [
  { name: "北京", coord: [116.41, 39.9], province: "北京市", region: "north" },
  { name: "通州", coord: [116.66, 39.91], province: "北京市", region: "north" },
  { name: "大兴", coord: [116.34, 39.73], province: "北京市", region: "north" },
  { name: "天津", coord: [117.2, 39.12], province: "天津市", region: "north" },
  { name: "滨海", coord: [117.7, 39.0], province: "天津市", region: "north" },
  { name: "石家庄", coord: [114.51, 38.04], province: "河北省", region: "north" },
  { name: "唐山", coord: [118.18, 39.63], province: "河北省", region: "north" },
  { name: "保定", coord: [115.46, 38.87], province: "河北省", region: "north" },
  { name: "太原", coord: [112.55, 37.87], province: "山西省", region: "north" },
  { name: "大同", coord: [113.3, 40.08], province: "山西省", region: "north" },
  { name: "呼和浩特", coord: [111.75, 40.84], province: "内蒙古自治区", region: "north" },
  { name: "包头", coord: [109.84, 40.66], province: "内蒙古自治区", region: "north" },
  { name: "沈阳", coord: [123.43, 41.8], province: "辽宁省", region: "northeast" },
  { name: "大连", coord: [121.61, 38.91], province: "辽宁省", region: "northeast" },
  { name: "鞍山", coord: [122.99, 41.11], province: "辽宁省", region: "northeast" },
  { name: "长春", coord: [125.32, 43.82], province: "吉林省", region: "northeast" },
  { name: "吉林", coord: [126.55, 43.84], province: "吉林省", region: "northeast" },
  { name: "哈尔滨", coord: [126.64, 45.75], province: "黑龙江省", region: "northeast" },
  { name: "大庆", coord: [125.1, 46.59], province: "黑龙江省", region: "northeast" },
  { name: "上海", coord: [121.47, 31.23], province: "上海市", region: "east" },
  { name: "嘉定", coord: [121.27, 31.38], province: "上海市", region: "east" },
  { name: "南京", coord: [118.79, 32.04], province: "江苏省", region: "east" },
  { name: "苏州", coord: [120.62, 31.32], province: "江苏省", region: "east" },
  { name: "徐州", coord: [117.18, 34.26], province: "江苏省", region: "east" },
  { name: "无锡", coord: [120.31, 31.49], province: "江苏省", region: "east" },
  { name: "杭州", coord: [120.16, 30.27], province: "浙江省", region: "east" },
  { name: "宁波", coord: [121.54, 29.87], province: "浙江省", region: "east" },
  { name: "温州", coord: [120.7, 28.0], province: "浙江省", region: "east" },
  { name: "合肥", coord: [117.27, 31.86], province: "安徽省", region: "east" },
  { name: "芜湖", coord: [118.38, 31.33], province: "安徽省", region: "east" },
  { name: "南昌", coord: [115.86, 28.68], province: "江西省", region: "east" },
  { name: "赣州", coord: [114.93, 25.83], province: "江西省", region: "east" },
  { name: "济南", coord: [117.0, 36.65], province: "山东省", region: "shandong" },
  { name: "青岛", coord: [120.38, 36.07], province: "山东省", region: "shandong" },
  { name: "烟台", coord: [121.39, 37.54], province: "山东省", region: "shandong" },
  { name: "临沂", coord: [118.33, 35.1], province: "山东省", region: "shandong" },
  { name: "潍坊", coord: [119.16, 36.71], province: "山东省", region: "shandong" },
  { name: "广州", coord: [113.27, 23.13], province: "广东省", region: "south" },
  { name: "深圳", coord: [114.06, 22.55], province: "广东省", region: "south" },
  { name: "佛山", coord: [113.12, 23.02], province: "广东省", region: "south" },
  { name: "东莞", coord: [113.75, 23.05], province: "广东省", region: "south" },
  { name: "湛江", coord: [110.36, 21.27], province: "广东省", region: "south" },
  { name: "南宁", coord: [108.37, 22.82], province: "广西壮族自治区", region: "south" },
  { name: "柳州", coord: [109.41, 24.31], province: "广西壮族自治区", region: "south" },
  { name: "桂林", coord: [110.29, 25.27], province: "广西壮族自治区", region: "south" },
  { name: "海口", coord: [110.2, 20.04], province: "海南省", region: "south" },
  { name: "三亚", coord: [109.51, 18.25], province: "海南省", region: "south" },
  { name: "福州", coord: [119.3, 26.08], province: "福建省", region: "south" },
  { name: "厦门", coord: [118.09, 24.48], province: "福建省", region: "south" },
  { name: "泉州", coord: [118.68, 24.87], province: "福建省", region: "south" },
  { name: "郑州", coord: [113.62, 34.75], province: "河南省", region: "central" },
  { name: "洛阳", coord: [112.45, 34.62], province: "河南省", region: "central" },
  { name: "南阳", coord: [112.54, 32.99], province: "河南省", region: "central" },
  { name: "武汉", coord: [114.31, 30.59], province: "湖北省", region: "central" },
  { name: "宜昌", coord: [111.29, 30.69], province: "湖北省", region: "central" },
  { name: "襄阳", coord: [112.12, 32.01], province: "湖北省", region: "central" },
  { name: "长沙", coord: [112.94, 28.23], province: "湖南省", region: "central" },
  { name: "岳阳", coord: [113.13, 29.36], province: "湖南省", region: "central" },
  { name: "衡阳", coord: [112.61, 26.89], province: "湖南省", region: "central" },
  { name: "成都", coord: [104.07, 30.57], province: "四川省", region: "southwest" },
  { name: "绵阳", coord: [104.68, 31.47], province: "四川省", region: "southwest" },
  { name: "宜宾", coord: [104.64, 28.75], province: "四川省", region: "southwest" },
  { name: "重庆", coord: [106.55, 29.56], province: "重庆市", region: "southwest" },
  { name: "万州", coord: [108.41, 30.81], province: "重庆市", region: "southwest" },
  { name: "贵阳", coord: [106.63, 26.65], province: "贵州省", region: "southwest" },
  { name: "遵义", coord: [106.93, 27.73], province: "贵州省", region: "southwest" },
  { name: "昆明", coord: [102.83, 24.88], province: "云南省", region: "southwest" },
  { name: "大理", coord: [100.23, 25.59], province: "云南省", region: "southwest" },
  { name: "拉萨", coord: [91.11, 29.97], province: "西藏自治区", region: "southwest" },
  { name: "日喀则", coord: [88.88, 29.27], province: "西藏自治区", region: "southwest" },
  { name: "西安", coord: [108.95, 34.27], province: "陕西省", region: "northwest" },
  { name: "宝鸡", coord: [107.24, 34.36], province: "陕西省", region: "northwest" },
  { name: "榆林", coord: [109.73, 38.29], province: "陕西省", region: "northwest" },
  { name: "兰州", coord: [103.83, 36.06], province: "甘肃省", region: "northwest" },
  { name: "酒泉", coord: [98.49, 39.73], province: "甘肃省", region: "northwest" },
  { name: "西宁", coord: [101.78, 36.62], province: "青海省", region: "northwest" },
  { name: "格尔木", coord: [94.9, 36.41], province: "青海省", region: "northwest" },
  { name: "银川", coord: [106.23, 38.49], province: "宁夏回族自治区", region: "northwest" },
  { name: "中卫", coord: [105.19, 37.51], province: "宁夏回族自治区", region: "northwest" },
  { name: "乌鲁木齐", coord: [87.62, 43.83], province: "新疆维吾尔自治区", region: "northwest" },
  { name: "哈密", coord: [93.51, 42.83], province: "新疆维吾尔自治区", region: "northwest" },
  { name: "喀什", coord: [75.99, 39.47], province: "新疆维吾尔自治区", region: "northwest" },
]

const CITY_BY_NAME = Object.fromEntries(DEMO_CITIES.map((city) => [city.name, city])) as Record<string, DemoCity>
type FlowDef = [origin: string, dest: string, abnormal?: boolean]

const REGION_FLOWS: Record<CockpitMapRegion, FlowDef[]> = {
  east: [
    ["上海", "南京"], ["南京", "杭州"], ["杭州", "合肥"], ["上海", "苏州"],
    ["南京", "徐州"], ["杭州", "宁波"], ["合肥", "南昌"], ["苏州", "无锡"], ["合肥", "芜湖", true],
  ],
  shandong: [
    ["济南", "青岛"], ["青岛", "烟台"], ["济南", "临沂"], ["青岛", "潍坊"], ["烟台", "临沂", true],
  ],
  south: [
    ["广州", "深圳"], ["广州", "南宁"], ["深圳", "厦门"], ["福州", "厦门"],
    ["南宁", "柳州"], ["海口", "三亚"], ["广州", "湛江"], ["福州", "泉州"], ["南宁", "桂林", true],
  ],
  north: [
    ["北京", "天津"], ["北京", "石家庄"], ["天津", "唐山"], ["太原", "大同"],
    ["呼和浩特", "包头"], ["北京", "保定"], ["石家庄", "太原"], ["天津", "滨海", true],
  ],
  central: [
    ["武汉", "郑州"], ["武汉", "长沙"], ["郑州", "洛阳"], ["武汉", "宜昌"],
    ["长沙", "岳阳"], ["郑州", "南阳"], ["武汉", "襄阳"], ["长沙", "衡阳", true],
  ],
  southwest: [
    ["成都", "重庆"], ["成都", "昆明"], ["重庆", "贵阳"], ["成都", "绵阳"],
    ["昆明", "大理"], ["贵阳", "遵义"], ["重庆", "万州"], ["拉萨", "日喀则"], ["成都", "宜宾", true],
  ],
  northwest: [
    ["西安", "兰州"], ["兰州", "西宁"], ["西安", "银川"], ["乌鲁木齐", "哈密"],
    ["西安", "宝鸡"], ["兰州", "酒泉"], ["西宁", "格尔木"], ["乌鲁木齐", "喀什", true],
  ],
  northeast: [
    ["沈阳", "长春"], ["长春", "哈尔滨"], ["沈阳", "大连"], ["哈尔滨", "大庆"],
    ["沈阳", "鞍山"], ["长春", "吉林"], ["大连", "鞍山", true],
  ],
}

function pick<T>(arr: readonly T[], index: number): T {
  return arr[index % arr.length]!
}

function provinceFlowDefs(province: string): FlowDef[] {
  const cities = DEMO_CITIES.filter((city) => city.province === province)
  if (cities.length < 2) return []
  const hub = cities[0]!
  const defs: FlowDef[] = cities.slice(1).map((city) => [hub.name, city.name])
  if (cities.length >= 3) defs.push([cities[1]!.name, cities[2]!.name, true])
  return defs
}

function toRoutes(defs: FlowDef[], prefix: string): TrackRoute[] {
  const seen = new Set<string>()
  return defs.flatMap((def, index) => {
    const [originName, destName, abnormal] = def
    const key = `${originName}>${destName}`
    if (seen.has(key)) return []
    seen.add(key)
    const origin = CITY_BY_NAME[originName]
    const dest = CITY_BY_NAME[destName]
    if (!origin || !dest) return []
    return [{
      taskNo: `WL-${prefix}-${String(index + 1).padStart(3, "0")}`,
      carrier: pick(CARRIERS, index),
      originName,
      destName,
      originCoord: origin.coord,
      destCoord: dest.coord,
      statusLabel: "运输中",
      trackStatusLabel: abnormal ? "轨迹偏离" : "轨迹正常",
      abnormal: Boolean(abnormal),
      goodsSummary: pick(GOODS, index),
      eta: `今日 ${18 + (index % 5)}:${["00", "15", "30", "45"][index % 4]}`,
    }]
  })
}

function regionRoutes(region: CockpitMapRegion): TrackRoute[] {
  const defs = [...REGION_FLOWS[region]]
  for (const province of COCKPIT_REGION_PROVINCES[region]) {
    const first = provinceFlowDefs(province)[0]
    if (first) defs.push(first)
  }
  return toRoutes(defs, `R-${region.toUpperCase()}`)
}

export function resolveProvinceClick(name?: string) {
  if (!name) return undefined
  const region = PROVINCE_TO_REGION[name]
  if (!region) return undefined
  return { name, region }
}

export function getCockpitMapSpec(view: CockpitMapView): CockpitMapSpec {
  if (view.level === "province") {
    return {
      mapName: `cockpit-province-${view.province}`,
      routes: toRoutes(provinceFlowDefs(view.province), "P"),
      areaNames: [view.province],
      title: `${view.province}在途态势`,
      ariaLabel: `${view.province}在途物流轨迹图`,
      showInset: false,
      focus: true,
      drillable: false,
    }
  }
  if (view.level === "region") {
    const label = COCKPIT_REGION_LABELS[view.region]
    return {
      mapName: `cockpit-region-${view.region}`,
      routes: regionRoutes(view.region),
      areaNames: COCKPIT_REGION_PROVINCES[view.region],
      title: `${label}在途态势`,
      ariaLabel: `${label}在途物流轨迹图`,
      showInset: false,
      focus: true,
      drillable: true,
    }
  }
  return {
    mapName: "china-mainland",
    routes: buildDemoTrackRoutes(),
    areaNames: Object.keys(PROVINCE_TO_REGION),
    title: "全国在途态势",
    ariaLabel: "全国在途物流轨迹图",
    showInset: true,
    focus: false,
    drillable: true,
  }
}

let registered = false

export function registerCockpitDrillMaps(geoJson?: { features?: Array<{ properties?: { name?: string } }> }) {
  if (registered || !geoJson?.features?.length) return
  const features = geoJson.features
  for (const [region, names] of Object.entries(COCKPIT_REGION_PROVINCES)) {
    const subset = features.filter((feature) => names.includes(String(feature.properties?.name)))
    if (!subset.length) continue
    registerMap(`cockpit-region-${region}`, { type: "FeatureCollection", features: subset } as Parameters<typeof registerMap>[1])
  }
  for (const province of Object.keys(PROVINCE_TO_REGION)) {
    const subset = features.filter((feature) => feature.properties?.name === province)
    if (!subset.length) continue
    registerMap(`cockpit-province-${province}`, { type: "FeatureCollection", features: subset } as Parameters<typeof registerMap>[1])
  }
  registered = true
}
