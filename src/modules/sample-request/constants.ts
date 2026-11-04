export const MODULE_ACTION = {
  LINK_VIEW: 'LINK_VIEW',
  VIEW_APPROVE_FLOW: 'VIEW_APPROVE_FLOW',
  UPDATE_APPROVE_FLOW: 'UPDATE_APPROVE_FLOW',
} as const

export type ModuleAction = typeof MODULE_ACTION[keyof typeof MODULE_ACTION]

export const isApproveEditable = (action?: ModuleAction) => action === MODULE_ACTION.UPDATE_APPROVE_FLOW
