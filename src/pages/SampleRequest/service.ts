import type { ResponseResult } from '../../services/api'

/**
 * 申请单服务层，迁自公司模板 `src/pages/SampleRequest/service.js`。
 *
 * 差异：模板用 `request` 请求 `${SERVER_PATH}/sample-request/*` 真实接口；
 * 本仓库是纯前端原型，这里用模块内的内存表模拟同一组函数与返回结构，
 * 页面代码不需要知道数据从哪来，将来换成真实 request 即可。
 */

export interface SampleRequestRecord {
  id: string
  code: string
  title: string
}

export interface SampleRequestQuery {
  keyword?: string
}

export interface SampleRequestPage {
  list: SampleRequestRecord[]
  total: number
}

const SEED: SampleRequestRecord[] = [
  { id: 'mock-1', code: 'SQ-001', title: '办公设备采购' },
  { id: 'mock-2', code: 'SQ-002', title: '项目差旅申请' },
  { id: 'mock-3', code: 'SQ-003', title: '厂区网络改造' },
]

let records: SampleRequestRecord[] = SEED.map((record) => ({ ...record }))

function delay(ms = 120): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

/** 恢复初始演示数据，测试用例用它保证互不影响。 */
export function resetSampleRequestStore() {
  records = SEED.map((record) => ({ ...record }))
}

export async function findByPage(params: SampleRequestQuery = {}): Promise<ResponseResult<SampleRequestPage>> {
  await delay(60)
  const keyword = params.keyword?.trim().toLowerCase()
  const list = keyword
    ? records.filter(
        (record) =>
          record.code.toLowerCase().includes(keyword) || record.title.toLowerCase().includes(keyword),
      )
    : records
  return { success: true, data: { list: list.map((record) => ({ ...record })), total: list.length } }
}

export async function findOne(id: string): Promise<ResponseResult<SampleRequestRecord>> {
  await delay(60)
  const record = records.find((item) => item.id === id)
  if (!record) return { success: false, message: '记录不存在或已被删除' }
  return { success: true, data: { ...record } }
}

export async function save(input: {
  id?: string
  code: string
  title: string
}): Promise<ResponseResult<SampleRequestRecord>> {
  await delay(80)
  const code = input.code.trim()
  const title = input.title.trim()
  if (!code || !title) return { success: false, message: '编号与标题不能为空' }
  const duplicate = records.some(
    (record) => record.code.toLowerCase() === code.toLowerCase() && record.id !== input.id,
  )
  if (duplicate) return { success: false, message: '编号已存在，请换一个' }

  if (input.id) {
    const index = records.findIndex((record) => record.id === input.id)
    if (index < 0) return { success: false, message: '记录不存在或已被删除' }
    const next = { ...records[index], code, title }
    records = records.map((record, current) => (current === index ? next : record))
    return { success: true, data: { ...next } }
  }

  const created: SampleRequestRecord = { id: `mock-${crypto.randomUUID()}`, code, title }
  records = [created, ...records]
  return { success: true, data: { ...created } }
}

export async function deleteById(id: string): Promise<ResponseResult<null>> {
  await delay(80)
  const exists = records.some((record) => record.id === id)
  if (!exists) return { success: false, message: '记录不存在或已被删除' }
  records = records.filter((record) => record.id !== id)
  return { success: true, data: null }
}
