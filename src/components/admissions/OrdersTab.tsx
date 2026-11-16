import { useState } from 'react'
import { Card, Input, Button, Table, Tag, Typography, Flex, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { DoctorOrder } from '@/types/admission'

const { Text } = Typography

interface OrdersTabProps {
  orders: DoctorOrder[]
  onAddOrder: (payload: { order_text: string; frequency?: string; route?: string }) => void
  onAddDose: (orderId: number, payload: { status?: 'given' | 'missed' | 'refused' }) => void
  isSubmittingOrder: boolean
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Space direction="vertical" size={4}>
      <Text style={{ fontSize: 12 }} type="secondary">
        {label}
      </Text>
      {children}
    </Space>
  )
}

export function OrdersTab({ orders, onAddOrder, onAddDose, isSubmittingOrder }: OrdersTabProps) {
  const [orderText, setOrderText] = useState('')
  const [frequency, setFrequency] = useState('')
  const [route, setRoute] = useState('')

  function handleSubmit() {
    if (!orderText.trim()) return
    onAddOrder({ order_text: orderText, frequency: frequency || undefined, route: route || undefined })
    setOrderText('')
    setFrequency('')
    setRoute('')
  }

  const columns: ColumnsType<DoctorOrder> = [
    { title: 'الأمر / الدواء', dataIndex: 'order_text', key: 'order_text' },
    {
      title: 'التكرار / الطريقة',
      key: 'frequency',
      render: (_, order) => [order.frequency, order.route].filter(Boolean).join(' · ') || '—',
    },
    {
      title: 'الجرعات',
      key: 'doses',
      render: (_, order) => (order.doses && order.doses.length > 0 ? <Tag>{order.doses.length} جرعة مسجّلة</Tag> : '—'),
    },
    {
      title: '',
      key: 'action',
      render: (_, order) => (
        <Button size="small" onClick={() => onAddDose(order.id, { status: 'given' })}>
          تسجيل جرعة
        </Button>
      ),
    },
  ]

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card title="أمر طبي جديد">
        <Flex wrap="wrap" align="flex-end" gap={12}>
          <FieldLabel label="الأمر / الدواء">
            <Input style={{ width: 224 }} value={orderText} onChange={(e) => setOrderText(e.target.value)} />
          </FieldLabel>
          <FieldLabel label="التكرار">
            <Input style={{ width: 128 }} value={frequency} onChange={(e) => setFrequency(e.target.value)} />
          </FieldLabel>
          <FieldLabel label="طريقة الإعطاء">
            <Input style={{ width: 128 }} value={route} onChange={(e) => setRoute(e.target.value)} />
          </FieldLabel>
          <Button type="primary" onClick={handleSubmit} loading={isSubmittingOrder}>
            إضافة
          </Button>
        </Flex>
      </Card>

      <Card>
        <Table
          size="small"
          rowKey="id"
          columns={columns}
          dataSource={orders}
          pagination={false}
          locale={{ emptyText: 'لا توجد أوامر طبية بعد' }}
        />
      </Card>
    </Space>
  )
}
