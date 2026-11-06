import { App as SuidApp } from '@ead/suid'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import SampleRequestList from './index'
import { deleteById, findByPage, findOne, resetSampleRequestStore, save } from './service'

/**
 * 申请单示例回归：列表渲染、新建入口跳转，以及 mock 服务的增删改查语义。
 * 列表页依赖 antd 的 App 上下文（message），这里显式包一层。
 */

beforeEach(() => {
  resetSampleRequestStore()
})

afterEach(() => {
  cleanup()
  window.location.hash = '#/sample-request'
})

describe('sample request list page', () => {
  it('renders the mock rows and the add action', async () => {
    render(
      <SuidApp>
        <SampleRequestList />
      </SuidApp>,
    )

    expect(await screen.findByText('SQ-001')).toBeInTheDocument()
    expect(screen.getByText('SQ-002')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /新建/ })).toBeInTheDocument()
  })

  it('opens the standalone form route from the add action', async () => {
    render(
      <SuidApp>
        <SampleRequestList />
      </SuidApp>,
    )

    fireEvent.click(await screen.findByRole('button', { name: /新建/ }))

    await waitFor(() => expect(window.location.hash).toBe('#/sample-request/form'))
  })
})

describe('sample request mock service', () => {
  it('creates, reads, updates and deletes a record', async () => {
    const created = await save({ code: ' SQ-900 ', title: ' 新申请 ' })
    expect(created.success).toBe(true)
    const id = created.data?.id as string
    expect(created.data).toMatchObject({ code: 'SQ-900', title: '新申请' })

    const found = await findOne(id)
    expect(found.data).toMatchObject({ code: 'SQ-900' })

    const updated = await save({ id, code: 'SQ-901', title: '改名后' })
    expect(updated.data).toMatchObject({ code: 'SQ-901', title: '改名后' })

    const page = await findByPage()
    expect(page.data?.total).toBe(4)

    await deleteById(id)
    const afterDelete = await findByPage()
    expect(afterDelete.data?.total).toBe(3)
    expect((await findOne(id)).success).toBe(false)
  })

  it('rejects duplicated codes', async () => {
    const duplicated = await save({ code: 'SQ-001', title: '重复编号' })
    expect(duplicated.success).toBe(false)
  })
})
