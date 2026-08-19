import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ConfigProvider, Card, Button, Typography, Tabs, Table, Tag, Flex } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { antTheme } from '@/lib/antdTheme'
import { getAdmissions } from '@/services/admissionService'
import { NewAdmissionDialog } from '@/components/admissions/NewAdmissionDialog'
import { formatDateTime } from '@/lib/utils'
import type { Admission, AdmissionStatus } from '@/types/admission'

const { Title } = Typography

const STATUS_LABEL: Record<AdmissionStatus, string> = {
  admitted: 'نشطة',
  discharged: 'مخرّجة',
  cancelled: 'ملغاة',
}

const STATUS_TABS: { key: AdmissionStatus; label: string }[] = [
  { key: 'admitted', label: 'نشطة' },
  { key: 'discharged', label: 'مخرّجة' },
  { key: 'cancelled', label: 'ملغاة' },
]

export function AdmissionsPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<AdmissionStatus>('admitted')
  const [dialogOpen, setDialogOpen] = useState(false)

  const admissionsQuery = useQuery({
    queryKey: ['admissions', status],
    queryFn: () => getAdmissions({ status }),
  })

  const columns: ColumnsType<Admission> = [
    { title: 'رقم التنويم', dataIndex: 'admission_number', key: 'admission_number', render: (v) => v ?? '—' },
    { title: 'المريض', key: 'patient', render: (_, admission) => admission.patient?.name },
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
    <ConfigProvider direction="rtl" theme={antTheme}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          حالات التنويم
        </Title>
        <Button type="primary" onClick={() => setDialogOpen(true)}>
          + تنويم جديد
        </Button>
      </Flex>

      <Tabs
        activeKey={status}
        onChange={(key) => setStatus(key as AdmissionStatus)}
        items={STATUS_TABS.map((tab) => ({ key: tab.key, label: tab.label }))}
      />

      <Card>
        <Table
          rowKey="id"
          loading={admissionsQuery.isLoading}
          columns={columns}
          dataSource={admissionsQuery.data?.data ?? []}
          pagination={false}
          onRow={(admission) => ({
            className: 'cursor-pointer',
            onClick: () => navigate(`/admissions/${admission.id}`),
          })}
        />
      </Card>

      <NewAdmissionDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </ConfigProvider>
  )
}
