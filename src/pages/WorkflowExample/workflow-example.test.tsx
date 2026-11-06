import { App as SuidApp } from '@ead/suid'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import * as bpm from '../../mocks/bpm'
import WorkflowExampleDetail from './Detail'
import WorkflowExampleList from './index'
import { findByPage, resetWorkflowStore } from './service'

/**
 * 流程示例回归：列表渲染与流程状态展示、列表到表单的跳转，
 * 以及 BPM 契约模拟（发起 → 审批中 → 逐节点办理 → 结束）的状态流转。
 *
 * `WorkFlow` 组件本身依赖浏览器端的 MSW Service Worker，jsdom 里不渲染，
 * 这里直接对 `src/mocks/bpm.ts` 的契约函数做断言。
 */

beforeEach(() => {
  resetWorkflowStore()
})

afterEach(() => {
  cleanup()
  window.location.hash = '#/workflow-example'
})

describe('流程示例列表页', () => {
  it('渲染演示单据与流程状态', async () => {
    render(
      <SuidApp>
        <WorkflowExampleList />
      </SuidApp>,
    )

    expect(await screen.findByText('EX-2026-001')).toBeInTheDocument()
    expect(screen.getByText('审批中')).toBeInTheDocument()
    expect(screen.getByText('已通过')).toBeInTheDocument()
    expect(screen.getByText('已驳回')).toBeInTheDocument()
  })

  it('新建入口跳转到表单路由', async () => {
    render(
      <SuidApp>
        <WorkflowExampleList />
      </SuidApp>,
    )

    fireEvent.click(await screen.findByRole('button', { name: /新建/ }))

    await waitFor(() => expect(window.location.hash).toBe('#/workflow-example/form'))
  })

  it('按流程状态过滤演示单据', async () => {
    const processing = await findByPage({ flowStatus: 'PROCESSING' })
    expect(processing.data?.total).toBe(1)
    expect(processing.data?.list[0].code).toBe('EX-2026-001')

    const draft = await findByPage({ flowStatus: 'INIT' })
    expect(draft.data?.list[0].code).toBe('EX-2026-002')
  })
})

describe('流程示例详情页', () => {
  it('只读展示单据内容', async () => {
    window.location.hash = '#/workflow-example/detail?id=wf-1'
    render(
      <SuidApp>
        <WorkflowExampleDetail />
      </SuidApp>,
    )

    expect(await screen.findByDisplayValue('华东区差旅费用报销')).toBeInTheDocument()
    expect(screen.getByText('EX-2026-001')).toBeInTheDocument()
  })
})

describe('BPM 契约模拟', () => {
  it('发起流程后进入审批中，逐节点同意后流程结束', () => {
    const started = bpm.startBpmFlow({
      businessId: 'wf-2',
      businessEntityCode: 'EXPENSE_REQUEST',
      flowDefinitionId: 'flow-def-expense',
    })
    expect(started.success).toBe(true)

    const first = bpm.getFlowSummary('wf-2')
    expect(first.status).toBe('PROCESSING')
    expect(first.currentNodeName).toBe('部门审批')
    expect(first.taskId).toBeTruthy()

    const agreed = bpm.handleBpmFlow({ taskId: first.taskId!, opinion: '同意', buttonCode: 'AGREE' })
    expect(agreed.success).toBe(true)

    const second = bpm.getFlowSummary('wf-2')
    expect(second.status).toBe('PROCESSING')
    expect(second.currentNodeName).toBe('财务审批')

    bpm.handleBpmFlow({ taskId: second.taskId!, opinion: '同意', buttonCode: 'AGREE' })
    expect(bpm.getFlowSummary('wf-2').status).toBe('APPROVED')
  })

  it('不同意时流程终止在已驳回', () => {
    const summary = bpm.getFlowSummary('wf-1')
    bpm.handleBpmFlow({ taskId: summary.taskId!, opinion: '材料不全', buttonCode: 'DISAGREE' })
    expect(bpm.getFlowSummary('wf-1').status).toBe('REJECTED')
  })

  it('终止流程后单据状态变为已终止', () => {
    const res = bpm.checkAndEndByBusinessId({ businessId: 'wf-1', terminateReason: '预算调整' })
    expect(res.success).toBe(true)
    expect(bpm.getFlowSummary('wf-1').status).toBe('ENDED')
  })
})
