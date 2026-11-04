const messages = {
  page: '申请单示例', mock: '模拟数据 · 保存仅在当前页面有效', add: '新增',
  view: '查看', edit: '编辑', remove: '删除', operation: '操作', code: '编号',
  title: '申请标题', save: '保存', back: '返回', required: '请填写此项', confirm: '确认删除？', search: '搜索编号或标题',
  flow: '模拟审批', flowNotice: '模拟审批：只演示同意与退回，不连接真实 BPM 服务。',
  agree: '同意', disagree: '退回', approved: '模拟已通过', returned: '模拟已退回', pending: '待模拟审批',
  status: '模拟流程状态', flowSummary: '申请单模拟审批', flowDone: '模拟办理完成', flowUnsupported: '此能力未纳入模拟范围',
} as const

export const t = (key: keyof typeof messages) => messages[key]
