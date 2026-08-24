import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, InputNumber, Select, Table, Button, Typography, Row, Col, Flex, Space, Popconfirm } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { formatDate, formatNumber } from '@/lib/utils'
import { getServices } from '@/services/serviceService'
import type { AdmissionDeposit, RequestedService } from '@/types/admission'

const { Text } = Typography

interface BillingTabProps {
  services: RequestedService[]
  deposits: AdmissionDeposit[]
  onAddService: (payload: { name: string; quantity?: number; unit_price: number }) => void
  onAddDeposit: (payload: { amount: number; method?: string }) => void
  onRemoveService: (serviceId: number) => void
  isSubmittingService: boolean
  isSubmittingDeposit: boolean
  isRemovingService: boolean
}

const DEPOSIT_METHOD_OPTIONS = [
  { label: 'نقدي', value: 'cash' },
  { label: 'بنكي', value: 'bank' },
  { label: 'فوري', value: 'fawry' },
  { label: 'أوكاش', value: 'ocash' },
]

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
  onAddService,
  onAddDeposit,
  onRemoveService,
  isSubmittingService,
  isSubmittingDeposit,
  isRemovingService,
}: BillingTabProps) {
  const catalogQuery = useQuery({ queryKey: ['services', 'active'], queryFn: () => getServices({ active_only: true }) })

  const [selectedServiceId, setSelectedServiceId] = useState<number | undefined>(undefined)
  const [quantity, setQuantity] = useState<number | null>(1)
  const [unitPrice, setUnitPrice] = useState<number | null>(null)

  const [depositAmount, setDepositAmount] = useState<number | null>(null)
  const [depositMethod, setDepositMethod] = useState('cash')

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
    onAddDeposit({ amount: depositAmount, method: depositMethod })
    setDepositAmount(null)
  }

  const serviceColumns: ColumnsType<RequestedService> = [
    { title: 'الخدمة', dataIndex: 'name', key: 'name' },
    { title: 'الكمية', dataIndex: 'quantity', key: 'quantity' },
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
    { title: 'الطريقة', dataIndex: 'method', key: 'method' },
  ]

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={12}>
        <Card title="الخدمات المطلوبة">
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
              <InputNumber style={{ width: 80 }} min={1} value={quantity} onChange={(v) => setQuantity(v)} />
            </FieldLabel>
            <FieldLabel label="سعر الوحدة">
              <InputNumber style={{ width: 112 }} min={0} value={unitPrice} onChange={(v) => setUnitPrice(v)} />
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
              <InputNumber style={{ width: 112 }} min={0} value={depositAmount} onChange={(v) => setDepositAmount(v)} />
            </FieldLabel>
            <FieldLabel label="طريقة الدفع">
              <Select
                style={{ width: 144 }}
                value={depositMethod}
                onChange={setDepositMethod}
                options={DEPOSIT_METHOD_OPTIONS}
              />
            </FieldLabel>
            <Button
              type="primary"
              onClick={handleAddDeposit}
              loading={isSubmittingDeposit}
              disabled={depositAmount === null}
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
