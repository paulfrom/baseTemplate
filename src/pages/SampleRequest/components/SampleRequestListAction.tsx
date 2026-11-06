import { ActionButton, Popconfirm, Space } from '@ead/suid'
import { DeleteOutlined, EditOutlined, EyeOutlined } from '@ead/suid-icons'
import { getIntl } from '../../../utils/intl'
import type { SampleRequestRecord } from '../service'

/**
 * 行操作，迁自公司模板 `src/pages/SampleRequest/components/SampleRequestListAction.jsx`。
 * 模板外层包 `AuthAction`；原型不做权限校验，直接渲染按钮，
 * 权限码见 `../constants.ts`，接入真实项目时再套回 `AuthAction`。
 */
export default function SampleRequestListAction({
  record,
  onView,
  onEdit,
  onDelete,
  deleting,
}: {
  record: SampleRequestRecord
  onView: (record: SampleRequestRecord) => void
  onEdit: (record: SampleRequestRecord) => void
  onDelete: (record: SampleRequestRecord) => void
  deleting: boolean
}) {
  const { formatMessage: t } = getIntl()

  return (
    <Space size={4}>
      <ActionButton
        title={t({ id: 'sampleRequest.view' })}
        icon={<EyeOutlined />}
        onClick={() => onView(record)}
      />
      <ActionButton
        title={t({ id: 'global.edit' })}
        icon={<EditOutlined />}
        onClick={() => onEdit(record)}
      />
      <Popconfirm
        title={t({ id: 'global.delete.confirm' })}
        onConfirm={() => onDelete(record)}
        disabled={deleting}
      >
        <ActionButton
          title={t({ id: 'global.delete' })}
          icon={<DeleteOutlined />}
          disabled={deleting}
        />
      </Popconfirm>
    </Space>
  )
}
