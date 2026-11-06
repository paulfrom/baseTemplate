import { App, Button, ExtTable, type ExtTableRef } from '@ead/suid'
import { PlusOutlined } from '@ead/suid-icons'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getOperationColumnWidth } from '../../utils/operationColumn'
import { getIntl } from '../../utils/intl'
import { history } from '../../utils/navigation'
import SampleRequestListAction from './components/SampleRequestListAction'
import { deleteById, findByPage, type SampleRequestRecord } from './service'

/**
 * 申请单列表，迁自公司模板 `src/pages/SampleRequest/index.jsx`。
 *
 * 差异：模板用 ExtTable 的 `store={{url}}` 远程分页；原型没有后端，
 * 改为页内 `dataSource` + 模块内 mock 服务，列表列、工具栏与行操作保持一致。
 */
export default function SampleRequestList() {
  const tableRef = useRef<ExtTableRef>(null)
  const deletingRef = useRef(new Set<string>())
  const [records, setRecords] = useState<SampleRequestRecord[]>([])
  const [deleting, setDeleting] = useState<Set<string>>(new Set())
  const { formatMessage: t } = getIntl()
  const { message } = App.useApp()

  const reload = useCallback(async () => {
    const res = await findByPage()
    setRecords(res.data?.list ?? [])
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  // 数据变化后重放快速搜索关键字，避免保存/删除后筛选条件丢失。
  useEffect(() => {
    const keyword = tableRef.current?.getQuickSearchValue()
    if (keyword) tableRef.current?.quickSearch(keyword)
  }, [records])

  const open = (record: SampleRequestRecord, detail = false) => {
    history.push(
      `/sample-request/${detail ? 'detail' : 'form'}?id=${encodeURIComponent(record.id)}`,
    )
  }

  const handleDelete = async (record: SampleRequestRecord) => {
    if (deletingRef.current.has(record.id)) return
    deletingRef.current.add(record.id)
    setDeleting(new Set(deletingRef.current))
    try {
      const res = await deleteById(record.id)
      if (!res.success) throw new Error(res.message ?? t({ id: 'sampleRequest.deleteFailed' }))
      message.success(t({ id: 'global.delete-success' }))
      await reload()
    } catch (cause) {
      message.error((cause as Error)?.message ?? t({ id: 'sampleRequest.deleteFailed' }))
    } finally {
      deletingRef.current.delete(record.id)
      setDeleting(new Set(deletingRef.current))
    }
  }

  return (
    <div className="prototype-page sample-request-page">
      <ExtTable
        ref={tableRef}
        rowKey="id"
        dataSource={records}
        showQuickSearch
        searchRealTime
        storageCfg={{
          storageType: 'local',
          storageId: 'sample-request',
          rowColumn: false,
          dataView: false,
        }}
        quickSearchFields={[
          { field: 'code', title: t({ id: 'sampleRequest.code' }) },
          { field: 'title', title: t({ id: 'sampleRequest.title' }) },
        ]}
        quickSearchPlaceHolder={t({ id: 'sampleRequest.search' })}
        toolbar={{
          left: (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => history.push('/sample-request/form')}
            >
              {t({ id: 'global.add' })}
            </Button>
          )
        }}
        columns={[
          {
            title: t({ id: 'global.operation' }),
            dataIndex: 'id',
            width: getOperationColumnWidth(3),
            fixed: 'left',
            render: (_: unknown, record: SampleRequestRecord) => (
              <SampleRequestListAction
                record={record}
                onView={(row) => open(row, true)}
                onEdit={open}
                onDelete={handleDelete}
                deleting={deleting.has(record.id)}
              />
            ),
          },
          { title: t({ id: 'sampleRequest.code' }), dataIndex: 'code', width: 180 },
          { title: t({ id: 'sampleRequest.title' }), dataIndex: 'title', expandUnusedSpace: true },
        ]}
      />
    </div>
  )
}
