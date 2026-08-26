import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ConfigProvider,
  Card,
  Typography,
  Flex,
  Table,
  Input,
  Button,
  Modal,
  InputNumber,
  Select,
  Space,
  DatePicker,
  Progress,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import { useAntTheme } from '@/lib/antdTheme'
import { formatDate, formatNumber } from '@/lib/utils'
import { getCashierOverview, addDeposit } from '@/services/admissionService'
import { getPaymentMethods } from '@/services/paymentMethodService'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { StatTile } from '@/components/statistics/StatTile'
import type { CashierAdmission } from '@/types/admission'

const { Title } = Typography
const { RangePicker } = DatePicker

export function CashierPage() {
  const antTheme = useAntTheme()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([dayjs(), dayjs()])

  const [depositTarget, setDepositTarget] = useState<CashierAdmission | null>(null)
  const [depositAmount, setDepositAmount] = useState<number | null>(null)
  const [depositMethodId, setDepositMethodId] = useState<number | undefined>(undefined)

  const dateFrom = dateRange[0].format('YYYY-MM-DD')
  const dateTo = dateRange[1].format('YYYY-MM-DD')

  const overviewQuery = useQuery({
    queryKey: ['cashier-overview', debouncedSearch, dateFrom, dateTo],
    queryFn: () => getCashierOverview({ search: debouncedSearch || undefined, date_from: dateFrom, date_to: dateTo }),
  })

  const paymentMethodsQuery = useQuery({ queryKey: ['payment-methods'], queryFn: getPaymentMethods })
  const activePaymentMethods = (paymentMethodsQuery.data ?? []).filter((pm) => pm.is_active)

  const depositMutation = useMutation({
    mutationFn: (payload: { admissionId: number; amount: number; payment_method_id?: number }) =>
      addDeposit(payload.admissionId, { amount: payload.amount, payment_method_id: payload.payment_method_id }),
    onSuccess: () => {
      toast.success('تم تسجيل الدفعة')
      queryClient.invalidateQueries({ queryKey: ['cashier-overview'] })
      closeDepositModal()
    },
  })

  function openDepositModal(admission: CashierAdmission) {
    setDepositTarget(admission)
    setDepositAmount(admission.balance_due > 0 ? admission.balance_due : null)
    setDepositMethodId(activePaymentMethods[0]?.id)
  }

  function closeDepositModal() {
    setDepositTarget(null)
    setDepositAmount(null)
    setDepositMethodId(undefined)
  }

  function handleConfirmDeposit() {
    if (!depositTarget || depositAmount === null) return
    depositMutation.mutate({ admissionId: depositTarget.id, amount: depositAmount, payment_method_id: depositMethodId })
  }

  const summary = overviewQuery.data?.summary
  const admissions = overviewQuery.data?.admissions ?? []
  const depositsByPaymentMethod = summary?.deposits_by_payment_method ?? []
  const depositsGrandTotal = depositsByPaymentMethod.reduce((sum, row) => sum + row.total, 0)
  const paymentMethodColors = ['#1677ff', '#52c41a', '#faad14', '#eb2f96', '#722ed1', '#13c2c2', '#fa541c']

  const columns: ColumnsType<CashierAdmission> = [
    { title: 'المريض', key: 'patient', render: (_, a) => a.patient?.name ?? '—' },
    {
      title: 'السرير',
      key: 'bed',
      render: (_, a) =>
        [a.bed?.room?.ward?.name, a.bed?.room?.room_number ? `غرفة ${a.bed.room.room_number}` : null, a.bed?.bed_number ? `سرير ${a.bed.bed_number}` : null]
          .filter(Boolean)
          .join(' / ') || '—',
    },
    { title: 'تاريخ الدخول', key: 'admission_date', render: (_, a) => formatDate(a.admission_date) },
    { title: 'إجمالي الخدمات', key: 'services_total', align: 'end', render: (_, a) => formatNumber(a.services_total) },
    { title: 'إجمالي المدفوع', key: 'deposits_total', align: 'end', render: (_, a) => formatNumber(a.deposits_total) },
    {
      title: 'المتبقي',
      key: 'balance_due',
      align: 'end',
      render: (_, a) => (
        <span style={{ fontWeight: 600, color: a.balance_due > 0 ? '#dc2626' : '#16a34a' }}>
          {formatNumber(a.balance_due)}
        </span>
      ),
    },
    {
      title: '',
      key: 'actions',
      render: (_, a) => (
        <Space>
          <Button size="small" type="primary" onClick={() => openDepositModal(a)}>
            تسجيل دفعة
          </Button>
          <Button size="small" onClick={() => navigate(`/admissions/${a.id}?tab=statement`)}>
            كشف الحساب
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <ConfigProvider direction="rtl" theme={antTheme}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          شاشة المحاسب
        </Title>
        <Space>
          <RangePicker
            value={dateRange}
            onChange={(values) => {
              if (values && values[0] && values[1]) {
                setDateRange([values[0], values[1]])
              }
            }}
            allowClear={false}
            format="YYYY-MM-DD"
          />
          <Input
            style={{ maxWidth: 260 }}
            placeholder="بحث باسم المريض..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />
        </Space>
      </Flex>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4" style={{ marginBottom: 16 }}>
        <StatTile label="الحالات النشطة" value={String(summary?.admissions_count ?? 0)} />
        <StatTile label="حالات عليها مستحقات" value={String(summary?.admissions_with_balance ?? 0)} />
        <StatTile label="إجمالي المستحق" value={formatNumber(summary?.total_outstanding ?? 0)} />
        <StatTile
          label={dateFrom === dateTo ? (dateFrom === dayjs().format('YYYY-MM-DD') ? 'تحصيل اليوم' : `التحصيل بتاريخ ${dateFrom}`) : `التحصيل من ${dateFrom} إلى ${dateTo}`}
          value={formatNumber(summary?.deposits_today ?? 0)}
        />
      </div>

      {depositsByPaymentMethod.length > 0 && (
        <Card size="small" title="التحصيل حسب طريقة الدفع" style={{ marginBottom: 16 }}>
          <Flex vertical gap={12}>
            {depositsByPaymentMethod.map((row, index) => {
              const percent = depositsGrandTotal > 0 ? (row.total / depositsGrandTotal) * 100 : 0
              const color = paymentMethodColors[index % paymentMethodColors.length]
              return (
                <div key={row.payment_method_id ?? 'unassigned'}>
                  <Flex justify="space-between" style={{ marginBottom: 4 }}>
                    <Typography.Text>{row.payment_method_name}</Typography.Text>
                    <Typography.Text strong>{formatNumber(row.total)}</Typography.Text>
                  </Flex>
                  <Progress percent={percent} showInfo={false} strokeColor={color} />
                </div>
              )
            })}
          </Flex>
        </Card>
      )}

      <Card>
        <Table
          rowKey="id"
          loading={overviewQuery.isLoading}
          columns={columns}
          dataSource={admissions}
          pagination={false}
          locale={{ emptyText: 'لا توجد حالات نشطة' }}
        />
      </Card>

      <Modal
        open={!!depositTarget}
        onCancel={closeDepositModal}
        title={depositTarget ? `تسجيل دفعة — ${depositTarget.patient?.name ?? ''}` : 'تسجيل دفعة'}
        onOk={handleConfirmDeposit}
        okText="تسجيل"
        cancelText="إلغاء"
        confirmLoading={depositMutation.isPending}
        okButtonProps={{ disabled: depositAmount === null }}
      >
        <Flex vertical gap={12} style={{ marginTop: 8 }}>
          {depositTarget && (
            <Typography.Text type="secondary">
              الرصيد المستحق حالياً: {formatNumber(depositTarget.balance_due)}
            </Typography.Text>
          )}
          <Flex vertical gap={4}>
            <Typography.Text style={{ fontSize: 12 }} type="secondary">
              المبلغ
            </Typography.Text>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              value={depositAmount}
              onChange={(v) => setDepositAmount(v)}
              autoFocus
            />
          </Flex>
          <Flex vertical gap={4}>
            <Typography.Text style={{ fontSize: 12 }} type="secondary">
              طريقة الدفع
            </Typography.Text>
            <Select
              style={{ width: '100%' }}
              placeholder="اختر طريقة الدفع"
              loading={paymentMethodsQuery.isLoading}
              value={depositMethodId}
              onChange={setDepositMethodId}
              options={activePaymentMethods.map((pm) => ({ label: pm.name, value: pm.id }))}
            />
          </Flex>
        </Flex>
      </Modal>
    </ConfigProvider>
  )
}
