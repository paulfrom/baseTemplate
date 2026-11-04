import {useEffect, useRef, useState} from 'react'
import {Button, Card, ExtTable, Modal, Typography, type ExtTableRef} from '@ead/suid'
import {PlusOutlined} from '@ead/suid-icons'
import {getOperationColumnWidth} from '../../utils/operationColumn'
import {createMockRequests, type SampleRequest} from './mockData'
import {RequestForm} from './RequestForm'
import {MODULE_ACTION} from './constants'
import {t} from './messages'
import {RequestApproval} from './RequestApproval'
import {OPERATION_COLUMN_MAX_COUNT, SampleRequestListAction} from './components/SampleRequestListAction'

export function SampleRequestPage() {
  const [records, setRecords] = useState(createMockRequests)
  const tableRef = useRef<ExtTableRef>(null)
  const [editor, setEditor] = useState<{record: SampleRequest; readOnly: boolean} | null>(null)
  const [approval, setApproval] = useState<SampleRequest | null>(null)
  useEffect(() => {
    const keyword = tableRef.current?.getQuickSearchValue()
    if (keyword) tableRef.current?.quickSearch(keyword)
  }, [records])
  const close = () => setEditor(null)
  const save = (record: SampleRequest) => {
    setRecords(current => current.some(item => item.id === record.id)
      ? current.map(item => item.id === record.id ? record : item) : [record, ...current])
    close()
  }
  if (approval) return <RequestApproval record={approval} onBack={() => setApproval(null)} onComplete={record => {
    setRecords(current => current.map(item => item.id === record.id ? record : item))
    setApproval(null)
  }} />
  return <div className="prototype-page sample-request-page">
    <Card className="prototype-panel prototype-table-panel" title={t('page')}
      extra={<Typography.Text type="secondary">{t('mock')}</Typography.Text>}>
    <ExtTable ref={tableRef} rowKey="id" dataSource={records} showQuickSearch searchRealTime
      storageCfg={{storageType: 'local', storageId: 'sample-request', rowColumn: false, dataView: false}}
      quickSearchPlaceHolder={t('search')}
      quickSearchFields={[{field: 'code', title: t('code')}, {field: 'title', title: t('title')}]}
      toolbar={{left: <Button type="primary" aria-label={t('add')} icon={<PlusOutlined />} onClick={() => setEditor({
        record: {id: crypto.randomUUID(), code: '', title: ''}, readOnly: false,
      })}>{t('add')}</Button>}}
      columns={[
        {title: t('operation'), dataIndex: 'id', fixed: 'left',
          width: getOperationColumnWidth(OPERATION_COLUMN_MAX_COUNT),
          render: (_: unknown, record: SampleRequest) => <SampleRequestListAction record={record}
            onView={item => setEditor({record: item, readOnly: true})}
            onEdit={item => setEditor({record: item, readOnly: false})}
            onApprove={setApproval}
            onDelete={item => setRecords(current => current.filter(row => row.id !== item.id))} />},
        {title: t('code'), dataIndex: 'code', width: 160},
        {title: t('status'), dataIndex: 'flowStatus', width: 160, render: (value: SampleRequest['flowStatus']) => t(value ?? 'pending')},
        {title: t('title'), dataIndex: 'title', expandUnusedSpace: true},
      ]} />
    <Modal open={!!editor} title={editor?.readOnly ? t('view') : t('edit')} footer={null} onCancel={close} destroyOnHidden>
      {editor && <RequestForm key={editor.record.id} record={editor.record}
        action={editor.readOnly ? MODULE_ACTION.LINK_VIEW : undefined}
        onSave={save} onBack={close} />}
    </Modal>
    </Card>
  </div>
}

export default SampleRequestPage
