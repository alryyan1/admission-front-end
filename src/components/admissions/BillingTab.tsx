import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, InputNumber, Input, Select, Table, Button, Typography, Row, Col, Flex, Space, Popconfirm, Tooltip } from 'antd'
import { ThunderboltFilled } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { formatDate, formatNumber } from '@/lib/utils'
import { getServices } from '@/services/serviceService'
import { getPaymentMethods } from '@/services/paymentMethodService'
import type { AdmissionDeposit, RequestedService } from '@/types/admission'

const { Text } = Typography

interface BillingTabProps {
  services: RequestedService[]
  deposits: AdmissionDeposit[]
  isShortStayRoom: boolean
  onAddService: (payload: { name: string; quantity?: number; unit_price: number }) => void
  onAddDeposit: (payload: { amount: number; payment_method_id?: number; comment?: string }) => void
  onUpdateService: (serviceId: number, payload: { quantity?: number; unit_price?: number }) => void
  onRemoveService: (serviceId: number) => void
  onRemoveDeposit: (depositId: number) => void
  onCalculateAccommodationFee: () => void
  isSubmittingService: boolean
  isSubmittingDeposit: boolean
  isUpdatingService: boolean
  isRemovingService: boolean
  isRemovingDeposit: boolean
  isCalculatingAccommodationFee: boolean
}

function EditableNumberCell({
  value,
  min,
  disabled,
  onCommit,
}: {
  value: number
  min: number
  disabled?: boolean
  onCommit: (value: number) => void
}) {
  const [draft, setDraft] = useState<number | null>(value)

  useEffect(() => {
    setDraft(value)
  }, [value])

  function commit() {
    if (draft !== null && draft !== value) {
      onCommit(draft)
    }
  }

  return (
    <InputNumber
      className="amount-input"
      size="small"
      style={{ width: 110 }}
      min={min}
      value={draft}
      disabled={disabled}
      onChange={(v) => setDraft(v === null ? null : Number(v))}
      onBlur={commit}
      onPressEnter={commit}
    />
  )
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

export function BillingTab({
  services,
  deposits,
  isShortStayRoom,
  onAddService,
  onAddDeposit,
  onUpdateService,
  onRemoveService,
  onRemoveDeposit,
  onCalculateAccommodationFee,
  isSubmittingService,
  isSubmittingDeposit,
  isUpdatingService,
  isRemovingService,
  isRemovingDeposit,
  isCalculatingAccommodationFee,
}: BillingTabProps) {
  const catalogQuery = useQuery({ queryKey: ['services', 'active'], queryFn: () => getServices({ active_only: true }) })
  const paymentMethodsQuery = useQuery({ queryKey: ['payment-methods'], queryFn: getPaymentMethods })
  const activePaymentMethods = (paymentMethodsQuery.data ?? []).filter((pm) => pm.is_active)

  const [selectedServiceId, setSelectedServiceId] = useState<number | undefined>(undefined)
  const [quantity, setQuantity] = useState<number | null>(1)
  const [unitPrice, setUnitPrice] = useState<number | null>(null)

  const [depositAmount, setDepositAmount] = useState<number | null>(null)
  const [depositMethodId, setDepositMethodId] = useState<number | undefined>(undefined)
  const [depositComment, setDepositComment] = useState('')

  useEffect(() => {
    if (depositMethodId === undefined && activePaymentMethods.length > 0) {
      setDepositMethodId(activePaymentMethods[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePaymentMethods.length])

  function handleServiceSelect(serviceId: number) {
    setSelectedServiceId(serviceId)
    const service = (catalogQuery.data ?? []).find((s) => s.id === serviceId)
    setUnitPrice(service ? Number(service.price) : null)
  }

  function handleAddService() {
    const service = (catalogQuery.data ?? []).find((s) => s.id === selectedServiceId)
    if (!service || unitPrice === null) return
    onAddService({ name: service.name_ar, quantity: quantity ?? 1, unit_price: unitPrice })
    setSelectedServiceId(undefined)
    setQuantity(1)
    setUnitPrice(null)
  }

  function handleAddDeposit() {
    if (depositAmount === null) return
    onAddDeposit({ amount: depositAmount, payment_method_id: depositMethodId, comment: depositComment.trim() || undefined })
    setDepositAmount(null)
    setDepositComment('')
  }

  const serviceColumns: ColumnsType<RequestedService> = [
    {
      title: 'الخدمة',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, s) => (
        <Space size={6}>
          {name}
          {s.is_auto_added && (
            <Tooltip title="تمت إضافتها تلقائياً">
              <ThunderboltFilled style={{ color: '#faad14' }} />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: 'الكمية',
      key: 'quantity',
      render: (_, s) => (
        <EditableNumberCell
          value={s.quantity}
          min={1}
          disabled={isUpdatingService}
          onCommit={(quantity) => onUpdateService(s.id, { quantity })}
        />
      ),
    },
    {
      title: 'سعر الوحدة',
      key: 'unit_price',
      render: (_, s) => (
        <EditableNumberCell
          value={Number(s.unit_price)}
          min={0}
          disabled={isUpdatingService}
          onCommit={(unit_price) => onUpdateService(s.id, { unit_price })}
        />
      ),
    },
    { title: 'الإجمالي', key: 'total', render: (_, s) => formatNumber(s.total_price) },
    {
      title: '',
      key: 'actions',
      render: (_, s) => (
        <Popconfirm
          title="حذف الخدمة؟"
          description="لا يمكن التراجع عن هذا الإجراء."
          onConfirm={() => onRemoveService(s.id)}
        >
          <Button size="small" danger type="text" loading={isRemovingService}>
            إزالة
          </Button>
        </Popconfirm>
      ),
    },
  ]

  const depositColumns: ColumnsType<AdmissionDeposit> = [
    { title: 'التاريخ', key: 'paid_at', render: (_, d) => formatDate(d.paid_at) },
    { title: 'المبلغ', key: 'amount', render: (_, d) => formatNumber(d.amount) },
    { title: 'الطريقة', key: 'method', render: (_, d) => d.payment_method?.name ?? '—' },
    { title: 'ملاحظة', key: 'comment', render: (_, d) => d.comment ?? '—' },
    {
      title: '',
      key: 'actions',
      render: (_, d) => (
        <Popconfirm
          title="حذف الدفعة؟"
          description="لا يمكن التراجع عن هذا الإجراء."
          onConfirm={() => onRemoveDeposit(d.id)}
        >
          <Button size="small" danger type="text" loading={isRemovingDeposit}>
            إزالة
          </Button>
        </Popconfirm>
      ),
    },
  ]

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={12}>
        <Card
          title="الخدمات المطلوبة"
          extra={
            !isShortStayRoom && (
              <Button
                size="small"
                onClick={onCalculateAccommodationFee}
                loading={isCalculatingAccommodationFee}
              >
                احتساب رسوم الإقامة
              </Button>
            )
          }
        >
          <Flex wrap="wrap" align="flex-end" gap={8} style={{ marginBottom: 12 }}>
            <FieldLabel label="الخدمة">
              <Select
                style={{ width: 200 }}
                showSearch
                optionFilterProp="label"
                placeholder="اختر خدمة"
                loading={catalogQuery.isLoading}
                value={selectedServiceId}
                onChange={handleServiceSelect}
                options={(catalogQuery.data ?? []).map((s) => ({ label: s.name_ar, value: s.id }))}
              />
            </FieldLabel>
            <FieldLabel label="الكمية">
              <InputNumber
                style={{ width: 110 }}
                min={1}
                value={quantity}
                onChange={(v) => setQuantity(v)}
                onPressEnter={handleAddService}
              />
            </FieldLabel>
            <FieldLabel label="سعر الوحدة">
              <InputNumber
                className="amount-input"
                style={{ width: 112 }}
                min={0}
                value={unitPrice}
                onChange={(v) => setUnitPrice(v)}
                onPressEnter={handleAddService}
              />
            </FieldLabel>
            <Button
              type="primary"
              onClick={handleAddService}
              loading={isSubmittingService}
              disabled={!selectedServiceId || unitPrice === null}
            >
              إضافة
            </Button>
          </Flex>
          <Table
            rowKey="id"
            columns={serviceColumns}
            dataSource={services}
            pagination={false}
            size="small"
            locale={{ emptyText: 'لا توجد خدمات بعد' }}
          />
        </Card>
      </Col>

      <Col xs={24} md={12}>
        <Card title="الدفعات">
          <Flex wrap="wrap" align="flex-end" gap={8} style={{ marginBottom: 12 }}>
            <FieldLabel label="المبلغ">
              <InputNumber className="amount-input" style={{ width: 112 }} min={0} value={depositAmount} onChange={(v) => setDepositAmount(v)} />
            </FieldLabel>
            <FieldLabel label="طريقة الدفع">
              <Select
                style={{ width: 144 }}
                placeholder="اختر طريقة الدفع"
                loading={paymentMethodsQuery.isLoading}
                value={depositMethodId}
                onChange={setDepositMethodId}
                options={activePaymentMethods.map((pm) => ({ label: pm.name, value: pm.id }))}
              />
            </FieldLabel>
            <FieldLabel label="ملاحظة">
              <Input
                style={{ width: 180 }}
                placeholder="ملاحظة (اختياري)"
                value={depositComment}
                onChange={(e) => setDepositComment(e.target.value)}
              />
            </FieldLabel>
            <Button
              type="primary"
              onClick={handleAddDeposit}
              loading={isSubmittingDeposit}
              disabled={depositAmount === null || !depositMethodId}
            >
              إضافة
            </Button>
          </Flex>
          <Table
            rowKey="id"
            columns={depositColumns}
            dataSource={deposits}
            pagination={false}
            size="small"
            locale={{ emptyText: 'لا توجد دفعات بعد' }}
          />
        </Card>
      </Col>
    </Row>
  )
}
