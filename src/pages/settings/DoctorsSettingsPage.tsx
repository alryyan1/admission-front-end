import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ConfigProvider, Card, Button, Table, Tag, Popconfirm, Typography, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useAntTheme } from '@/lib/antdTheme'
import { getDoctors, createDoctor, updateDoctor, deleteDoctor } from '@/services/patientService'
import { DoctorFormModal } from '@/components/settings/DoctorFormModal'
import type { Doctor } from '@/types/patient'

const { Title } = Typography

export function DoctorsSettingsPage() {
  const antTheme = useAntTheme()
  const queryClient = useQueryClient()
  const [doctorModal, setDoctorModal] = useState<{ open: boolean; doctor: Doctor | null }>({
    open: false,
    doctor: null,
  })

  const doctorsQuery = useQuery({ queryKey: ['doctors'], queryFn: () => getDoctors() })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['doctors'] })
  }

  const saveDoctorMutation = useMutation({
    mutationFn: (payload: Parameters<typeof createDoctor>[0] & { id?: number }) => {
      const { id, ...data } = payload
      return id ? updateDoctor(id, data) : createDoctor(data)
    },
    onSuccess: () => {
      toast.success('تم حفظ الطبيب')
      invalidate()
      setDoctorModal({ open: false, doctor: null })
    },
  })

  const deleteDoctorMutation = useMutation({
    mutationFn: deleteDoctor,
    onSuccess: () => {
      toast.success('تم حذف الطبيب')
      invalidate()
    },
  })

  const columns: ColumnsType<Doctor> = [
    { title: 'المعرف', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'الاسم', dataIndex: 'name', key: 'name' },
    { title: 'الدور', key: 'role', render: (_, d) => <Tag>{d.role?.name ?? '—'}</Tag> },
    { title: 'التخصص', key: 'specialist', render: (_, d) => d.specialist?.name ?? '—' },
    {
      title: '',
      key: 'actions',
      render: (_, d) => (
        <Space size={4}>
          <Button size="small" onClick={() => setDoctorModal({ open: true, doctor: d })}>
            تعديل
          </Button>
          <Popconfirm
            title="حذف الطبيب؟"
            description="لا يمكن التراجع عن هذا الإجراء."
            onConfirm={() => deleteDoctorMutation.mutate(d.id)}
          >
            <Button size="small" danger>
              حذف
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <ConfigProvider direction="rtl" theme={antTheme}>
      <Title level={3} style={{ margin: '0 0 16px' }}>
        الأطباء
      </Title>

      <Card
        title="قائمة الأطباء"
        extra={
          <Button type="primary" onClick={() => setDoctorModal({ open: true, doctor: null })}>
            + طبيب جديد
          </Button>
        }
      >
        <Table
          rowKey="id"
          loading={doctorsQuery.isLoading}
          columns={columns}
          dataSource={[...(doctorsQuery.data ?? [])].sort((a, b) => b.id - a.id)}
          pagination={false}
        />
      </Card>

      <DoctorFormModal
        open={doctorModal.open}
        onClose={() => setDoctorModal({ open: false, doctor: null })}
        doctor={doctorModal.doctor}
        onSubmit={(payload) => saveDoctorMutation.mutate({ ...payload, id: doctorModal.doctor?.id })}
        isSubmitting={saveDoctorMutation.isPending}
      />
    </ConfigProvider>
  )
}
