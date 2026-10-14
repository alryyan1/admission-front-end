import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Modal, Row, Col, Input, InputNumber, Select, DatePicker, Typography, Space, Button, Divider } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import { getPaymentMethods } from '@/services/paymentMethodService'
import { getExpenseCategories } from '@/services/expenseService'
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
  const [newCategoryName, setNewCategoryName] = useState('')

  const paymentMethodsQuery = useQuery({ queryKey: ['payment-methods'], queryFn: getPaymentMethods, enabled: open })
  const activePaymentMethods = (paymentMethodsQuery.data ?? []).filter((pm) => pm.is_active)
  const categoriesQuery = useQuery({ queryKey: ['expenses', 'categories'], queryFn: getExpenseCategories, enabled: open })
  const categoryOptions = Array.from(new Set([...EXPENSE_CATEGORIES, ...(categoriesQuery.data ?? [])]))

  useEffect(() => {
    if (!open) return
    setDate(expense ? dayjs(expense.expense_date) : dayjs())
    setCategory(expense?.category)
    setDescription(expense?.description ?? '')
    setAmount(expense?.amount ?? null)
    setNewCategoryName('')
    if (expense) {
      setPaymentMethodId(expense.payment_method_id ?? undefined)
      return
    }
    // New expenses default to the bank payment method, matching the deposit form's convention.
    // Re-runs once payment methods finish loading, since they may not be ready on the first pass.
    const preferred = activePaymentMethods.find((pm) => pm.name === 'بنكك')
    setPaymentMethodId(preferred?.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, expense, activePaymentMethods.length])

  function handleAddCategory() {
    const trimmed = newCategoryName.trim()
    if (!trimmed) return
    setCategory(trimmed)
    setNewCategoryName('')
  }

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
              className="amount-input"
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
              placeholder="اختر تصنيفاً"
              value={category}
              onChange={setCategory}
              options={categoryOptions.map((c) => ({ label: c, value: c }))}
              popupRender={(menu) => (
                <>
                  {menu}
                  <Divider style={{ margin: '8px 0' }} />
                  <Space style={{ padding: '0 8px 4px' }}>
                    <Input
                      placeholder="تصنيف جديد"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddCategory()
                        }
                      }}
                    />
                    <Button
                      type="text"
                      icon={<PlusOutlined />}
                      onClick={handleAddCategory}
                      disabled={!newCategoryName.trim()}
                    >
                      إضافة
                    </Button>
                  </Space>
                </>
              )}
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
