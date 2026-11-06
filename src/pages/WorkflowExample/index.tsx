import { Button, ExtTable, FilterView, Tooltip, type ExtTableRef } from '@ead/suid'
import { PlusOutlined, ReloadOutlined } from '@ead/suid-icons'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getIntl } from '../../utils/intl'
import { history } from '../../utils/navigation'
import { getOperationColumnWidth } from '../../utils/operationColumn'
import FlowStatusTag from './components/FlowStatusTag'
import WorkflowExampleListAction from './components/WorkflowExampleListAction'
import { FLOW_STATUS_FILTER_KEYS } from './constants'
import { findByPage, type WorkflowRecordView } from './service'
import './workflow-example.css'

/**
 * 流程示例（费用申请单）列表。
 *
 * 参照公司模板 `src/pages/Project/ProjectApply/index.jsx`：
 * 列表用 SUID `ExtTable` + 行操作组件，工具栏左侧放「新建」与流程状态筛选，
 * 行操作按流程状态显隐——草稿可编辑，审批中可办理与终止流程。
 */
export default function WorkflowExampleList() {
  const tableRef = useRef<ExtTableRef>(null)
  const { formatMessage: t } = getIntl()
  const [records, setRecords] = useState<WorkflowRecordView[]>([])
  const [flowStatus, setFlowStatus] = useState<string>('ALL')
  const [loading, setLoading] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const res = await findByPage({ flowStatus })
      setRecords(res.data?.list ?? [])
    } finally {
      setLoading(false)
    }
  }, [flowStatus])

  useEffect(() => {
    void reload()
  }, [reload])

  // 数据变化后重放快速搜索关键字，避免流程流转后筛选条件丢失。
  useEffect(() => {
    const keyword = tableRef.current?.getQuickSearchValue()
    if (keyword) tableRef.current?.quickSearch(keyword)
  }, [records])

  const openForm = (record: WorkflowRecordView) => {
    history.push(`/workflow-example/form?id=${encodeURIComponent(record.id)}`)
  }

  const openDetail = (record: WorkflowRecordView) => {
    history.push(`/workflow-example/detail?id=${encodeURIComponent(record.id)}`)
  }

  const openApprove = (record: WorkflowRecordView) => {
    const params = new URLSearchParams({
      id: record.id,
      taskId: record.flowTaskId ?? '',
      instanceId: record.flowInstanceId ?? '',
    })
    history.push(`/workflow-example/approve?${params.toString()}`)
  }

  const flowStatusFilters = FLOW_STATUS_FILTER_KEYS.map((key) => ({
    key,
    title:
      key === 'ALL'
        ? t({ id: 'workflowExample.flowStatus.all' })
        : t({ id: `workflowExample.flowStatus.${key.toLowerCase()}` }),
  }))

  return (
    <div className="prototype-page workflow-example-list">
      <ExtTable
        ref={tableRef}
        rowKey="id"
        loading={loading}
        dataSource={records}
        showQuickSearch
        searchRealTime
        storageCfg={{
          storageType: 'local',
          storageId: 'workflow-example',
          rowColumn: false,
          dataView: false,
        }}
        quickSearchFields={[
          { field: 'code', title: t({ id: 'workflowExample.code' }) },
          { field: 'title', title: t({ id: 'workflowExample.title' }) },
          { field: 'applicant', title: t({ id: 'workflowExample.applicant' }) },
        ]}
        quickSearchPlaceHolder={t({ id: 'workflowExample.search' })}
        toolbar={{
          left: (
            <div className="workflow-example-toolbar">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => history.push('/workflow-example/form')}
              >
                {t({ id: 'global.add' })}
              </Button>
              <FilterView
                dataSource={flowStatusFilters}
                labelTitle={t({ id: 'workflowExample.flowStatus.label' })}
                defaultValue={['ALL']}
                allowClear
                onChange={(items) => {
                  setFlowStatus(items?.[0]?.key ?? 'ALL')
                }}
              />
            </div>
          ),
          right: (
            <Tooltip title={t({ id: 'global.refresh' })}>
              <Button icon={<ReloadOutlined />} onClick={() => void reload()} />
            </Tooltip>
          ),
        }}
        columns={[
          {
            title: t({ id: 'global.operation' }),
            dataIndex: 'id',
            width: getOperationColumnWidth(4),
            fixed: 'left',
            render: (_: unknown, record: WorkflowRecordView) => (
              <WorkflowExampleListAction
                record={record}
                onView={openDetail}
                onEdit={openForm}
                onApprove={openApprove}
                onFlowChanged={() => void reload()}
              />
            ),
          },
          {
            title: t({ id: 'workflowExample.code' }),
            dataIndex: 'code',
            width: 170,
            render: (value: string, record: WorkflowRecordView) => (
              <a onClick={() => openDetail(record)}>{value}</a>
            ),
          },
          {
            title: t({ id: 'workflowExample.title' }),
            dataIndex: 'title',
            expandUnusedSpace: true,
          },
          {
            title: t({ id: 'workflowExample.applicant' }),
            dataIndex: 'applicant',
            width: 110,
          },
          {
            title: t({ id: 'workflowExample.department' }),
            dataIndex: 'department',
            width: 130,
          },
          {
            title: t({ id: 'workflowExample.amount' }),
            dataIndex: 'amount',
            width: 130,
            align: 'right',
            render: (value: number) =>
              typeof value === 'number'
                ? value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })
                : '-',
          },
          {
            title: t({ id: 'workflowExample.flowStatus.label' }),
            dataIndex: 'flowStatus',
            width: 110,
            render: (value: string) => <FlowStatusTag status={value} />,
          },
        ]}
      />
    </div>
  )
}
