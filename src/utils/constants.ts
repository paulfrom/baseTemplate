import enUS from '@ead/suid/es/locale/en_US'
import zhCN from '@ead/suid/es/locale/zh_CN'
import appConfig from '../../public/app.config.json'

/**
 * 全站常量。对齐公司模板 `src/utils/constants.ts`：
 * 站点 base 从 `public/app.config.json` 读取，语言包与登录状态码集中在这里。
 */

/** 站点基地址，与 public/app.config.json 的 base 保持一致。 */
export const APP_BASE = appConfig.base

/** 站点名称，用于登录页与页面标题。 */
export const APP_TITLE = 'baseTemplate · 业务原型模板'

export const IS_PRODUCTION = !import.meta.env.DEV

/**
 * SUID 语言包的类型。
 * 这里刻意不用 `import type { Locale } from '@ead/suid/es/locale'`：locale 桶文件会把
 * 组件语言包（含 Chat 等重组件依赖）带进构建图，Vite 构建会因此多出几千个模块并失败。
 */
export type Locale = typeof zhCN

/** SUID 组件语言包，ConfigProvider 直接使用。 */
export const LANG = {
  'en-US': enUS,
  'zh-CN': zhCN,
} as Record<string, Locale>

/**
 * BPM 服务基地址前缀。
 *
 * `WorkFlow` 组件会在这个前缀下拼 `sei-bpm/**` 路径；原型里由
 * `src/mocks/browser.ts` 的 MSW handler 拦截，不会真的发出去。
 */
export const BPM_BASE_URL = 'api-gateway'

/** 模拟登录的结果码，与服务层约定一致。 */
export const LOGIN_STATUS = {
  SUCCESS: 'success',
  MULTI_TENANT: 'multiTenant',
  CAPTCHA_ERROR: 'captchaError',
  FROZEN: 'frozen',
  LOCKED: 'locked',
  FAILURE: 'failure',
} as const

export type LoginStatus = (typeof LOGIN_STATUS)[keyof typeof LOGIN_STATUS]

export default {
  APP_BASE,
  APP_TITLE,
  BPM_BASE_URL,
  IS_PRODUCTION,
  LANG,
  LOGIN_STATUS,
}
