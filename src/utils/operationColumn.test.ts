import {describe, expect, it} from 'vitest'
import {getOperationColumnWidth} from './operationColumn'

describe('公司模板操作列宽规则', () => {
  it('按最大可见操作数计算宽度并处理越界输入', () => {
    expect(getOperationColumnWidth(1)).toBe(64)
    expect(getOperationColumnWidth(4)).toBe(148)
    expect(getOperationColumnWidth(7)).toBe(232)
    expect(getOperationColumnWidth(0)).toBe(64)
    expect(getOperationColumnWidth(Number.NaN)).toBe(64)
  })
})
