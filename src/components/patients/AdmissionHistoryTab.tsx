import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, Table, Tag, Button, Popconfirm, Tooltip } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { toast } from 'sonner'
import type { ColumnsType } from 'antd/es/table'
import { formatDateTime } from '@/lib/utils'
import { registerAdmission } from '@/services/admissionService'
import type { Admission } from '@/types/admission'

interface AdmissionHistoryTabProps {
  patientId: number
  admissions: Admission[] | undefined
  isLoading: boolean
}

const STATUS_LABEL: Record<string, string> = {
  admitted: 'نشطة',
  discharged: 'مخرّجة',
  cancelled: 'ملغاة',
}

export function AdmissionHistoryTab({ patientId, admissions, isLoading }: AdmissionHistoryTabProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const hasActiveAdmission = (admissions ?? []).some((admission) => admission.status === 'admitted')

  const registerMutation = useMutation({
    mutationFn: () => registerAdmission(patientId),
    onSuccess: (admission) => {
      toast.success('تم فتح تنويم جديد لهذا المريض')
      queryClient.invalidateQueries({ queryKey: ['admissions'] })
      queryClient.invalidateQueries({ queryKey: ['patient', patientId, 'admissions'] })
      navigate(`/admissions/${admission.id}`)
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'تعذر فتح تنويم جديد'
      toast.error(message)
    },
  })

  const columns: ColumnsType<Admission> = [
    { title: 'رقم التنويم', dataIndex: 'admission_number', key: 'admission_number', render: (v) => v ?? '—' },
    {
      title: 'السرير',
      key: 'bed',
      render: (_, admission) =>
        admission.bed
          ? `${admission.bed.room?.ward?.name ?? ''} — غرفة ${admission.bed.room?.room_number ?? ''} — سرير ${admission.bed.bed_number}`
          : 'لم يتم تعيين السرير',
    },
    {
      title: 'الطبيب المعالج',
      key: 'doctor',
      render: (_, admission) => admission.patient?.admitting_doctor?.name ?? '—',
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
    <Card
      size="small"
      title="سجل التنويمات"
      extra={
        <Tooltip title={hasActiveAdmission ? 'يوجد تنويم نشط بالفعل لهذا المريض' : ''}>
          <Popconfirm
            title="فتح تنويم جديد؟"
            description="سيتم فتح تنويم نشط بدون سرير، يمكن تعيين السرير بعد ذلك."
            okText="نعم، فتح"
            cancelText="تراجع"
            disabled={hasActiveAdmission}
            onConfirm={() => registerMutation.mutate()}
          >
            <Button
              size="small"
              type="primary"
              icon={<PlusOutlined />}
              disabled={hasActiveAdmission}
              loading={registerMutation.isPending}
            >
              تنويم جديد
            </Button>
          </Popconfirm>
        </Tooltip>
      }
    >
      <Table
        size="small"
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={admissions ?? []}
        pagination={false}
        onRow={(admission) => ({
          className: 'cursor-pointer',
          onClick: () => navigate(`/admissions?admission_id=${admission.id}`),
        })}
      />
    </Card>
  )
}
