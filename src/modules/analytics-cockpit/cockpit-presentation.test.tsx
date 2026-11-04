import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { EChartsOption, LinesSeriesOption, LineSeriesOption } from "echarts"
import { describe, expect, it, vi } from "vitest"
import { AnalyticsCockpitPage } from "./AnalyticsCockpitPage"
import { createCockpitMapOptions, createCockpitTrendOption } from "./cockpit-chart-options"
import { buildDemoTrackRoutes } from "../../components/charts/trackMapDemoRoutes"

vi.mock("../../components/charts/EChart", () => ({
  MAP_MAINLAND: "china-mainland",
  MAP_SOUTH_SEA: "china-south-sea",
  mainlandGeoJson: { features: [] },
  EChart: ({ ariaLabel, option, minHeight, onClick }: { ariaLabel: string; option: EChartsOption; minHeight?: number; onClick?: (event: { componentType?: string; seriesType?: string; name?: string }) => void }) =>
    <div role="img" aria-label={ariaLabel} data-min-height={minHeight} data-map={(option as { geo?: { map?: string } }).geo?.map} data-option={JSON.stringify(option)}>
      {onClick ? <button type="button" onClick={() => onClick({ componentType: "geo", seriesType: "map", name: "江苏省" })}>下钻江苏省</button> : null}
    </div>,
}))

describe("cockpit presentation regressions", () => {
  it("keeps every demo route and the south sea inset with motion enabled and a reduced-motion alternative", () => {
    const routes = buildDemoTrackRoutes()
    const { main, inset } = createCockpitMapOptions(routes, false)
    const lines = (main.series as LinesSeriesOption[]).filter((s) => s.type === "lines")
    expect(lines.reduce((sum, s) => sum + (s.data?.length ?? 0), 0)).toBe(routes.length)
    expect(lines.some((s) => s.effect?.show === true)).toBe(true)
    const reduced = createCockpitMapOptions(routes, false, true)
    expect((reduced.main.series as LinesSeriesOption[]).filter((s) => s.type === "lines").every((s) => s.effect?.show === false)).toBe(true)
    expect(lines.find((s) => s.name === "轨迹异常")?.lineStyle?.type).toBe("dashed")
    expect(inset.series).toEqual(expect.arrayContaining([expect.objectContaining({ map: "china-south-sea" })]))
  })

  it("fits the compact trend and preserves the right-axis unit on the main trend", () => {
    const palette = { dark: false, primary: "#008ee0", warning: "#ad6800", success: "#087f2e", text: "#667085", border: "#e8e8e8" }
    const series = [{ name: "异常率(%)", color: palette.warning, data: [{ label: "8月", value: 2.8 }], yAxis: "left" as const }]
    const compact = createCockpitTrendOption(series, palette, true)
    expect(compact.legend).toMatchObject({ show: false })
    expect((compact.series as LineSeriesOption[])[0]?.lineStyle?.color).toBe("#ad6800")
    const dual = createCockpitTrendOption([...series, { ...series[0]!, name: "单吨成本(元)", yAxis: "right" }], palette)
    expect(dual.yAxis).toHaveLength(2)
    expect((dual.series as LineSeriesOption[])[1]?.yAxisIndex).toBe(1)
  })

  it("switches region metrics independently from the map and retains the region filter", async () => {
    const user = userEvent.setup()
    render(<AnalyticsCockpitPage />)
    const map = screen.getByRole("img", { name: "全国在途物流轨迹图" })
    const before = map.getAttribute("data-option")
    await user.click(screen.getByRole("radio", { name: "物流费用" }).closest("label")!)
    const east = screen.getByRole("button", { name: /华东区域/ })
    expect(east).toHaveTextContent("163.2")
    expect(map.getAttribute("data-option")).toBe(before)
    await user.click(east)
    expect(east).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("list", { name: "核心指标" })).toHaveTextContent("283")
    expect(screen.getByRole("combobox", { name: "组织范围" }).closest(".ead-select")).toHaveTextContent("华东区域")
    await user.click(screen.getByRole("radio", { name: "履约质量" }).closest("label")!)
    expect(screen.getByRole("img", { name: "履约质量趋势" })).toHaveAttribute("data-min-height", "0")
    expect(screen.getByRole("img", { name: "异常率趋势" })).toHaveAttribute("data-min-height", "0")
  })

  it("resolves canvas colors again when the actual ancestor theme changes", async () => {
    const getStyle = window.getComputedStyle.bind(window)
    const styleSpy = vi.spyOn(window, "getComputedStyle").mockImplementation((element) => {
      const style = getStyle(element)
      if (!element.classList.contains("analytics-cockpit")) return style
      return new Proxy(style, { get(target, property) {
        if (property === "getPropertyValue") return (name: string) => name === "--analytics-warning"
          ? element.closest("[data-theme]")?.getAttribute("data-theme") === "dark" ? "#ffc069" : "#ad6800"
          : target.getPropertyValue(name)
        return Reflect.get(target, property)
      } })
    })
    try {
      const { rerender } = render(<div data-theme="light"><AnalyticsCockpitPage /></div>)
      const chart = () => screen.getByRole("img", { name: "异常率趋势" })
      expect(chart()).toHaveAttribute("data-option", expect.stringContaining("#ad6800"))
      rerender(<div data-theme="dark"><AnalyticsCockpitPage /></div>)
      await waitFor(() => expect(chart()).toHaveAttribute("data-option", expect.stringContaining("#ffc069")))
      expect(chart().getAttribute("data-option")).not.toContain("var(--")
    } finally { styleSpy.mockRestore() }
  })

  it("keeps carrier details accessible after collapsing them", () => {
    render(<AnalyticsCockpitPage />)
    const summary = screen.getByText("查看承运商综合表现明细")
    fireEvent.click(summary)
    const details = summary.closest("details")!
    expect(details).toHaveAttribute("open")
    expect(within(details).getByRole("table")).toBeInTheDocument()
  })

  it("drills the demo map to a province without changing KPI filters", async () => {
    const user = userEvent.setup()
    render(<AnalyticsCockpitPage />)
    await user.click(screen.getByRole("button", { name: "下钻江苏省" }))
    const map = screen.getByRole("img", { name: "江苏省在途物流轨迹图" })
    expect(map).toHaveAttribute("data-map", "cockpit-province-江苏省")
    expect(map.getAttribute("data-option")).toContain("苏州")
    expect(screen.getByRole("list", { name: "核心指标" })).toHaveTextContent("1,286")
    await user.click(screen.getByRole("button", { name: "全国" }))
    expect(screen.getByRole("img", { name: "全国在途物流轨迹图" })).toHaveAttribute("data-map", "china-mainland")
  })

  it("switches the demo map to a region without changing KPI filters", async () => {
    const user = userEvent.setup()
    render(<AnalyticsCockpitPage />)
    await user.click(screen.getByRole("combobox", { name: "地图查看范围" }))
    const option = await screen.findByTitle("华南区域", { exact: true })
    await user.click(option)
    const map = screen.getByRole("img", { name: "华南区域在途物流轨迹图" })
    expect(map).toHaveAttribute("data-map", "cockpit-region-south")
    expect(map.getAttribute("data-option")).toContain("深圳")
    expect(screen.getByRole("list", { name: "核心指标" })).toHaveTextContent("1,286")
    expect(screen.getByRole("button", { name: /华东区域/ })).toHaveAttribute("aria-pressed", "false")
  })
})
