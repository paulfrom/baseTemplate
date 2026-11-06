/**
 * 主题配置：设计令牌（CSS 变量在 src/styles/tokens.css）与 antd 运行时令牌的同一口径。
 * 新增主题需要同时补 tokens.css 的 `[data-theme='<id>']` 与这里的令牌表。
 */

export type PrototypeThemeId = 'light' | 'dark' | 'aurora' | 'obsidian' | 'slate'

export interface PrototypeThemeOption {
  id: PrototypeThemeId
  name: string
  description: string
  badgeColor: string
  /** 是否使用 antd 暗色算法与深色侧栏。 */
  dark: boolean
  isDefault?: boolean
}

export const PROTOTYPE_THEMES: PrototypeThemeOption[] = [
  {
    id: 'light',
    name: '建筑蓝',
    description: '经典浅色，严谨专业',
    badgeColor: '#1677ff',
    dark: false,
    isDefault: true,
  },
  {
    id: 'dark',
    name: '山野黑',
    description: '夜间模式，护眼低眩',
    badgeColor: '#177ddc',
    dark: true,
  },
  {
    id: 'aurora',
    name: '云境白',
    description: '极简顶栏，开阔视野与现代流线',
    badgeColor: '#18181b',
    dark: false,
  },
  {
    id: 'obsidian',
    name: '星穹夜',
    description: '顶栏暗黑，沉浸指挥与黑曜科技',
    badgeColor: '#6366f1',
    dark: true,
  },
  {
    id: 'slate',
    name: '玄武岩',
    description: '顶栏石灰灰阶，介于浅色与纯黑的现代中度灰',
    badgeColor: '#475569',
    dark: true,
  },
]

export type PrototypeAntdThemeTokens = {
  borderRadius: number
  colorPrimary: string
  colorBgLayout: string
  colorBgContainer: string
  colorBgElevated: string
  colorBorder: string
  colorBorderSecondary: string
  colorText: string
  colorTextSecondary: string
  colorTextTertiary: string
  colorBgSpotlight: string
  colorTextLightSolid: string
}

// Ant Design 的运行时令牌与 tokens.css 保持同一套主题口径，避免在组件树中散落主题分支。
export const PROTOTYPE_ANTD_THEME_TOKENS: Record<PrototypeThemeId, PrototypeAntdThemeTokens> = {
  light: {
    borderRadius: 6,
    colorPrimary: '#1677ff',
    colorBgLayout: '#f5f5f5',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBorder: '#d9d9d9',
    colorBorderSecondary: '#e8e8e8',
    colorText: '#000000e0',
    colorTextSecondary: '#00000073',
    colorTextTertiary: '#00000073',
    colorBgSpotlight: '#001529',
    colorTextLightSolid: '#ffffff',
  },
  dark: {
    borderRadius: 4,
    colorPrimary: '#008ee0',
    colorBgLayout: '#0f1113',
    colorBgContainer: '#141414',
    colorBgElevated: '#1f1f1f',
    colorBorder: '#434343',
    colorBorderSecondary: '#303030',
    colorText: '#f0f0f0',
    colorTextSecondary: '#c7c7c7',
    colorTextTertiary: '#8c8c8c',
    colorBgSpotlight: '#052a42',
    colorTextLightSolid: '#ffffff',
  },
  aurora: {
    borderRadius: 8,
    colorPrimary: '#18181b',
    colorBgLayout: '#f4f4f5',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBorder: '#e4e4e7',
    colorBorderSecondary: '#f4f4f5',
    colorText: '#09090b',
    colorTextSecondary: '#52525b',
    colorTextTertiary: '#71717a',
    colorBgSpotlight: '#18181b',
    colorTextLightSolid: '#ffffff',
  },
  obsidian: {
    borderRadius: 8,
    colorPrimary: '#818cf8',
    colorBgLayout: '#09090b',
    colorBgContainer: '#121215',
    colorBgElevated: '#18181b',
    colorBorder: '#27272a',
    colorBorderSecondary: '#18181b',
    colorText: '#fafafa',
    colorTextSecondary: '#d4d4d8',
    colorTextTertiary: '#a1a1aa',
    colorBgSpotlight: '#18181b',
    colorTextLightSolid: '#ffffff',
  },
  slate: {
    borderRadius: 8,
    colorPrimary: '#38bdf8',
    colorBgLayout: '#1e2430',
    colorBgContainer: '#262e3d',
    colorBgElevated: '#2d3748',
    colorBorder: '#374151',
    colorBorderSecondary: '#2b3544',
    colorText: '#f1f5f9',
    colorTextSecondary: '#cbd5e1',
    colorTextTertiary: '#94a3b8',
    colorBgSpotlight: '#1e293b',
    colorTextLightSolid: '#ffffff',
  },
}

export const THEME_BROWSER_COLORS: Record<PrototypeThemeId, string> = {
  light: '#1677ff',
  dark: '#0f1113',
  aurora: '#f4f4f5',
  obsidian: '#09090b',
  slate: '#1e2430',
}

export function isDarkTheme(themeId: PrototypeThemeId): boolean {
  return PROTOTYPE_THEMES.find((theme) => theme.id === themeId)?.dark ?? false
}

export function readThemeId(value: string | null): PrototypeThemeId | null {
  return PROTOTYPE_THEMES.some((theme) => theme.id === value) ? (value as PrototypeThemeId) : null
}
