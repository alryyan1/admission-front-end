import { useState } from 'react'
import { Card, Input, Button, Listy, Tag, Typography, Flex, Space } from 'antd'
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
        {orders.length === 0 ? (
          <Text type="secondary">لا توجد أوامر طبية بعد</Text>
        ) : (
          <Listy
            items={orders}
            rowKey="id"
            itemRender={(order, index) => (
              <Flex
                justify="space-between"
                align="center"
                gap={16}
                style={{
                  padding: '12px 0',
                  borderTop: index > 0 ? '1px solid rgba(0,0,0,0.06)' : undefined,
                }}
              >
                <div>
                  <Text>{order.order_text}</Text>
                  <div>
                    <Space size={8}>
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        {[order.frequency, order.route].filter(Boolean).join(' · ')}
                      </Text>
                      {order.doses && order.doses.length > 0 && <Tag>{order.doses.length} جرعة مسجّلة</Tag>}
                    </Space>
                  </div>
                </div>
                <Button size="small" onClick={() => onAddDose(order.id, { status: 'given' })}>
                  تسجيل جرعة
                </Button>
              </Flex>
            )}
          />
        )}
      </Card>
    </Space>
  )
}
