import {
  getFlowSummary,
  removeFlowByBusinessId,
  resetBpmStore,
  seedFlow,
  type FlowStatus,
} from '../../mocks/bpm'
import type { ResponseResult } from '../../services/api'

/**
 * 流程示例（费用申请单）的服务层。
 *
 * 业务字段由本模块的内存表维护；流程状态由 `src/mocks/bpm.ts` 的 BPM 契约模拟维护，
 * 列表与详情通过 `getFlowSummary` 合并出流程状态，避免同一状态两处维护。
 *
 * 对齐公司模板 `src/pages/Project/ProjectApply/service.js` 的函数名与返回结构：
 * 真实项目里这些函数是 `request` 到后端，这里换成同一组本地 Mock。
 */

/** 费用申请单（业务字段）。 */
export interface WorkflowRecord {
  id: string
  code: string
  title: string
  applicant: string
  department: string
  amount: number
  reason: string
  createdDate: string
}

/** 列表与详情使用的视图：业务字段 + 流程状态。 */
export interface WorkflowRecordView extends WorkflowRecord {
  flowStatus: FlowStatus
  flowInstanceId?: string
  flowTaskId?: string
  flowNodeName?: string
}

export interface WorkflowQuery {
  keyword?: string
  flowStatus?: string
}

export interface WorkflowPage {
  list: WorkflowRecordView[]
  total: number
}

const SEED: WorkflowRecord[] = [
  {
    id: 'wf-1',
    code: 'EX-2026-001',
    title: '华东区差旅费用报销',
    applicant: '张发起',
    department: '销售一部',
    amount: 12800,
    reason: '10 月华东区客户拜访，机票与住宿费用。',
    createdDate: '2026-10-12 09:20:00',
  },
  {
    id: 'wf-2',
    code: 'EX-2026-002',
    title: '研发部办公用品采购',
    applicant: '李研发',
    department: '研发中心',
    amount: 3600,
    reason: '新同事入职工位用品补充。',
    createdDate: '2026-10-15 14:05:00',
  },
  {
    id: 'wf-3',
    code: 'EX-2026-003',
    title: '年度培训费用申请',
    applicant: '赵培训',
    department: '行政部',
    amount: 52000,
    reason: '年度内训课程费用，含讲师与教材。',
    createdDate: '2026-10-08 10:30:00',
  },
  {
    id: 'wf-4',
    code: 'EX-2026-004',
    title: '产线设备维修费用',
    applicant: '王设备',
    department: '财务部',
    amount: 27500,
    reason: '二号产线传送带故障维修。',
    createdDate: '2026-10-20 16:40:00',
  },
]

let records: WorkflowRecord[] = []

function delay(ms = 80): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

/** 业务字段 + 流程状态的合并视图。 */
function withFlow(record: WorkflowRecord): WorkflowRecordView {
  const flow = getFlowSummary(record.id)
  return {
    ...record,
    flowStatus: flow.status,
    flowInstanceId: flow.instanceId,
    flowTaskId: flow.taskId,
    flowNodeName: flow.currentNodeName,
  }
}

/** 恢复初始演示数据与演示流程，测试用例用它保证互不影响。 */
export function resetWorkflowStore(): void {
  records = SEED.map((record) => ({ ...record }))
  resetBpmStore()
  seedFlow('wf-1', {
    status: 'PROCESSING',
    creatorName: '张发起',
    remark: '10 月华东区客户拜访，机票与住宿费用。',
  })
  seedFlow('wf-3', {
    status: 'APPROVED',
    creatorName: '赵培训',
    remark: '年度内训课程费用，含讲师与教材。',
  })
  seedFlow('wf-4', {
    status: 'REJECTED',
    creatorName: '王设备',
    remark: '产线设备维修费用。',
  })
}

resetWorkflowStore()

/** 分页查询：关键字 + 流程状态过滤，全部在本地完成。 */
export async function findByPage(
  params: WorkflowQuery = {},
): Promise<ResponseResult<WorkflowPage>> {
  await delay(60)
  const keyword = params.keyword?.trim().toLowerCase()
  let list = records.map(withFlow)
  if (keyword) {
    list = list.filter(
      (record) =>
        record.code.toLowerCase().includes(keyword) ||
        record.title.toLowerCase().includes(keyword) ||
        record.applicant.toLowerCase().includes(keyword),
    )
  }
  if (params.flowStatus && params.flowStatus !== 'ALL') {
    list = list.filter((record) => record.flowStatus === params.flowStatus)
  }
  return { success: true, data: { list, total: list.length } }
}

/** 按主键加载单条申请单（含流程状态）。 */
export async function findOne(id: string): Promise<ResponseResult<WorkflowRecordView>> {
  await delay(60)
  const record = records.find((item) => item.id === id)
  if (!record) return { success: false, message: '记录不存在或已被删除' }
  return { success: true, data: withFlow(record) }
}

/** 保存申请单：新建时自动生成单号。 */
export async function save(input: {
  id?: string
  title: string
  applicant: string
  department: string
  amount: number
  reason: string
}): Promise<ResponseResult<WorkflowRecordView>> {
  await delay(80)
  const title = input.title.trim()
  const applicant = input.applicant.trim()
  const department = input.department.trim()
  const reason = input.reason.trim()
  if (!title || !applicant || !department) {
    return { success: false, message: '事由、申请人与部门不能为空' }
  }
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return { success: false, message: '申请金额必须大于 0' }
  }

  if (input.id) {
    const index = records.findIndex((record) => record.id === input.id)
    if (index < 0) return { success: false, message: '记录不存在或已被删除' }
    const next: WorkflowRecord = {
      ...records[index],
      title,
      applicant,
      department,
      amount: input.amount,
      reason,
    }
    records = records.map((record, current) => (current === index ? next : record))
    return { success: true, data: withFlow(next) }
  }

  const created: WorkflowRecord = {
    id: `wf-${crypto.randomUUID()}`,
    code: nextCode(),
    title,
    applicant,
    department,
    amount: input.amount,
    reason,
    createdDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
  }
  records = [created, ...records]
  return { success: true, data: withFlow(created) }
}

/** 删除申请单，并清掉它对应的流程。 */
export async function deleteById(id: string): Promise<ResponseResult<null>> {
  await delay(80)
  const exists = records.some((record) => record.id === id)
  if (!exists) return { success: false, message: '记录不存在或已被删除' }
  records = records.filter((record) => record.id !== id)
  removeFlowByBusinessId(id)
  return { success: true, data: null }
}

/** 新建单号：EX-年份-序号，与已有单号不重复。 */
function nextCode(): string {
  const year = new Date().getFullYear()
  const prefix = `EX-${year}-`
  const used = records
    .map((record) => record.code)
    .filter((code) => code.startsWith(prefix))
    .map((code) => Number(code.slice(prefix.length)))
    .filter((value) => Number.isFinite(value))
  const next = (used.length ? Math.max(...used) : 0) + 1
  return `${prefix}${String(next).padStart(3, '0')}`
}
