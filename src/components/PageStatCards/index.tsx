import type { CSSProperties, ReactNode } from "react"
import "./page-stat-cards.css"

export type PageStatStatus = "default" | "primary" | "warning" | "success" | "error" | "purple"

export interface PageStatItem {
  key: string
  title: string
  value: number | string
  unit?: string
  subText?: ReactNode
  status?: PageStatStatus
  icon?: ReactNode
  tooltip?: string
  clickable?: boolean
}

export interface PageStatCardsProps {
  items: PageStatItem[]
  activeKey?: string
  onCardClick?: (key: string) => void
  columns?: 3 | 4 | 5 | 6
  className?: string
  style?: CSSProperties
}

export function PageStatCards({
  items,
  activeKey,
  onCardClick,
  columns,
  className = "",
  style,
}: PageStatCardsProps) {
  const effectiveColumns = columns ?? (items.length === 6 ? 6 : items.length === 5 ? 5 : items.length === 3 ? 3 : 4)
  const colClass = effectiveColumns === 3
    ? "page-stat-cards--cols-3"
    : effectiveColumns === 5
      ? "page-stat-cards--cols-5"
      : effectiveColumns === 6
        ? "page-stat-cards--cols-6"
        : ""

  return (
    <div className={`page-stat-cards ${colClass} ${className}`.trim()} style={style}>
      {items.map((item) => {
        const isClickable = item.clickable !== false && Boolean(onCardClick)
        const isActive = activeKey !== undefined && activeKey === item.key
        const statusClass = `page-stat-card--${item.status || "default"}`
        return (
          <div
            key={item.key}
            className={`page-stat-card ${statusClass} ${isClickable ? "page-stat-card--clickable" : ""} ${isActive ? "page-stat-card--active" : ""}`.trim()}
            onClick={() => {
              if (isClickable && onCardClick) onCardClick(item.key)
            }}
            role={isClickable ? "button" : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onKeyDown={(event) => {
              if (isClickable && onCardClick && (event.key === "Enter" || event.key === " ")) {
                event.preventDefault()
                onCardClick(item.key)
              }
            }}
          >
            {item.icon && <div className="page-stat-card__icon-wrap">{item.icon}</div>}
            <div className="page-stat-card__content">
              <div className="page-stat-card__header">
                <span className="page-stat-card__title">{item.title}</span>
              </div>
              <div className="page-stat-card__body">
                <div>
                  <span className="page-stat-card__value">{item.value}</span>
                  {item.unit && <span className="page-stat-card__unit">{item.unit}</span>}
                </div>
                {item.subText && (
                  <div className="page-stat-card__footer" title={item.tooltip}>
                    <span className="page-stat-card__dot" aria-hidden="true">·</span>
                    {item.subText}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
