import {ActionButton, Popconfirm, Space} from '@ead/suid'
import {AuditOutlined, DeleteOutlined, EditOutlined, EyeOutlined} from '@ead/suid-icons'
import type {SampleRequest} from '../mockData'
import {t} from '../messages'

export const OPERATION_COLUMN_MAX_COUNT = 4

/** 与公司模板一致的行内图标操作组合，不包含真实权限控制。 */
export function SampleRequestListAction({record, onView, onEdit, onApprove, onDelete}: {
  record: SampleRequest
  onView: (record: SampleRequest) => void
  onEdit: (record: SampleRequest) => void
  onApprove: (record: SampleRequest) => void
  onDelete: (record: SampleRequest) => void
}) {
  if (!record.id) return null
  return <Space size={4}>
    <ActionButton title={t('view')} icon={<EyeOutlined />} onClick={() => onView(record)}
      {...{'aria-label': t('view')}} />
    <ActionButton title={t('edit')} icon={<EditOutlined />} onClick={() => onEdit(record)}
      {...{'aria-label': t('edit')}} />
    <ActionButton title={t('flow')} icon={<AuditOutlined />} onClick={() => onApprove(record)}
      {...{'aria-label': t('flow')}} />
    <Popconfirm title={t('confirm')} onConfirm={() => onDelete(record)}>
      <ActionButton title={t('remove')} color="danger" icon={<DeleteOutlined />}
        {...{'aria-label': t('remove')}} />
    </Popconfirm>
  </Space>
}
