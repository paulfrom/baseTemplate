import enUS from '../locales/en-US'
import zhCN from '../locales/zh-CN'
import { getGlobalState, type LocaleId } from '../models/global'

/**
 * 文案格式化，替代公司模板里 `umi` 的 `getIntl()`。
 * 语言随全局模型切换；词条按 id 合并，缺失时回退中文再回退 defaultMessage。
 */

type Messages = Record<string, string>

const MESSAGES: Record<LocaleId, Messages> = {
  'zh-CN': zhCN,
  'en-US': enUS,
}

export interface FormatMessageOptions {
  id: string
  defaultMessage?: string
}

export type MessageValues = Record<string, string | number>

export function formatMessage({ id, defaultMessage }: FormatMessageOptions, values?: MessageValues): string {
  const locale = getGlobalState().locale
  const template = MESSAGES[locale]?.[id] ?? MESSAGES['zh-CN'][id] ?? defaultMessage ?? id
  if (!values) return template
  return template.replace(/\{(\w+)\}/g, (matched, key: string) =>
    key in values ? String(values[key]) : matched,
  )
}

/** 与 umi 同名的返回结构，页面可以继续 `const { formatMessage: t } = getIntl()`。 */
export function getIntl() {
  return { formatMessage }
}
