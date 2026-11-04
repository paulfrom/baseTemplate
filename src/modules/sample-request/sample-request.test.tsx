import {cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react'
import {afterEach, beforeAll, afterAll, describe, expect, it, vi} from 'vitest'
import {setupServer} from 'msw/node'
import {sampleRequestBpmHandlers} from './bpmMock'
import {RequestForm} from './RequestForm'
import {MODULE_ACTION} from './constants'
import {SampleRequestPage} from './SampleRequestPage'

afterEach(cleanup)
const server = setupServer(...sampleRequestBpmHandlers)
beforeAll(() => server.listen({onUnhandledRequest: 'error'}))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const record = {id: 'test-request', code: 'SQ-TEST', title: '测试申请'}

describe('申请单共用表单', () => {
  it('校验必填字段并保存修改后的业务记录', async () => {
    const save = vi.fn()
    render(<RequestForm record={record} onSave={save} onBack={vi.fn()} />)
    const title = screen.getByLabelText('申请标题')
    fireEvent.change(title, {target: {value: ''}})
    fireEvent.click(screen.getByRole('button', {name: '保存'}))
    expect(await screen.findByText('请填写此项')).toBeInTheDocument()
    expect(save).not.toHaveBeenCalled()
    fireEvent.change(title, {target: {value: '修改后的申请'}})
    fireEvent.click(screen.getByRole('button', {name: '保存'}))
    await waitFor(() => expect(save).toHaveBeenCalledWith({...record, title: '修改后的申请'}))
  })

  it('同一记录切换查看和编辑时更新字段权限，流程模式隐藏独立操作', () => {
    const props = {record, onSave: vi.fn(), onBack: vi.fn()}
    const {rerender} = render(<RequestForm {...props} action={MODULE_ACTION.LINK_VIEW} />)
    expect(screen.getByLabelText('申请标题')).toBeDisabled()
    expect(screen.queryByRole('button', {name: '保存'})).not.toBeInTheDocument()
    expect(screen.getByRole('button', {name: '返回'})).toBeEnabled()
    rerender(<RequestForm {...props} />)
    expect(screen.getByLabelText('申请标题')).toBeEnabled()
    expect(screen.getByRole('button', {name: '保存'})).toBeInTheDocument()
    rerender(<RequestForm {...props} action={MODULE_ACTION.UPDATE_APPROVE_FLOW} flowMode />)
    expect(screen.queryByRole('button', {name: '保存'})).not.toBeInTheDocument()
    expect(screen.queryByRole('button', {name: '返回'})).not.toBeInTheDocument()
  })
})

describe('申请单 Mock 交互', () => {
  it('通过真实审批组件办理同意并更新列表状态', async () => {
    render(<SampleRequestPage />)
    const row = (await screen.findByText('SQ-001')).closest('tr')!
    fireEvent.click(within(row).getByRole('button', {name: '模拟审批'}))
    expect(await screen.findByDisplayValue('办公设备采购')).toBeDisabled()
    fireEvent.click(await screen.findByRole('button', {name: /同\s*意/}))
    expect(await screen.findByText('模拟已通过')).toBeInTheDocument()
  })

  it('通过真实审批组件填写退回意见并更新列表状态', async () => {
    render(<SampleRequestPage />)
    const row = (await screen.findByText('SQ-001')).closest('tr')!
    fireEvent.click(within(row).getByRole('button', {name: '模拟审批'}))
    await screen.findByRole('button', {name: /退\s*回/})
    const opinion = document.querySelector('textarea')!
    fireEvent.change(opinion, {target: {value: '请补充业务资料'}})
    fireEvent.click(screen.getByRole('button', {name: /退\s*回/}))
    expect(await screen.findByText('模拟已退回')).toBeInTheDocument()
  })
  it('使用真实列表的本地快搜筛选记录', async () => {
    render(<SampleRequestPage />)
    await screen.findByText('SQ-001')
    fireEvent.change(screen.getByRole('searchbox'), {target: {value: 'SQ-002'}})
    await waitFor(() => expect(screen.queryByText('SQ-001')).not.toBeInTheDocument())
    const row = screen.getByText('SQ-002').closest('tr')!
    fireEvent.click(within(row).getByRole('button', {name: '编辑'}))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('申请标题'), {target: {value: '筛选后编辑'}})
    fireEvent.click(within(dialog).getByRole('button', {name: '保存'}))
    expect(await screen.findByText('筛选后编辑')).toBeInTheDocument()
    expect(screen.queryByText('SQ-001')).not.toBeInTheDocument()
  })

  it('查看保持只读，删除只更新本地列表', async () => {
    render(<SampleRequestPage />)
    const row = (await screen.findByText('SQ-001')).closest('tr')!
    fireEvent.click(within(row).getByRole('button', {name: '查看'}))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByLabelText('申请标题')).toBeDisabled()
    fireEvent.click(within(dialog).getByRole('button', {name: '返回'}))
    fireEvent.click(within(row).getByRole('button', {name: '删除'}))
    fireEvent.click(await screen.findByRole('button', {name: /确\s*定|OK/i}))
    await waitFor(() => expect(screen.queryByText('SQ-001')).not.toBeInTheDocument())
    expect(screen.getByText('SQ-002')).toBeInTheDocument()
  })

  it('新增保存后在列表显示，编辑同一记录后更新而不新增一行', async () => {
    render(<SampleRequestPage />)
    fireEvent.click(await screen.findByRole('button', {name: '新增'}))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('编号'), {target: {value: 'SQ-NEW'}})
    fireEvent.change(within(dialog).getByLabelText('申请标题'), {target: {value: '新增测试申请'}})
    fireEvent.click(within(dialog).getByRole('button', {name: '保存'}))
    const code = await screen.findByText('SQ-NEW')
    const row = code.closest('tr')!
    expect(within(row).getByText('新增测试申请')).toBeInTheDocument()
    fireEvent.click(within(row).getByRole('button', {name: '编辑'}))
    const editDialog = await screen.findByRole('dialog')
    fireEvent.change(within(editDialog).getByLabelText('申请标题'), {target: {value: '编辑测试申请'}})
    fireEvent.click(within(editDialog).getByRole('button', {name: '保存'}))
    expect(await screen.findByText('编辑测试申请')).toBeInTheDocument()
    expect(screen.getAllByText('SQ-NEW')).toHaveLength(1)
  })
})
