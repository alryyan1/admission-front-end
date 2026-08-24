import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, Button, Table, Switch, Popconfirm, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  getPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from '@/services/paymentMethodService'
import { PaymentMethodFormModal } from '@/components/settings/PaymentMethodFormModal'
import type { PaymentMethod } from '@/types/paymentMethod'

export function PaymentMethodsSettingsTab() {
  const queryClient = useQueryClient()
  const [modal, setModal] = useState<{ open: boolean; paymentMethod: PaymentMethod | null }>({
    open: false,
    paymentMethod: null,
  })

  const paymentMethodsQuery = useQuery({ queryKey: ['payment-methods'], queryFn: getPaymentMethods })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
  }

  const saveMutation = useMutation({
    mutationFn: (payload: Parameters<typeof createPaymentMethod>[0] & { id?: number }) => {
      const { id, ...data } = payload
      return id ? updatePaymentMethod(id, data) : createPaymentMethod(data)
    },
    onSuccess: () => {
      toast.success('تم حفظ طريقة الدفع')
      invalidate()
      setModal({ open: false, paymentMethod: null })
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active, name }: { id: number; is_active: boolean; name: string }) =>
      updatePaymentMethod(id, { name, is_active }),
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: deletePaymentMethod,
    onSuccess: () => {
      toast.success('تم حذف طريقة الدفع')
      invalidate()
    },
  })

  const columns: ColumnsType<PaymentMethod> = [
    { title: 'اسم طريقة الدفع', dataIndex: 'name', key: 'name' },
    { title: 'رقم الحساب', dataIndex: 'account_number', key: 'account_number', render: (v) => v ?? '—' },
    {
      title: 'الحالة',
      key: 'is_active',
      render: (_, pm) => (
        <Switch
          checked={pm.is_active}
          size="small"
          onChange={(checked) => toggleActiveMutation.mutate({ id: pm.id, is_active: checked, name: pm.name })}
        />
      ),
    },
    {
      title: '',
      key: 'actions',
      render: (_, pm) => (
        <Space size={4}>
          <Button size="small" onClick={() => setModal({ open: true, paymentMethod: pm })}>
            تعديل
          </Button>
          <Popconfirm
            title="حذف طريقة الدفع؟"
            description="لا يمكن التراجع عن هذا الإجراء."
            onConfirm={() => deleteMutation.mutate(pm.id)}
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
    <Card
      title="طرق الدفع"
      extra={
        <Button type="primary" onClick={() => setModal({ open: true, paymentMethod: null })}>
          + طريقة دفع جديدة
        </Button>
      }
    >
      <Table
        rowKey="id"
        loading={paymentMethodsQuery.isLoading}
        columns={columns}
        dataSource={paymentMethodsQuery.data ?? []}
        pagination={false}
      />

      <PaymentMethodFormModal
        open={modal.open}
        onClose={() => setModal({ open: false, paymentMethod: null })}
        paymentMethod={modal.paymentMethod}
        onSubmit={(payload) => saveMutation.mutate({ ...payload, id: modal.paymentMethod?.id })}
        isSubmitting={saveMutation.isPending}
      />
    </Card>
  )
}
