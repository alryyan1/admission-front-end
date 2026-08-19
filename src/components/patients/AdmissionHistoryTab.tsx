import { useNavigate } from 'react-router-dom'
import { Card, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { formatDateTime } from '@/lib/utils'
import type { Admission } from '@/types/admission'

interface AdmissionHistoryTabProps {
  admissions: Admission[] | undefined
  isLoading: boolean
}

const STATUS_LABEL: Record<string, string> = {
  admitted: 'نشطة',
  discharged: 'مخرّجة',
  cancelled: 'ملغاة',
}

export function AdmissionHistoryTab({ admissions, isLoading }: AdmissionHistoryTabProps) {
  const navigate = useNavigate()

  const columns: ColumnsType<Admission> = [
    { title: 'رقم التنويم', dataIndex: 'admission_number', key: 'admission_number', render: (v) => v ?? '—' },
    {
      title: 'السرير',
      key: 'bed',
      render: (_, admission) =>
        `${admission.bed?.room?.ward?.name ?? ''} — غرفة ${admission.bed?.room?.room_number ?? ''} — سرير ${admission.bed?.bed_number ?? ''}`,
    },
    {
      title: 'الطبيب المعالج',
      key: 'doctor',
      render: (_, admission) => admission.admitting_doctor?.name ?? '—',
    },
    {
      title: 'تاريخ الدخول',
      key: 'admission_date',
      render: (_, admission) => formatDateTime(admission.admission_date),
    },
    {
      title: 'الحالة',
      key: 'status',
      render: (_, admission) => (
        <Tag color={admission.status === 'admitted' ? 'success' : 'default'}>
          {STATUS_LABEL[admission.status] ?? admission.status}
        </Tag>
      ),
    },
  ]

  return (
    <Card>
      <Table
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={admissions ?? []}
        pagination={false}
        onRow={(admission) => ({
          className: 'cursor-pointer',
          onClick: () => navigate(`/admissions/${admission.id}`),
        })}
      />
    </Card>
  )
}
