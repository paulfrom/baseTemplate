/**
 * 开发代理配置。
 *
 * 当前模板是纯前端原型：所有数据来自模块内 mock 与 MSW，不连接任何后端，
 * 因此这里没有可代理的地址。真实项目在此按公司模板补 `'/api-gateway': {...}` 即可，
 * vite.config.ts 会原样传给 `server.proxy`。
 */
export interface ProxyTarget {
  target: string
  changeOrigin?: boolean
  secure?: boolean
  rewrite?: (path: string) => string
}

const proxy: Record<string, ProxyTarget> = {}

export default proxy
