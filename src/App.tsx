import {ConfigProvider, theme} from "antd"
import zhCN from "antd/locale/zh_CN"
import {Suspense, useEffect, useState} from "react"
import "./App.css"
import {AppShell, type PrototypeThemeId} from "./app/AppShell"
import {useHashNavigation} from "./app/hash-navigation"
import {renderMainRoute} from "./app/route-registry"
import {PortalPage} from "./modules/portal"

const { darkAlgorithm, defaultAlgorithm } = theme

type PrototypeAntdThemeTokens = {
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
const PROTOTYPE_ANTD_THEME_TOKENS: Record<PrototypeThemeId, PrototypeAntdThemeTokens> = {
  light: {
    borderRadius: 4,
    colorPrimary: "#008ee0",
    colorBgLayout: "#f5f5f5",
    colorBgContainer: "#ffffff",
    colorBgElevated: "#ffffff",
    colorBorder: "#d9d9d9",
    colorBorderSecondary: "#e8e8e8",
    colorText: "#333333",
    colorTextSecondary: "#666666",
    colorTextTertiary: "#667085",
    colorBgSpotlight: "#0070c0",
    colorTextLightSolid: "#ffffff",
  },
  dark: {
    borderRadius: 4,
    colorPrimary: "#008ee0",
    colorBgLayout: "#0f1113",
    colorBgContainer: "#141414",
    colorBgElevated: "#1f1f1f",
    colorBorder: "#434343",
    colorBorderSecondary: "#303030",
    colorText: "#f0f0f0",
    colorTextSecondary: "#c7c7c7",
    colorTextTertiary: "#8c8c8c",
    colorBgSpotlight: "#052a42",
    colorTextLightSolid: "#ffffff",
  },
  aurora: {
    borderRadius: 8,
    colorPrimary: "#18181b",
    colorBgLayout: "#f4f4f5",
    colorBgContainer: "#ffffff",
    colorBgElevated: "#ffffff",
    colorBorder: "#e4e4e7",
    colorBorderSecondary: "#f4f4f5",
    colorText: "#09090b",
    colorTextSecondary: "#52525b",
    colorTextTertiary: "#71717a",
    colorBgSpotlight: "#18181b",
    colorTextLightSolid: "#ffffff",
  },
  obsidian: {
    borderRadius: 8,
    colorPrimary: "#818cf8",
    colorBgLayout: "#09090b",
    colorBgContainer: "#121215",
    colorBgElevated: "#18181b",
    colorBorder: "#27272a",
    colorBorderSecondary: "#18181b",
    colorText: "#fafafa",
    colorTextSecondary: "#d4d4d8",
    colorTextTertiary: "#a1a1aa",
    colorBgSpotlight: "#18181b",
    colorTextLightSolid: "#ffffff",
  },
  slate: {
    borderRadius: 8,
    colorPrimary: "#38bdf8",
    colorBgLayout: "#1e2430",
    colorBgContainer: "#262e3d",
    colorBgElevated: "#2d3748",
    colorBorder: "#374151",
    colorBorderSecondary: "#2b3544",
    colorText: "#f1f5f9",
    colorTextSecondary: "#cbd5e1",
    colorTextTertiary: "#94a3b8",
    colorBgSpotlight: "#1e293b",
    colorTextLightSolid: "#ffffff",
  },
}

const THEME_BROWSER_COLORS: Record<PrototypeThemeId, string> = {
  light: "#008ee0",
  dark: "#0f1113",
  aurora: "#f4f4f5",
  obsidian: "#09090b",
  slate: "#1e2430",
}

function App() {
  const { navigate, route } = useHashNavigation()
  const [themeId, setThemeId] = useState<PrototypeThemeId>(() => {
    const saved = localStorage.getItem("prototype_theme_id")
    return saved === "dark" || saved === "aurora" || saved === "obsidian" || saved === "slate" ? saved : "light"
  })
  const darkMode = themeId === "dark" || themeId === "obsidian" || themeId === "slate"

  // Keep the theme on the document root so Ant Design portal components
  // (Modal, Drawer, Select dropdowns, etc.) receive the same CSS variables.
  useEffect(() => {
    document.documentElement.dataset.theme = themeId
    localStorage.setItem("prototype_theme_id", themeId)
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_BROWSER_COLORS[themeId])
  }, [themeId])

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: darkMode ? darkAlgorithm : defaultAlgorithm,
        token: {
          ...PROTOTYPE_ANTD_THEME_TOKENS[themeId],
          controlHeight: 32,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif",
          fontSize: 14,
        },
        components: {
          Tooltip: {
            colorBgSpotlight: PROTOTYPE_ANTD_THEME_TOKENS[themeId].colorBgSpotlight,
            colorTextLightSolid: PROTOTYPE_ANTD_THEME_TOKENS[themeId].colorTextLightSolid,
          },
        },
      }}
    >
      {route === "portal" ? (
        <PortalPage
          dataTheme={darkMode ? "dark" : "light"}
          onThemeChange={(isDark) => {
            // 门户只提供明暗开关，但不能把已选的命名主题静默降级成普通主题。
            if (isDark) setThemeId(themeId === "aurora" ? "obsidian" : themeId === "slate" ? "obsidian" : themeId === "light" ? "dark" : themeId)
            else setThemeId(themeId === "obsidian" || themeId === "slate" ? "aurora" : themeId === "dark" ? "light" : themeId)
          }}
        />
      ) : (
        <AppShell
          currentRoute={route}
          currentTheme={themeId}
          onSelectTheme={setThemeId}
          darkMode={darkMode}
          onNavigate={navigate}
        >
          <Suspense fallback={null}>{renderMainRoute(route, { navigate, currentTheme: themeId, onSelectTheme: setThemeId })}</Suspense>
        </AppShell>
      )}
    </ConfigProvider>
  )
}

export default App
