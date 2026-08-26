import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Modal, Row, Col, Input, InputNumber, Select, DatePicker, Typography, Space } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { getPaymentMethods } from '@/services/paymentMethodService'
import type { Expense } from '@/types/expense'
import type { ExpensePayload } from '@/services/expenseService'

const { Text } = Typography
const { TextArea } = Input

export const EXPENSE_CATEGORIES = [
  'رواتب',
  'إيجار',
  'كهرباء وماء',
  'صيانة',
  'مستلزمات طبية',
  'مستلزمات مكتبية',
  'نظافة',
  'مواصلات',
  'ضيافة',
  'أخرى',
]

interface ExpenseFormModalProps {
  open: boolean
  onClose: () => void
  expense: Expense | null
  onSubmit: (payload: ExpensePayload) => void
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

export function ExpenseFormModal({ open, onClose, expense, onSubmit, isSubmitting }: ExpenseFormModalProps) {
  const [date, setDate] = useState<Dayjs>(dayjs())
  const [category, setCategory] = useState<string | undefined>(undefined)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState<number | null>(null)
  const [paymentMethodId, setPaymentMethodId] = useState<number | undefined>(undefined)

  const paymentMethodsQuery = useQuery({ queryKey: ['payment-methods'], queryFn: getPaymentMethods, enabled: open })
  const activePaymentMethods = (paymentMethodsQuery.data ?? []).filter((pm) => pm.is_active)

  useEffect(() => {
    if (!open) return
    setDate(expense ? dayjs(expense.expense_date) : dayjs())
    setCategory(expense?.category)
    setDescription(expense?.description ?? '')
    setAmount(expense?.amount ?? null)
    setPaymentMethodId(expense?.payment_method_id ?? undefined)
  }, [open, expense])

  function handleSubmit() {
    if (!category?.trim() || amount === null) return
    onSubmit({
      expense_date: date.format('YYYY-MM-DD'),
      category: category.trim(),
      description: description.trim() || null,
      amount,
      payment_method_id: paymentMethodId ?? null,
    })
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={expense ? 'تعديل المصروف' : 'مصروف جديد'}
      okText="حفظ"
      cancelText="إلغاء"
      onOk={handleSubmit}
      confirmLoading={isSubmitting}
      okButtonProps={{ disabled: !category?.trim() || amount === null }}
    >
      <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
        <Col span={12}>
          <FieldLabel label="التاريخ">
            <DatePicker
              style={{ width: '100%' }}
              value={date}
              onChange={(v) => v && setDate(v)}
              allowClear={false}
              format="YYYY-MM-DD"
            />
          </FieldLabel>
        </Col>
        <Col span={12}>
          <FieldLabel label="المبلغ">
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              value={amount}
              onChange={(v) => setAmount(v === null ? null : Number(v))}
            />
          </FieldLabel>
        </Col>
        <Col span={12}>
          <FieldLabel label="التصنيف">
            <Select
              style={{ width: '100%' }}
              mode="tags"
              maxCount={1}
              placeholder="اختر أو اكتب تصنيفاً"
              value={category ? [category] : []}
              onChange={(values) => setCategory(values[values.length - 1])}
              options={EXPENSE_CATEGORIES.map((c) => ({ label: c, value: c }))}
            />
          </FieldLabel>
        </Col>
        <Col span={12}>
          <FieldLabel label="طريقة الدفع">
            <Select
              style={{ width: '100%' }}
              allowClear
              placeholder="بدون تحديد"
              loading={paymentMethodsQuery.isLoading}
              value={paymentMethodId}
              onChange={(v) => setPaymentMethodId(v ?? undefined)}
              options={activePaymentMethods.map((pm) => ({ label: pm.name, value: pm.id }))}
            />
          </FieldLabel>
        </Col>
        <Col span={24}>
          <FieldLabel label="ملاحظات">
            <TextArea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </FieldLabel>
        </Col>
      </Row>
    </Modal>
  )
}
