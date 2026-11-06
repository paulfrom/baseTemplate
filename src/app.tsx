import { App as SuidApp, ConfigProvider, theme } from '@ead/suid'
import { Suspense, useEffect, useState } from 'react'
import { DEFAULT_PATH, getPathByRoute } from '../config/router.config'
import {
  PROTOTYPE_ANTD_THEME_TOKENS,
  THEME_BROWSER_COLORS,
  isDarkTheme,
  readThemeId,
  type PrototypeThemeId,
} from '../config/theme.config'
import PageErrorBoundary from './components/PageErrorBoundary'
import { AuthLayout } from './layouts/AuthLayout'
import { BlankLayout } from './layouts/BlankLayout'
import { LoginLayout } from './layouts/LoginLayout'
import Loading from './loading'
import { useGlobalModel } from './models/global'
import { getPortalSettings, updatePortalUser } from './models/portal-settings'
import { LANG } from './utils/constants'
import { navigate, resolveRoute, useLocation } from './utils/navigation'

const { darkAlgorithm, defaultAlgorithm } = theme

/**
 * 应用根容器，对应公司模板 `src/app.tsx` 的 `rootContainer`：
 * ConfigProvider 提供主题与国际化，App 提供 message / notification / modal 上下文。
 * 渲染哪个页面、套哪个布局，全部由 `config/router.config.ts` 的路由表决定。
 */
export function App() {
  const location = useLocation()
  const { locale } = useGlobalModel()
  const routeConfig = resolveRoute(location.pathname)

  const [themeId, setThemeId] = useState<PrototypeThemeId>(() => {
    const saved = readThemeId(localStorage.getItem('prototype_theme_id'))
    const preferred = readThemeId(getPortalSettings().user.defaultTheme)
    return saved ?? preferred ?? 'light'
  })
  const darkMode = isDarkTheme(themeId)

  const handleThemeSelect = (nextTheme: PrototypeThemeId) => {
    setThemeId(nextTheme)
    updatePortalUser({ defaultTheme: nextTheme })
  }

  // 主题挂在 document 根节点上，Modal / Drawer / Select 等 portal 组件才能拿到同一套变量。
  useEffect(() => {
    document.documentElement.dataset.theme = themeId
    localStorage.setItem('prototype_theme_id', themeId)
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', THEME_BROWSER_COLORS[themeId])
  }, [themeId])

  const Page = routeConfig.component
  const pageNode =
    routeConfig.route === 'portal' ? (
      <Page
        dataTheme={darkMode ? 'dark' : 'light'}
        onThemeChange={(isDark: boolean) => {
          // 门户只提供明暗开关，但不能把已选的命名主题静默降级成普通主题。
          if (isDark) {
            handleThemeSelect(
              themeId === 'aurora' || themeId === 'slate'
                ? 'obsidian'
                : themeId === 'light'
                  ? 'dark'
                  : themeId,
            )
            return
          }
          handleThemeSelect(
            themeId === 'obsidian' || themeId === 'slate'
              ? 'aurora'
              : themeId === 'dark'
                ? 'light'
                : themeId,
          )
        }}
      />
    ) : (
      <Page />
    )

  const layoutNode =
    routeConfig.layout === 'auth' ? (
      <AuthLayout
        currentPath={location.pathname}
        currentTheme={themeId}
        onSelectTheme={handleThemeSelect}
        darkMode={darkMode}
        onNavigate={(route) => navigate(getPathByRoute(route) ?? DEFAULT_PATH)}
      >
        {pageNode}
      </AuthLayout>
    ) : routeConfig.layout === 'login' ? (
      <LoginLayout>{pageNode}</LoginLayout>
    ) : (
      <BlankLayout>{pageNode}</BlankLayout>
    )

  return (
    <ConfigProvider
      locale={LANG[locale]}
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
      <SuidApp>
        <PageErrorBoundary>
          <Suspense fallback={<Loading />}>{layoutNode}</Suspense>
        </PageErrorBoundary>
      </SuidApp>
    </ConfigProvider>
  )
}

export default App
