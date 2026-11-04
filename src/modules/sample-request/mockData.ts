export interface SampleRequest { id: string; code: string; title: string; flowStatus?: 'approved' | 'returned' }

export const createMockRequests = (): SampleRequest[] => [
  {id: 'mock-1', code: 'SQ-001', title: '办公设备采购'},
  {id: 'mock-2', code: 'SQ-002', title: '项目差旅申请'},
]
