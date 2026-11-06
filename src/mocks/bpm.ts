import dayjs from 'dayjs'

/**
 * BPM（SEI BPM）服务契约模拟。
 *
 * `@ead/suid` 的 `WorkFlow` 组件（`StartFlow` / `Approve` / `EndFlow`）会直接请求
 * `sei-bpm/**` 接口。本仓库是纯前端原型，这里用内存状态机复刻这部分契约，
 * 再由 `src/mocks/browser.ts` 注册成 MSW handler 拦截，
 * 保证请求不会穿透到真实 BPM 服务。
 *
 * 示例流程定义：发起 → 部门审批 → 财务审批 → 结束。
 * 业务单据只认 `businessId`，流程状态由本模块单独维护，
 * 页面通过 `getFlowSummary` 读取，避免流程状态与业务字段两处维护。
 */

/** 流程状态：草稿 / 审批中 / 已通过 / 已驳回 / 已终止。 */
export type FlowStatus = 'INIT' | 'PROCESSING' | 'APPROVED' | 'REJECTED' | 'ENDED'

/** 流程执行人。 */
export interface FlowExecutor {
  id: string
  code: string
  name: string
  userName: string
  organizationName: string
}

/** 单据在某节点上的流程摘要，供列表与表单展示。 */
export interface FlowSummary {
  status: FlowStatus
  ended: boolean
  instanceId?: string
  taskId?: string
  currentNodeName?: string
}

/** 与后端一致的响应壳：SUID 的 axios 拦截器会拆出 `data` 并保留 `success`。 */
export interface BpmResponse<T = unknown> {
  success: boolean
  message: string
  data: T
}

interface FlowTask {
  id: string
  nodeId: string
  nodeName: string
  taskType: string
  executor: FlowExecutor
  createdDate: string
  taskOpenTime: string
  finished: boolean
}

interface FlowHistory {
  id: string
  nodeId: string
  nodeName: string
  taskType: string
  executor: FlowExecutor
  taskStartTime: string
  taskEndTime: string
  historyAbstract: string
  executeType: string
  executeTypeName: string
  documentList: unknown[]
}

interface FlowNode {
  id: string
  name: string
  tasks: FlowTask[]
  histories: FlowHistory[]
}

interface FlowInstance {
  id: string
  businessId: string
  businessModelCode: string
  status: FlowStatus
  creatorName: string
  creatorAccount: string
  createdDate: string
  businessModelRemark: string
  ended: boolean
  endDate: string
  manuallyEnd: boolean
  directPass: boolean
  nodes: FlowNode[]
}

const DEPT_EXECUTOR: FlowExecutor = {
  id: 'user-dept-approve',
  code: 'lsp',
  name: '李审批',
  userName: '李审批',
  organizationName: '财务部',
}

const FINANCE_EXECUTOR: FlowExecutor = {
  id: 'user-finance-approve',
  code: 'wangm',
  name: '王明',
  userName: '王明',
  organizationName: '财务部',
}

/** 示例流程定义，节点顺序即流转顺序。 */
const FLOW_NODES = [
  { id: 'node-dept', name: '部门审批', nodeType: 'Approve', executor: DEPT_EXECUTOR },
  { id: 'node-finance', name: '财务审批', nodeType: 'Approve', executor: FINANCE_EXECUTOR },
  { id: 'node-end', name: '结束', nodeType: 'EndEvent', executor: FINANCE_EXECUTOR },
] as const

const FLOW_DEFINITION = {
  flowDefinitionId: 'flow-def-expense',
  flowTypeId: 'flow-type-expense',
  flowTypeName: '费用申请审批',
  flowDefinitionName: '费用申请审批流程',
}

/** 首个审批节点，发起流程后落在该节点。 */
const FIRST_APPROVE_NODE = FLOW_NODES[0]

/** businessId → 流程实例。 */
const instances = new Map<string, FlowInstance>()
/** taskId → 所在实例与节点。 */
const taskIndex = new Map<string, { businessId: string; nodeId: string }>()

function now(): string {
  return dayjs().format('YYYY-MM-DD HH:mm:ss')
}

function succeed<T>(data: T, message = '操作成功'): BpmResponse<T> {
  return { success: true, message, data }
}

function fail(message: string): BpmResponse<null> {
  return { success: false, message, data: null }
}

function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}

function findNode(instance: FlowInstance, nodeId: string): FlowNode | undefined {
  return instance.nodes.find((node) => node.id === nodeId)
}

function findPendingTask(instance: FlowInstance): FlowTask | undefined {
  for (const node of instance.nodes) {
    const task = node.tasks.find((item) => !item.finished)
    if (task) return task
  }
  return undefined
}

function findInstanceByBusinessId(businessId: string): FlowInstance | undefined {
  for (const instance of instances.values()) {
    if (instance.businessId === businessId) return instance
  }
  return undefined
}

function locateTask(taskId: string): { instance: FlowInstance; node: FlowNode; task: FlowTask } | undefined {
  const located = taskIndex.get(taskId)
  if (!located) return undefined
  const instance = findInstanceByBusinessId(located.businessId)
  if (!instance) return undefined
  const node = findNode(instance, located.nodeId)
  if (!node) return undefined
  const task = node.tasks.find((item) => item.id === taskId)
  if (!task) return undefined
  return { instance, node, task }
}

function buildNode(nodeId: string, name: string): FlowNode {
  return { id: nodeId, name, tasks: [], histories: [] }
}

function buildHistory(
  node: FlowNode,
  executor: FlowExecutor,
  opinion: string,
  executeType: string,
  executeTypeName: string,
  startTime: string,
): FlowHistory {
  return {
    id: createId('history'),
    nodeId: node.id,
    nodeName: node.name,
    taskType: 'Approve',
    executor,
    taskStartTime: startTime,
    taskEndTime: now(),
    historyAbstract: opinion,
    executeType,
    executeTypeName,
    documentList: [],
  }
}

/** 清空全部流程状态，测试与「恢复默认」用。 */
export function resetBpmStore(): void {
  instances.clear()
  taskIndex.clear()
}

/** 删除单据时一并清掉它的流程。 */
export function removeFlowByBusinessId(businessId: string): void {
  const instance = findInstanceByBusinessId(businessId)
  if (!instance) return
  for (const node of instance.nodes) {
    for (const task of node.tasks) taskIndex.delete(task.id)
  }
  instances.delete(instance.id)
}

/** 读取单据当前的流程摘要；没有流程时视为草稿。 */
export function getFlowSummary(businessId: string): FlowSummary {
  const instance = findInstanceByBusinessId(businessId)
  if (!instance) {
    return { status: 'INIT', ended: false }
  }
  const pending = findPendingTask(instance)
  return {
    status: instance.status,
    ended: instance.ended,
    instanceId: instance.id,
    taskId: pending?.id,
    currentNodeName: pending?.nodeName,
  }
}

/**
 * 造一条演示流程：
 * - `PROCESSING`：停在指定审批节点，等待办理；
 * - `APPROVED`：两级审批都通过，流程结束；
 * - `REJECTED`：首个节点驳回，流程结束；
 * - `ENDED`：发起人主动终止，流程结束。
 */
export function seedFlow(
  businessId: string,
  options: {
    status: Exclude<FlowStatus, 'INIT'>
    creatorName?: string
    creatorAccount?: string
    remark?: string
    pendingNodeId?: string
  },
): void {
  removeFlowByBusinessId(businessId)
  const creatorName = options.creatorName ?? '张发起'
  const creatorAccount = options.creatorAccount ?? 'zhangfq'
  const createdDate = now()
  const instance: FlowInstance = {
    id: createId('instance'),
    businessId,
    businessModelCode: 'EXPENSE_REQUEST',
    status: options.status,
    creatorName,
    creatorAccount,
    createdDate,
    businessModelRemark: options.remark ?? '',
    ended: options.status !== 'PROCESSING',
    endDate: options.status === 'PROCESSING' ? '' : createdDate,
    manuallyEnd: options.status === 'ENDED',
    directPass: false,
    nodes: FLOW_NODES.map((node) => buildNode(node.id, node.name)),
  }
  instances.set(instance.id, instance)

  const deptNode = findNode(instance, FIRST_APPROVE_NODE.id)!
  const financeNode = findNode(instance, FLOW_NODES[1].id)!

  if (options.status === 'PROCESSING') {
    const nodeId = options.pendingNodeId ?? FIRST_APPROVE_NODE.id
    const node = findNode(instance, nodeId)!
    const executor = nodeId === financeNode.id ? FINANCE_EXECUTOR : DEPT_EXECUTOR
    const task: FlowTask = {
      id: createId('task'),
      nodeId: node.id,
      nodeName: node.name,
      taskType: 'Approve',
      executor,
      createdDate,
      taskOpenTime: createdDate,
      finished: false,
    }
    node.tasks.push(task)
    taskIndex.set(task.id, { businessId, nodeId: node.id })
    return
  }

  deptNode.histories.push(
    buildHistory(deptNode, DEPT_EXECUTOR, '部门同意', 'AGREE', '同意', createdDate),
  )
  if (options.status === 'APPROVED') {
    financeNode.histories.push(
      buildHistory(financeNode, FINANCE_EXECUTOR, '财务同意', 'AGREE', '同意', createdDate),
    )
    return
  }
  if (options.status === 'REJECTED') {
    deptNode.histories[0].historyAbstract = '材料不全，请补充后重新提交'
    deptNode.histories[0].executeType = 'DISAGREE'
    deptNode.histories[0].executeTypeName = '不同意'
  }
}

/** 流程可选节点（发起流程弹窗用）。 */
function usableFlowNode() {
  return {
    id: FIRST_APPROVE_NODE.id,
    name: FIRST_APPROVE_NODE.name,
    nodeType: FIRST_APPROVE_NODE.nodeType,
    flowTaskType: 'SingleSign',
    executorType: 'Single',
    chooseExecutorType: 'readonly',
    solidifyNode: true,
    allowChooseInstancy: false,
    executorList: [DEPT_EXECUTOR],
  }
}

/** 下一个可流转节点。 */
function nextNodeOf(nodeId: string) {
  const index = FLOW_NODES.findIndex((node) => node.id === nodeId)
  return index >= 0 && index + 1 < FLOW_NODES.length ? FLOW_NODES[index + 1] : undefined
}

/** 节点信息（审批面板的「下一步决策」用）。 */
function toDecisionNode(nodeId: string, name: string, nodeType: string) {
  return {
    id: nodeId,
    name,
    nodeType,
    flowTaskType: nodeType === 'EndEvent' ? '' : 'SingleSign',
    executorType: 'Single',
    chooseExecutorType: 'readonly',
    solidifyNode: true,
    defaultChoose: true,
    currentSingleTaskAuto: true,
    allowChooseInstancy: false,
    executorList: [FINANCE_EXECUTOR],
  }
}

/** `POST sei-bpm/runDefaultBpm/findUsableFlowList`：可发起的流程与首个节点。 */
export function findUsableFlowList(body: { businessId?: string }): BpmResponse {
  const businessId = body?.businessId ?? ''
  if (businessId && getFlowSummary(businessId).status === 'PROCESSING') {
    return fail('该单据已有进行中的流程')
  }
  return succeed({
    usableFlowList: [
      {
        flowDefinitionId: FLOW_DEFINITION.flowDefinitionId,
        flowTypeId: FLOW_DEFINITION.flowTypeId,
        flowTypeName: FLOW_DEFINITION.flowTypeName,
        flowDefinitionName: FLOW_DEFINITION.flowDefinitionName,
      },
    ],
    nodeListOfFirstUsableFlow: [usableFlowNode()],
  })
}

/** `POST sei-bpm/runDefaultBpm/startBpmFlow`：发起流程。 */
export function startBpmFlow(body: {
  businessId?: string
  businessEntityCode?: string
  flowDefinitionId?: string
  additionRemark?: string
  nextNodeParamsList?: { nodeId?: string; executorList?: FlowExecutor[] }[]
}): BpmResponse {
  const businessId = body?.businessId
  if (!businessId) return fail('缺少业务单据标识')
  if (getFlowSummary(businessId).status === 'PROCESSING') {
    return fail('该单据已有进行中的流程')
  }
  removeFlowByBusinessId(businessId)

  const createdDate = now()
  const instance: FlowInstance = {
    id: createId('instance'),
    businessId,
    businessModelCode: body?.businessEntityCode ?? 'EXPENSE_REQUEST',
    status: 'PROCESSING',
    creatorName: '张发起',
    creatorAccount: 'zhangfq',
    createdDate,
    businessModelRemark: body?.additionRemark ?? '',
    ended: false,
    endDate: '',
    manuallyEnd: false,
    directPass: false,
    nodes: FLOW_NODES.map((node) => buildNode(node.id, node.name)),
  }
  instances.set(instance.id, instance)

  const node = findNode(instance, FIRST_APPROVE_NODE.id)!
  const executor =
    body?.nextNodeParamsList?.[0]?.executorList?.[0] ?? DEPT_EXECUTOR
  const task: FlowTask = {
    id: createId('task'),
    nodeId: node.id,
    nodeName: node.name,
    taskType: 'Approve',
    executor,
    createdDate,
    taskOpenTime: createdDate,
    finished: false,
  }
  node.tasks.push(task)
  taskIndex.set(task.id, { businessId, nodeId: node.id })

  return succeed({ instanceId: instance.id, taskId: task.id }, '流程发起成功')
}

/** `GET sei-bpm/runDefaultBpm/getApprovePageLoadingInfo`：审批面板抬头与操作按钮。 */
export function getApprovePageLoadingInfo(taskId: string): BpmResponse {
  const located = locateTask(taskId)
  if (!located) return fail('审批任务不存在或已办结')
  const { instance, task } = located
  return succeed({
    businessModelRemark: instance.businessModelRemark,
    defaultOpinion: '',
    opinionList: [],
    labelReason: '',
    disagreeReasonList: [],
    allowApproveAttachments: false,
    endNoSecondConfirmation: true,
    executeButtonList: [
      { executeButton: 'AGREE', executeButtonRemark: '同意' },
      { executeButton: 'DISAGREE', executeButtonRemark: '不同意' },
    ],
    currentNodeName: task.nodeName,
  })
}

/** `GET sei-bpm/runDefaultBpm/getNextDicisionInfo`：当前任务的下一步节点。 */
export function getNextDicisionInfo(taskId: string): BpmResponse {
  const located = locateTask(taskId)
  if (!located) return fail('审批任务不存在或已办结')
  const next = nextNodeOf(located.node.id)
  if (!next) return succeed([])
  return succeed([toDecisionNode(next.id, next.name, next.nodeType)])
}

/** `POST sei-bpm/runDefaultBpm/getSelectedNextNodeInfo`：办理时选定的下一节点。 */
export function getSelectedNextNodeInfo(body: { taskId?: string; agreeOrNot?: boolean }): BpmResponse {
  const located = locateTask(body?.taskId ?? '')
  if (!located) return fail('审批任务不存在或已办结')
  if (body?.agreeOrNot === false) {
    return succeed([toDecisionNode('node-start', '发起人', 'Approve')])
  }
  const next = nextNodeOf(located.node.id)
  if (!next) return succeed([])
  return succeed([toDecisionNode(next.id, next.name, next.nodeType)])
}

/** `POST sei-bpm/runDefaultBpm/handleBpmFlow`：办理任务，推进流程。 */
export function handleBpmFlow(body: {
  taskId?: string
  opinion?: string
  buttonCode?: string
  nextNodeParamsList?: { nodeId?: string }[]
}): BpmResponse {
  const located = locateTask(body?.taskId ?? '')
  if (!located) return fail('审批任务不存在或已办结')
  const { instance, node, task } = located
  const buttonCode = body?.buttonCode ?? 'AGREE'
  const opinion = body?.opinion?.trim() || (buttonCode === 'DISAGREE' ? '不同意' : '同意')

  task.finished = true
  node.histories.push(
    buildHistory(
      node,
      task.executor,
      opinion,
      buttonCode,
      buttonCode === 'DISAGREE' ? '不同意' : '同意',
      task.taskOpenTime,
    ),
  )
  taskIndex.delete(task.id)

  if (buttonCode === 'DISAGREE') {
    instance.status = 'REJECTED'
    instance.ended = true
    instance.endDate = now()
    instance.manuallyEnd = false
    return succeed({ instanceId: instance.id }, '已提交不同意')
  }

  const next = nextNodeOf(node.id)
  if (!next || next.nodeType === 'EndEvent') {
    instance.status = 'APPROVED'
    instance.ended = true
    instance.endDate = now()
    instance.manuallyEnd = false
    return succeed({ instanceId: instance.id }, '审批通过，流程结束')
  }

  const nextFlowNode = findNode(instance, next.id)!
  const task2: FlowTask = {
    id: createId('task'),
    nodeId: nextFlowNode.id,
    nodeName: nextFlowNode.name,
    taskType: 'Approve',
    executor: next.executor,
    createdDate: now(),
    taskOpenTime: now(),
    finished: false,
  }
  nextFlowNode.tasks.push(task2)
  taskIndex.set(task2.id, { businessId: instance.businessId, nodeId: nextFlowNode.id })
  instance.status = 'PROCESSING'
  return succeed({ instanceId: instance.id, taskId: task2.id }, '已提交，转至下一节点')
}

/** `GET sei-bpm/runDefaultBpm/getMergeTrackInfoByTaskId`：流程日志。 */
export function getMergeTrackInfoByTaskId(taskId: string): BpmResponse {
  const located = locateTask(taskId)
  if (!located) return fail('审批任务不存在或已办结')
  return succeed([toInstanceTrack(located.instance)])
}

/** `GET sei-bpm/runDefaultBpm/getMergeTrackInfoByBusinessId`：按单据取流程日志。 */
export function getMergeTrackInfoByBusinessId(businessId: string): BpmResponse {
  const instance = findInstanceByBusinessId(businessId)
  if (!instance) return fail('该单据没有流程记录')
  return succeed([toInstanceTrack(instance)])
}

/** 流程日志结构：实例 + 节点（含待办与历史）。 */
function toInstanceTrack(instance: FlowInstance) {
  return {
    instance: {
      id: instance.id,
      businessId: instance.businessId,
      businessModelCode: instance.businessModelCode,
      status: instance.status,
      creatorName: instance.creatorName,
      creatorAccount: instance.creatorAccount,
      createdDate: instance.createdDate,
      businessModelRemark: instance.businessModelRemark,
      ended: instance.ended,
      endDate: instance.endDate,
      manuallyEnd: instance.manuallyEnd,
      directPass: instance.directPass,
    },
    nodes: instance.nodes.map((node) => ({
      id: node.id,
      name: node.name,
      tasks: node.tasks.map((task) => ({
        id: task.id,
        taskType: task.taskType,
        createdDate: task.createdDate,
        taskOpenTime: task.taskOpenTime,
        executorName: task.executor.name,
        executorAccount: task.executor.code,
        executorOrgName: task.executor.organizationName,
      })),
      histories: node.histories.map((history) => ({
        id: history.id,
        taskType: history.taskType,
        taskStartTime: history.taskStartTime,
        taskEndTime: history.taskEndTime,
        historyAbstract: history.historyAbstract,
        executeType: history.executeType,
        executeTypeName: history.executeTypeName,
        executorName: history.executor.name,
        executorAccount: history.executor.code,
        executorOrgName: history.executor.organizationName,
        documentList: history.documentList,
      })),
    })),
  }
}

/** `POST sei-bpm/runInstance/checkAndEndByBusinessId`：终止流程。 */
export function checkAndEndByBusinessId(body: {
  businessId?: string
  terminateReason?: string
}): BpmResponse {
  const businessId = body?.businessId
  if (!businessId) return fail('缺少业务单据标识')
  const instance = findInstanceByBusinessId(businessId)
  if (!instance) return fail('该单据没有流程，无法终止')
  if (instance.ended) return fail('流程已结束，无法终止')

  for (const node of instance.nodes) {
    for (const task of node.tasks) {
      if (!task.finished) {
        task.finished = true
        node.histories.push(
          buildHistory(
            node,
            task.executor,
            body?.terminateReason?.trim() || '发起人终止流程',
            'END',
            '终止',
            task.taskOpenTime,
          ),
        )
        taskIndex.delete(task.id)
      }
    }
  }
  instance.status = 'ENDED'
  instance.ended = true
  instance.endDate = now()
  instance.manuallyEnd = true
  return succeed({ instanceId: instance.id }, '流程已终止')
}
