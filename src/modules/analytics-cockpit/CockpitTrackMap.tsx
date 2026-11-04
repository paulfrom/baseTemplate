import { Card, Select } from "@ead/suid"
import { useMemo, useState } from "react"
import { EChart, mainlandGeoJson } from "../../components/charts/EChart"
import type { EChartClickEvent } from "../../components/charts/EChart"
import { createCockpitMapOptions } from "./cockpit-chart-options"
import type { CockpitPalette } from "./cockpit-chart-options"
import {
  COCKPIT_MAP_REGION_OPTIONS,
  COCKPIT_REGION_LABELS,
  getCockpitMapSpec,
  registerCockpitDrillMaps,
  resolveProvinceClick,
  type CockpitMapRegion,
  type CockpitMapView,
} from "./cockpit-map-drill"

registerCockpitDrillMaps(mainlandGeoJson)

function nationView(): CockpitMapView {
  return { level: "nation" }
}

export function CockpitTrackMap({ palette }: { palette: CockpitPalette }) {
  const [view, setView] = useState<CockpitMapView>(nationView)
  const spec = useMemo(() => getCockpitMapSpec(view), [view])
  const mapOptions = useMemo(
    () => createCockpitMapOptions(spec.routes, palette.dark, palette.reducedMotion, {
      mapName: spec.mapName,
      areaNames: spec.areaNames,
      focus: spec.focus,
      drillable: spec.drillable,
    }),
    [spec, palette],
  )

  const handleMapClick = (event: EChartClickEvent) => {
    if (view.level === "province") return
    if (event.seriesType && event.seriesType !== "map") return
    const next = resolveProvinceClick(event.name)
    if (!next) return
    setView({ level: "province", region: next.region, province: next.name })
  }

  const regionValue = view.level === "nation" ? "all" : view.region

  return (
    <Card className="analytics-cockpit__panel analytics-cockpit__map-panel">
      <div className="analytics-cockpit__panel-head">
        <h2 className="analytics-cockpit__panel-title">{spec.title}</h2>
        <div className="analytics-cockpit__map-tools">
          <nav className="analytics-cockpit__map-nav" aria-label="地图下钻路径">
            {view.level === "nation" ? (
              <span aria-current="page">全国</span>
            ) : (
              <button type="button" onClick={() => setView(nationView())}>全国</button>
            )}
            {view.level !== "nation" && (
              <>
                <span>/</span>
                {view.level === "region" ? (
                  <span aria-current="page">{COCKPIT_REGION_LABELS[view.region]}</span>
                ) : (
                  <button type="button" onClick={() => setView({ level: "region", region: view.region })}>
                    {COCKPIT_REGION_LABELS[view.region]}
                  </button>
                )}
              </>
            )}
            {view.level === "province" && (
              <>
                <span>/</span>
                <span aria-current="page">{view.province}</span>
              </>
            )}
          </nav>
          <Select
            aria-label="地图查看范围"
            size="small"
            value={regionValue}
            onChange={(value) => {
              if (value === "all") setView(nationView())
              else setView({ level: "region", region: value as CockpitMapRegion })
            }}
            options={COCKPIT_MAP_REGION_OPTIONS}
          />
        </div>
      </div>
      <div className="analytics-cockpit__map-wrap">
        <EChart option={mapOptions.main} forceNotMerge ariaLabel={spec.ariaLabel} minHeight={0} onClick={handleMapClick} />
        {spec.showInset && (
          <div className="analytics-cockpit__south-sea">
            <EChart option={mapOptions.inset} ariaLabel="南海诸岛位置示意" minHeight={0} />
            <span>南海诸岛</span>
          </div>
        )}
      </div>
    </Card>
  )
}
