import {AppstoreOutlined, ArrowRightOutlined, DownOutlined, HomeOutlined, MenuOutlined, MoonOutlined, QuestionCircleOutlined, SettingOutlined, SunOutlined, UserOutlined} from '@ant-design/icons'
import {Avatar, Button, Dropdown, Switch, message} from 'antd'
import {useEffect, useMemo, useState} from 'react'
import {usePortalSettings, type PortalApplication} from '../../app/portal-settings'
import {PlatformIllustration, PortalNetworkBackdrop} from './PlatformIllustration'
import './portal.css'

/**
 * 统一门户 · 入口页（模板版）
 *
 * 视觉结构：
 * 首屏：3 张平台卡片 —— 1 张真实入口（数据驾驶舱）+ 2 张占位示例，
 * 演示「新增平台入口 = 新增一张卡片配置 + 一条路由」的接入方式。
 */

export type PortalDataTheme = 'light' | 'dark'

interface PortalPageProps {
  dataTheme?: PortalDataTheme
  onThemeChange?: (checked: boolean) => void
}

type PlatformTheme = 'blue' | 'teal'

interface PlatformCard {
  key: string
  /** 卡片插图，复用 PlatformIllustration 中的三套视觉。 */
  illustration: 'mall' | 'fulfillment' | 'carrier'
  theme: PlatformTheme
  title: string
  description: string
  tags: string[]
  route: PortalApplication['route']
}

const LOADING_DELAY_MS = 300

function toPlatformCard(application: PortalApplication): PlatformCard {
  return {
    key: application.id,
    illustration: application.illustration,
    theme: application.theme,
    title: application.name,
    description: application.description,
    tags: application.tags,
    route: application.route,
  }
}

export function PortalPage({ dataTheme, onThemeChange }: PortalPageProps) {
  const settings = usePortalSettings()
  const [loading, setLoading] = useState(true)
  const platformCards = useMemo(
    () => settings.applications
      .filter((application) => application.visibleOnPortal && application.status === 'enabled')
      .sort((left, right) => left.sort - right.sort || left.name.localeCompare(right.name, 'zh-CN'))
      .map(toPlatformCard),
    [settings.applications],
  )

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), LOADING_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [])

  const handleHeaderClick = (label: string) => {
    if (label === '首页') {
      window.location.hash = '/portal'
      return
    }
    message.info(`${label}（原型占位）`)
  }

  const handleEnterPlatform = (card: PlatformCard) => {
    if (card.route) {
      window.location.hash = `/${card.route}`
      return
    }
    message.info(`${card.title}（模板占位，暂未配置可访问路由，请在「应用管理」中维护）`)
  }

  const userMenuItems = [
    {key: 'user-settings', icon: <UserOutlined />, label: '用户配置'},
    {key: 'menu-management', icon: <MenuOutlined />, label: '菜单管理'},
    {key: 'app-management', icon: <AppstoreOutlined />, label: '应用管理'},
    {type: 'divider' as const},
    {key: 'analytics-cockpit', icon: <SettingOutlined />, label: '数据驾驶舱'},
  ]

  return (
    <div
      className="portal"
      data-theme={dataTheme}
      data-testid="portal-root"
      data-loading={loading ? 'true' : 'false'}
    >
      <header className="portal__header" aria-label="门户顶部导航">
        <div className="portal__brand">
          <span className="portal__brand-mark" aria-hidden="true">
            8B
          </span>
          <div className="portal__brand-copy">
            <strong className="portal__brand-title">baseTemplate</strong>
            <span className="portal__brand-subtitle">业务原型模板 · 保留框架 · 快速接入</span>
          </div>
        </div>
        <nav className="portal__nav" aria-label="门户快捷导航">
          <Button
            type="text"
            icon={<HomeOutlined aria-hidden="true" />}
            className="portal__nav-btn portal__nav-btn--active"
            onClick={() => handleHeaderClick('首页')}
          >
            首页
          </Button>
          <Button
            type="text"
            icon={<QuestionCircleOutlined aria-hidden="true" />}
            className="portal__nav-btn"
            onClick={() => handleHeaderClick('帮助中心')}
          >
            帮助中心
          </Button>
          <span className="portal__nav-divider" aria-hidden="true" />
          <Dropdown
            trigger={['click']}
            placement="bottomRight"
            menu={{
              items: userMenuItems,
              onClick: ({key}) => {
                if (key) window.location.hash = `/${key}`
              },
            }}
          >
            <Button
              type="text"
              className="portal__nav-btn portal__nav-btn--user"
              aria-label="用户菜单"
            >
              <Avatar size={24} style={{backgroundColor: settings.user.avatarColor}} className="portal__avatar">
                {settings.user.userName.slice(0, 1)}
              </Avatar>
              <span className="portal__nav-user-name">{settings.user.userName}</span>
              <DownOutlined aria-hidden="true" className="portal__nav-caret" />
            </Button>
          </Dropdown>
          {onThemeChange && (
            <Switch
              checked={dataTheme === 'dark'}
              checkedChildren={<MoonOutlined />}
              unCheckedChildren={<SunOutlined />}
              onChange={onThemeChange}
              aria-label="切换深色主题"
              className="portal__theme-switch"
            />
          )}
        </nav>
      </header>

      <main className="portal__main" aria-label="门户入口导航">
        <PortalNetworkBackdrop />
        {loading ? (
          <PortalSkeleton />
        ) : (
          <>
            {/* 首屏标题 */}
            <section className="portal__title" aria-labelledby="portal-title">
              <h1 id="portal-title" className="portal__title-main">
                业务原型模板统一门户
              </h1>
              <p className="portal__title-sub">
                通过统一门户快速进入各业务平台；模板内置数据驾驶舱示例，占位卡片演示如何接入新平台。
              </p>
            </section>

            {/* 首屏：平台卡片（3 列对称） */}
            <section className="portal__cards" aria-label="平台导航">
              {platformCards.map((card) => (
                <PlatformCardItem
                  key={card.key}
                  card={card}
                  onEnter={handleEnterPlatform}
                />
              ))}
              {platformCards.length === 0 && (
                <div className="portal__empty" role="status">
                  <AppstoreOutlined />
                  <strong>暂无门户应用</strong>
                  <span>请前往「应用管理」创建应用并开启门户展示。</span>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <footer className="portal__footer" aria-label="版权信息">
        © 2026 baseTemplate · 业务原型模板
      </footer>
    </div>
  )
}

function PlatformCardItem({
  card,
  onEnter,
}: {
  card: PlatformCard
  onEnter: (card: PlatformCard) => void
}) {
  const handleCardClick = () => onEnter(card)
  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onEnter(card)
    }
  }

  return (
    <article
      className={`portal-card portal-card--${card.theme}`}
      data-platform={card.key}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`进入${card.title}`}
    >
      <div className="portal-card__illustration" aria-hidden="true">
        <PlatformIllustration platform={card.illustration} />
      </div>
      <h2 className="portal-card__title">{card.title}</h2>
      <p className="portal-card__desc">{card.description}</p>
      <ul className="portal-card__tags" aria-label="能力标签">
        {card.tags.map((tag) => (
          <li key={tag} className={`portal-card__tag portal-card__tag--${card.theme}`}>
            <span className="portal-card__tag-dot" aria-hidden="true" />
            {tag}
          </li>
        ))}
      </ul>
      <span className={`portal-card__cta portal-card__cta--${card.theme}`} aria-hidden="true">
        进入平台
        <ArrowRightOutlined />
      </span>
    </article>
  )
}

function PortalSkeleton() {
  return (
    <div
      className="portal__skeleton"
      aria-label="门户加载中"
      aria-busy="true"
      data-testid="portal-skeleton"
    >
      <div className="portal__skeleton-head">
        <span className="portal__skeleton-bar portal__skeleton-bar--lg" />
        <span className="portal__skeleton-bar portal__skeleton-bar--md" />
      </div>
      <div className="portal__skeleton-grid">
        {[0, 1, 2].map((index) => (
          <div key={index} className="portal__skeleton-card">
            <span className="portal__skeleton-circle" aria-hidden="true" />
            <span className="portal__skeleton-bar portal__skeleton-bar--title" />
            <span className="portal__skeleton-bar portal__skeleton-bar--full" />
            <span className="portal__skeleton-bar portal__skeleton-bar--full" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default PortalPage
