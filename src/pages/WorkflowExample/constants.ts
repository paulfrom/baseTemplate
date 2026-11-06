import type { FlowStatus } from '../../mocks/bpm'
import { BPM_BASE_URL } from '../../utils/constants'

/**
 * 流程示例模块常量。
 *
 * 流程状态与 `src/mocks/bpm.ts` 的状态机保持一致；接入真实项目时，
 * 这一份状态定义换成后端返回的流程状态枚举即可。
 */

/** 流程状态。 */
export const FLOW_STATUS = {
  /** 草稿：还没有发起流程 */
  INIT: 'INIT',
  /** 审批中 */
  PROCESSING: 'PROCESSING',
  /** 已通过 */
  APPROVED: 'APPROVED',
  /** 已驳回 */
  REJECTED: 'REJECTED',
  /** 已终止 */
  ENDED: 'ENDED',
} as const satisfies Record<string, FlowStatus>

export type FlowStatusKey = keyof typeof FLOW_STATUS

/** 流程状态筛选项；`ALL` 表示不过滤。 */
export const FLOW_STATUS_FILTER_KEYS = [
  'ALL',
  'INIT',
  'PROCESSING',
  'APPROVED',
  'REJECTED',
  'ENDED',
] as const

export type FlowStatusFilterKey = (typeof FLOW_STATUS_FILTER_KEYS)[number]

/** 业务模型代码：与 BPM 流程定义绑定，发起流程时传给 `WorkFlow.StartFlow`。 */
export const BPM_ENTITY_CODE = 'EXPENSE_REQUEST'

/**
 * `WorkFlow` 组件的服务配置。
 *
 * SUID 的 `StoreProps` 要求同时给出请求方式、接口路径与服务基地址；
 * 原型里这些路径都由 `src/mocks/browser.ts` 的 MSW handler 拦截。
 */
export const BPM_START_STORE = {
  type: 'POST',
  url: 'sei-bpm/runDefaultBpm/startBpmFlow',
  baseUrl: BPM_BASE_URL,
} as const

export const BPM_END_STORE = {
  type: 'POST',
  url: 'sei-bpm/runInstance/checkAndEndByBusinessId',
  baseUrl: BPM_BASE_URL,
} as const

/** 操作权限码占位：原型不做权限校验，真实项目用 eadp-cli 登记后替换。 */
export const OPERATION_CODES = {
  ADD: 'baseTemplate-WORKFLOW-ADD',
  VIEW: 'baseTemplate-WORKFLOW-VIEW',
  EDIT: 'baseTemplate-WORKFLOW-EDIT',
  APPROVE: 'baseTemplate-WORKFLOW-APPROVE',
  END: 'baseTemplate-WORKFLOW-END',
} as const

/** 部门下拉选项（本地数据，不接主数据服务）。 */
export const DEPARTMENT_OPTIONS = [
  { id: 'dept-sales-1', name: '销售一部' },
  { id: 'dept-sales-2', name: '销售二部' },
  { id: 'dept-rd', name: '研发中心' },
  { id: 'dept-finance', name: '财务部' },
  { id: 'dept-admin', name: '行政部' },
]
