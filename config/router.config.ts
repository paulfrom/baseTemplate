import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

/**
 * 路由表：页面、菜单与面包屑的唯一事实源。
 *
 * 对齐公司模板 `config/router.config.ts` 的嵌套写法，但保留 Vite 运行时：
 * 组件用 `lazy()` 直接引入，路径用 hash 路由解析（见 src/utils/navigation.ts）。
 */

/** 菜单图标键，与 `components/PortalIcon` 的图形一一对应。 */
export type PortalRouteIcon = 'cockpit' | 'menu' | 'apps' | 'user' | 'settings' | 'monitor'

/** 页面在应用内的稳定标识：菜单、面包屑和用户偏好都用它，不随路径调整而变。 */
export type AppRoute =
  | 'portal'
  | 'dashboard'
  | 'sample-request'
  | 'workflow-example'
  | 'menu-management'
  | 'login'

/** 布局标识：blank 由页面自绘外壳，auth 走应用外壳，login 走登录页外壳。 */
export type LayoutId = 'blank' | 'auth' | 'login'

/** 菜单元数据：只有需要出现在左侧导航的路径才配置。 */
export interface RouteMenuMeta {
  label: string
  groupId: string | null
  groupLabel: string
  icon: PortalRouteIcon
  permission: string
  sort: number
  defaultVisible: boolean
}

export interface AppRouteConfig {
  /** hash 路径；查询串（如 ?id=xxx）由页面自己解析。 */
  path: string
  route: AppRoute
  layout: LayoutId
  component: LazyExoticComponent<ComponentType<any>>
  /** 子页面高亮用的父路径，例如列表页里的表单页与详情页。 */
  parentPath?: string
  menu?: RouteMenuMeta
}

const Page = {
  Portal: lazy(() => import('../src/pages/Portal')),
  Dashboard: lazy(() => import('../src/pages/Dashboard')),
  Login: lazy(() => import('../src/pages/Login')),
  SampleRequest: lazy(() => import('../src/pages/SampleRequest')),
  SampleRequestForm: lazy(() => import('../src/pages/SampleRequest/Form')),
  SampleRequestDetail: lazy(() => import('../src/pages/SampleRequest/Detail')),
  WorkflowExample: lazy(() => import('../src/pages/WorkflowExample')),
  WorkflowExampleForm: lazy(() => import('../src/pages/WorkflowExample/Form')),
  WorkflowExampleDetail: lazy(() => import('../src/pages/WorkflowExample/Detail')),
  WorkflowExampleApprove: lazy(() => import('../src/pages/WorkflowExample/Approve')),
  MenuManagement: lazy(() => import('../src/pages/MenuManagement')),
}

export const ROUTER_CONFIG: readonly AppRouteConfig[] = [
  {
    path: '/portal',
    route: 'portal',
    layout: 'blank',
    component: Page.Portal,
    menu: {
      label: '门户入口',
      groupId: null,
      groupLabel: '顶级菜单',
      icon: 'apps',
      permission: 'portal:home:view',
      sort: 0,
      defaultVisible: false,
    },
  },
  {
    path: '/dashboard',
    route: 'dashboard',
    layout: 'auth',
    component: Page.Dashboard,
    menu: {
      label: '工作台',
      groupId: null,
      groupLabel: '顶级菜单',
      icon: 'cockpit',
      permission: 'portal:dashboard:view',
      sort: 5,
      defaultVisible: true,
    },
  },
  {
    path: '/sample-request',
    route: 'sample-request',
    layout: 'auth',
    component: Page.SampleRequest,
    menu: {
      label: '申请单示例',
      groupId: null,
      groupLabel: '顶级菜单',
      icon: 'menu',
      permission: 'sample:request:view',
      sort: 15,
      defaultVisible: true,
    },
  },
  {
    path: '/sample-request/form',
    route: 'sample-request',
    layout: 'auth',
    parentPath: '/sample-request',
    component: Page.SampleRequestForm,
  },
  {
    path: '/sample-request/detail',
    route: 'sample-request',
    layout: 'auth',
    parentPath: '/sample-request',
    component: Page.SampleRequestDetail,
  },
  {
    path: '/workflow-example',
    route: 'workflow-example',
    layout: 'auth',
    component: Page.WorkflowExample,
    menu: {
      label: '流程示例',
      groupId: null,
      groupLabel: '顶级菜单',
      icon: 'menu',
      permission: 'workflow:example:view',
      sort: 18,
      defaultVisible: true,
    },
  },
  {
    path: '/workflow-example/form',
    route: 'workflow-example',
    layout: 'auth',
    parentPath: '/workflow-example',
    component: Page.WorkflowExampleForm,
  },
  {
    path: '/workflow-example/detail',
    route: 'workflow-example',
    layout: 'auth',
    parentPath: '/workflow-example',
    component: Page.WorkflowExampleDetail,
  },
  {
    path: '/workflow-example/approve',
    route: 'workflow-example',
    layout: 'auth',
    parentPath: '/workflow-example',
    component: Page.WorkflowExampleApprove,
  },
  {
    path: '/menu-management',
    route: 'menu-management',
    layout: 'auth',
    component: Page.MenuManagement,
    menu: {
      label: '菜单管理',
      groupId: 'system-config-group',
      groupLabel: '系统配置',
      icon: 'menu',
      permission: 'system:menu:manage',
      sort: 21,
      defaultVisible: true,
    },
  },
  {
    path: '/user/login',
    route: 'login',
    layout: 'login',
    component: Page.Login,
  },
]

/** 无 hash 或 hash 不可识别时的落地页。 */
export const DEFAULT_PATH = '/portal'

/** 需要出现在左侧导航的路径（菜单管理只读这一份，不允许脱离路由新增菜单）。 */
export interface PortalRouteDefinition {
  route: AppRoute
  label: string
  groupId: string | null
  groupLabel: string
  icon: PortalRouteIcon
  permission: string
  sort: number
  defaultVisible: boolean
}

export const PORTAL_ROUTE_DEFINITIONS: readonly PortalRouteDefinition[] = ROUTER_CONFIG.filter(
  (item): item is AppRouteConfig & { menu: RouteMenuMeta } => Boolean(item.menu),
).map(({ route, menu }) => ({
  route,
  label: menu.label,
  groupId: menu.groupId,
  groupLabel: menu.groupLabel,
  icon: menu.icon,
  permission: menu.permission,
  sort: menu.sort,
  defaultVisible: menu.defaultVisible,
}))

export const ROUTE_PATHS = ROUTER_CONFIG.map((item) => item.path)

export function findRouteConfig(path: string): AppRouteConfig | undefined {
  return ROUTER_CONFIG.find((item) => item.path === path)
}

/** 菜单里的 route 标识 → 实际路径。同一个 route 只取第一条路径（子页面不算入口）。 */
export function getPathByRoute(route: AppRoute): string | undefined {
  return ROUTER_CONFIG.find((item) => item.route === route)?.path
}

/** 面包屑与菜单高亮用：子页面归属到父路径，未登记的路径原样返回。 */
export function getHighlightPath(path: string): string {
  const config = findRouteConfig(path)
  if (config) return config.parentPath ?? config.path
  const fallback = ROUTER_CONFIG.find((item) => path.startsWith(`${item.path}/`))
  return fallback?.path ?? DEFAULT_PATH
}
