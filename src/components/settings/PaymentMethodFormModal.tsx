import { useEffect, useState } from 'react'
import { Modal, Row, Col, Input, Switch, Typography, Space } from 'antd'
import type { PaymentMethod } from '@/types/paymentMethod'

const { Text } = Typography

interface PaymentMethodFormModalProps {
  open: boolean
  onClose: () => void
  paymentMethod: PaymentMethod | null
  onSubmit: (payload: { name: string; account_number?: string | null; is_active?: boolean }) => void
  isSubmitting: boolean
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Space direction="vertical" size={4} style={{ width: '100%' }}>
      <Text style={{ fontSize: 12 }} type="secondary">
        {label}
      </Text>
      {children}
    </Space>
  )
}

export function PaymentMethodFormModal({
  open,
  onClose,
  paymentMethod,
  onSubmit,
  isSubmitting,
}: PaymentMethodFormModalProps) {
  const [name, setName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (!open) return
    setName(paymentMethod?.name ?? '')
    setAccountNumber(paymentMethod?.account_number ?? '')
    setIsActive(paymentMethod?.is_active ?? true)
  }, [open, paymentMethod])

  function handleSubmit() {
    if (!name.trim()) return
    onSubmit({
      name: name.trim(),
      account_number: accountNumber.trim() || null,
      is_active: isActive,
    })
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={paymentMethod ? 'تعديل طريقة الدفع' : 'طريقة دفع جديدة'}
      okText="حفظ"
      cancelText="إلغاء"
      onOk={handleSubmit}
      confirmLoading={isSubmitting}
      okButtonProps={{ disabled: !name.trim() }}
    >
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <FieldLabel label="اسم طريقة الدفع">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: نقدي، بنك الخرطوم" />
          </FieldLabel>
        </Col>
        <Col span={24}>
          <FieldLabel label="رقم الحساب">
            <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="رقم الحساب (اختياري)" />
          </FieldLabel>
        </Col>
        <Col span={24}>
          <Space>
            <Switch checked={isActive} onChange={setIsActive} />
            <Text>فعّالة</Text>
          </Space>
        </Col>
      </Row>
    </Modal>
  )
}
