/** 行内操作按钮间距，与公司模板保持一致。 */
export const OPERATION_ACTION_GAP = 4

const OPERATION_COLUMN_WIDTH_BY_COUNT: Record<number, number> = {
  1: 64,
  2: 92,
  3: 120,
  4: 148,
  5: 176,
  6: 204,
}

/** 按单行最大可见图标操作数预留列宽：64 + (n - 1) * 28。 */
export function getOperationColumnWidth(count: number) {
  const safe = Number.isFinite(count) && count > 0 ? Math.floor(count) : 1
  return OPERATION_COLUMN_WIDTH_BY_COUNT[safe]
    ?? OPERATION_COLUMN_WIDTH_BY_COUNT[6] + (safe - 6) * 28
}
