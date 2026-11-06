import { useEffect, useState } from 'react'
import {
  DEFAULT_PATH,
  ROUTER_CONFIG,
  findRouteConfig,
  getHighlightPath,
  type AppRouteConfig,
} from '../../config/router.config'

/**
 * hash 路由运行时，替代目标工程里 `umi` 的 `history` / `useLocation`。
 * 路由表本身在 `config/router.config.ts`，这里只负责读写地址栏。
 * `<Link>` 组件单独放在 `components/Link.tsx`，避免工具文件同时导出组件。
 */

export interface AppLocation {
  /** 规范化后的路径，如 `/sample-request/form`。 */
  pathname: string
  /** 带问号的查询串，如 `?id=1`；没有查询时为空串。 */
  search: string
  query: Record<string, string>
}

function normalizePath(rawPath: string): string {
  const trimmed = rawPath.replace(/\/+$/, '')
  if (!trimmed) return DEFAULT_PATH
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

export function buildLocation(pathname: string, search = ''): AppLocation {
  const normalizedSearch = search.replace(/^\?/, '')
  return {
    pathname: normalizePath(pathname),
    search: normalizedSearch ? `?${normalizedSearch}` : '',
    query: Object.fromEntries(new URLSearchParams(normalizedSearch)),
  }
}

function parseHash(): AppLocation {
  const raw = window.location.hash.replace(/^#/, '')
  const [rawPath, ...rest] = raw.split('?')
  return buildLocation(rawPath ?? '', rest.join('?'))
}

/** 当前地址对应的路由配置；未登记路径回落到默认路径的配置。 */
export function resolveRoute(pathname: string): AppRouteConfig {
  return (
    findRouteConfig(pathname) ??
    findRouteConfig(getHighlightPath(pathname)) ??
    (findRouteConfig(DEFAULT_PATH) as AppRouteConfig)
  )
}

export function navigate(to: string, options: { replace?: boolean } = {}) {
  const target = to.startsWith('/') ? to : `/${to}`
  const nextHash = `#${target}`
  if (window.location.hash === nextHash) return
  if (options.replace) {
    window.location.replace(`${window.location.pathname}${window.location.search}${nextHash}`)
    return
  }
  window.location.hash = nextHash
}

export const history = {
  push: (to: string) => navigate(to),
  replace: (to: string) => navigate(to, { replace: true }),
}

/** 订阅 hashchange，返回当前路径、查询串与解析后的 query。 */
export function useLocation(): AppLocation {
  const [location, setLocation] = useState(parseHash)

  useEffect(() => {
    const onChange = () => setLocation(parseHash())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return location
}

/** 当前高亮的路径（子页面归到父路径），用于菜单选中与面包屑。 */
export function useHighlightPath(): string {
  const { pathname } = useLocation()
  return getHighlightPath(pathname)
}

export { ROUTER_CONFIG }
export type { AppRouteConfig }
