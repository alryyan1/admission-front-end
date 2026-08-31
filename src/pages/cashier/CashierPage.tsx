import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { pdf } from '@react-pdf/renderer'
import {
  ConfigProvider,
  Card,
  Typography,
  Flex,
  Table,
  Input,
  Button,
  Tag,
  Modal,
  InputNumber,
  Select,
  Space,
  DatePicker,
  Progress,
  Popover,
} from 'antd'
import { PieChartOutlined, FileDoneOutlined, FileTextOutlined, PrinterOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import { useAntTheme } from '@/lib/antdTheme'
import { formatDate, formatNumber } from '@/lib/utils'
import {
  getCashierOverview,
  addDeposit,
  getInvoice,
  getInvoices,
  addOperationTeamMember,
  removeOperationTeamMember,
} from '@/services/admissionService'
import { getOperation } from '@/services/operationService'
import { getPaymentMethods } from '@/services/paymentMethodService'
import { getDoctors } from '@/services/patientService'
import { getTeamRoles } from '@/services/teamRoleService'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useFacilityPdfAssets } from '@/hooks/useFacilityPdfAssets'
import { StatTile } from '@/components/statistics/StatTile'
import { InvoicePdfDocument } from '@/components/admissions/InvoicePdfDocument'
import type { CashierAdmission, OperationTeamMember } from '@/types/admission'

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
  const [depositComment, setDepositComment] = useState('')

  const { assets: pdfAssets } = useFacilityPdfAssets()
  const [draftLoadingId, setDraftLoadingId] = useState<number | null>(null)
  const [finalLoadingId, setFinalLoadingId] = useState<number | null>(null)
  const [invoicePreviewUrl, setInvoicePreviewUrl] = useState<string | null>(null)
  const [invoicePreviewTitle, setInvoicePreviewTitle] = useState('')
  const invoicePreviewIframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    return () => {
      if (invoicePreviewUrl) URL.revokeObjectURL(invoicePreviewUrl)
    }
  }, [invoicePreviewUrl])

  const [teamManageOperationId, setTeamManageOperationId] = useState<number | null>(null)
  const [teamRoleId, setTeamRoleId] = useState<number | undefined>(undefined)
  const [teamDoctorId, setTeamDoctorId] = useState<number | undefined>(undefined)
  const [teamMemberName, setTeamMemberName] = useState('')

  const operationDetailQuery = useQuery({
    queryKey: ['operations', teamManageOperationId],
    queryFn: () => getOperation(teamManageOperationId as number),
    enabled: teamManageOperationId != null,
  })
  const doctorsQuery = useQuery({ queryKey: ['doctors', ''], queryFn: () => getDoctors() })
  const teamRolesQuery = useQuery({ queryKey: ['team-roles'], queryFn: getTeamRoles })
  const teamRoleDoctors = (doctorsQuery.data ?? []).filter((d) => d.role_id === teamRoleId)

  const addTeamMemberMutation = useMutation({
    mutationFn: (payload: Parameters<typeof addOperationTeamMember>[1]) =>
      addOperationTeamMember(teamManageOperationId as number, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations', teamManageOperationId] })
      setTeamDoctorId(undefined)
      setTeamMemberName('')
    },
  })
  const removeTeamMemberMutation = useMutation({
    mutationFn: (teamMemberId: number) => removeOperationTeamMember(teamManageOperationId as number, teamMemberId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['operations', teamManageOperationId] }),
  })

  function closeTeamManageModal() {
    setTeamManageOperationId(null)
    setTeamRoleId(undefined)
    setTeamDoctorId(undefined)
    setTeamMemberName('')
  }

  function handleAddTeamMember() {
    if (!teamRoleId || (!teamDoctorId && !teamMemberName.trim())) return
    addTeamMemberMutation.mutate({
      role_id: teamRoleId,
      doctor_id: teamDoctorId,
      name: teamDoctorId ? undefined : teamMemberName.trim(),
    })
  }

  const teamMemberColumns: ColumnsType<OperationTeamMember> = [
    { title: 'الدور', key: 'role', render: (_, member) => <Tag>{member.role?.name ?? '—'}</Tag> },
    { title: 'الاسم', key: 'name', render: (_, member) => member.doctor?.name ?? member.name ?? '—' },
    {
      title: '',
      key: 'actions',
      render: (_, member) => (
        <Button
          size="small"
          danger
          type="text"
          loading={removeTeamMemberMutation.isPending && removeTeamMemberMutation.variables === member.id}
          onClick={() => removeTeamMemberMutation.mutate(member.id)}
        >
          إزالة
        </Button>
      ),
    },
  ]

  const dateFrom = dateRange[0].format('YYYY-MM-DD')
  const dateTo = dateRange[1].format('YYYY-MM-DD')

  const overviewQuery = useQuery({
    queryKey: ['cashier-overview', debouncedSearch, dateFrom, dateTo],
    queryFn: () => getCashierOverview({ search: debouncedSearch || undefined, date_from: dateFrom, date_to: dateTo }),
  })

  const paymentMethodsQuery = useQuery({ queryKey: ['payment-methods'], queryFn: getPaymentMethods })
  const activePaymentMethods = (paymentMethodsQuery.data ?? []).filter((pm) => pm.is_active)

  const depositMutation = useMutation({
    mutationFn: (payload: { admissionId: number; amount: number; payment_method_id?: number; comment?: string }) =>
      addDeposit(payload.admissionId, {
        amount: payload.amount,
        payment_method_id: payload.payment_method_id,
        comment: payload.comment,
      }),
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
    setDepositComment('')
  }

  function closeDepositModal() {
    setDepositTarget(null)
    setDepositAmount(null)
    setDepositMethodId(undefined)
    setDepositComment('')
  }

  function handleConfirmDeposit() {
    if (!depositTarget || depositAmount === null) return
    depositMutation.mutate({
      admissionId: depositTarget.id,
      amount: depositAmount,
      payment_method_id: depositMethodId,
      comment: depositComment.trim() || undefined,
    })
  }

  async function handlePrintDraftInvoice(admission: CashierAdmission) {
    setDraftLoadingId(admission.id)
    try {
      const invoice = await getInvoice(admission.id)
      const blob = await pdf(
        <InvoicePdfDocument
          assets={pdfAssets}
          patientName={invoice.patient.name}
          admissionId={invoice.admission_id}
          services={invoice.requested_services}
          servicesTotal={invoice.services_total}
          operationsTotal={invoice.operations_total}
          depositsTotal={invoice.deposits_total}
          balanceDue={invoice.balance_due}
          total={invoice.total}
        />,
      ).toBlob()
      setInvoicePreviewTitle('معاينة الفاتورة المبدئية')
      setInvoicePreviewUrl(URL.createObjectURL(blob))
    } catch {
      toast.error('تعذر إنشاء الفاتورة المبدئية')
    } finally {
      setDraftLoadingId(null)
    }
  }

  async function handlePrintFinalInvoice(admission: CashierAdmission) {
    setFinalLoadingId(admission.id)
    try {
      const invoices = await getInvoices(admission.id)
      const persistedInvoice = invoices.find((i) => i.status !== 'cancelled')
      if (!persistedInvoice) {
        toast.error('لا توجد فاتورة نهائية صادرة لهذا التنويم بعد')
        navigate(`/admissions/${admission.id}?tab=invoice`)
        return
      }
      const items = persistedInvoice.items ?? []
      const blob = await pdf(
        <InvoicePdfDocument
          assets={pdfAssets}
          patientName={admission.patient?.name ?? ''}
          admissionId={admission.id}
          services={items.map((item) => ({ id: item.id, name: item.description, quantity: item.quantity, total_price: item.total }))}
          servicesTotal={Number(persistedInvoice.subtotal)}
          total={Number(persistedInvoice.total)}
          isFinal
          invoiceNumber={persistedInvoice.invoice_number}
          issuedAt={persistedInvoice.issued_at}
        />,
      ).toBlob()
      setInvoicePreviewTitle('معاينة الفاتورة النهائية')
      setInvoicePreviewUrl(URL.createObjectURL(blob))
    } catch {
      toast.error('تعذر إنشاء الفاتورة النهائية')
    } finally {
      setFinalLoadingId(null)
    }
  }

  function closeInvoicePreview() {
    if (invoicePreviewUrl) URL.revokeObjectURL(invoicePreviewUrl)
    setInvoicePreviewUrl(null)
  }

  function handlePrintInvoicePreview() {
    invoicePreviewIframeRef.current?.contentWindow?.print()
  }

  const summary = overviewQuery.data?.summary
  const admissions = overviewQuery.data?.admissions ?? []
  const depositsByPaymentMethod = summary?.deposits_by_payment_method ?? []
  const depositsGrandTotal = depositsByPaymentMethod.reduce((sum, row) => sum + row.total, 0)
  const paymentMethodColors = ['#1677ff', '#52c41a', '#faad14', '#eb2f96', '#722ed1', '#13c2c2', '#fa541c']

  const dueAdmissions = [...admissions].filter((a) => a.balance_due > 0).sort((a, b) => b.balance_due - a.balance_due)

  const dueListContent = (
    <Flex vertical gap={8} style={{ width: 260, maxHeight: 320, overflowY: 'auto' }}>
      {dueAdmissions.map((a) => (
        <Flex key={a.id} justify="space-between" align="center" gap={12}>
          <Typography.Text
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(`/admissions/${a.id}?tab=statement`)}
          >
            {a.patient?.name ?? '—'}
          </Typography.Text>
          <Typography.Text strong style={{ color: '#dc2626', whiteSpace: 'nowrap' }}>
            {formatNumber(a.balance_due)}
          </Typography.Text>
        </Flex>
      ))}
    </Flex>
  )

  const paymentBreakdownContent = (
    <Flex vertical gap={12} style={{ width: 260 }}>
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
  )

  const columns: ColumnsType<CashierAdmission> = [
    { title: 'رقم التنويم', key: 'admission_number', render: (_, a) => a.admission_number ?? `#${a.id}` },
    { title: 'المريض', key: 'patient', render: (_, a) => a.patient?.name ?? '—' },
    { title: 'تاريخ الدخول', key: 'admission_date', render: (_, a) => formatDate(a.admission_date) },
    {
      title: 'الإجمالي',
      key: 'services_total',
      align: 'end',
      render: (_, a) => (
        <Typography.Text type="secondary">{formatNumber(a.services_total + a.operations_total)}</Typography.Text>
      ),
    },
    {
      title: 'المدفوع',
      key: 'deposits_total',
      align: 'end',
      render: (_, a) => <Typography.Text style={{ color: '#16a34a' }}>{formatNumber(a.deposits_total)}</Typography.Text>,
    },
    {
      title: 'المتبقي',
      key: 'balance_due',
      align: 'end',
      render: (_, a) => (
        <Typography.Text strong style={{ color: a.balance_due > 0 ? '#dc2626' : '#16a34a' }}>
          {formatNumber(a.balance_due)}
        </Typography.Text>
      ),
    },

    {
      title: '',
      key: 'actions',
      render: (_, a) => (
        <Space wrap>
          <Button size="small" type="primary" onClick={() => openDepositModal(a)}>
            تسجيل دفعة
          </Button>
          <Button size="small" onClick={() => navigate(`/admissions/${a.id}?tab=statement`)}>
            كشف الحساب
          </Button>
          <Button
            size="small"
            icon={<FileTextOutlined />}
            loading={draftLoadingId === a.id}
            onClick={() => handlePrintDraftInvoice(a)}
          >
            فاتورة مبدئية
          </Button>
          <Button
            size="small"
            icon={<FileDoneOutlined />}
            loading={finalLoadingId === a.id}
            onClick={() => handlePrintFinalInvoice(a)}
          >
            فاتورة نهائية
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <ConfigProvider direction="rtl" theme={antTheme}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          الإيرادات
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
        <Popover
          content={dueListContent}
          title="المرضى المستحق عليهم مبالغ"
          trigger="click"
          placement="bottom"
          open={dueAdmissions.length > 0 ? undefined : false}
        >
          <Card hoverable={dueAdmissions.length > 0} style={{ cursor: dueAdmissions.length > 0 ? 'pointer' : 'default' }}>
            <p className="text-sm text-muted-foreground">إجمالي المستحق</p>
            <p className="mt-1 text-2xl font-semibold">{formatNumber(summary?.total_outstanding ?? 0)}</p>
          </Card>
        </Popover>
        <Popover
          content={paymentBreakdownContent}
          title="التحصيل حسب طريقة الدفع"
          trigger="click"
          placement="bottom"
          open={depositsByPaymentMethod.length > 0 ? undefined : false}
        >
          <Card hoverable={depositsByPaymentMethod.length > 0} style={{ cursor: depositsByPaymentMethod.length > 0 ? 'pointer' : 'default' }}>
            <Flex justify="space-between" align="start">
              <p className="text-sm text-muted-foreground">
                {dateFrom === dateTo
                  ? dateFrom === dayjs().format('YYYY-MM-DD')
                    ? 'تحصيل اليوم'
                    : `التحصيل بتاريخ ${dateFrom}`
                  : `التحصيل من ${dateFrom} إلى ${dateTo}`}
              </p>
              {depositsByPaymentMethod.length > 0 && <PieChartOutlined style={{ color: '#8c8c8c' }} />}
            </Flex>
            <p className="mt-1 text-2xl font-semibold">{formatNumber(summary?.deposits_today ?? 0)}</p>
          </Card>
        </Popover>
      </div>

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
              className="amount-input"
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
          <Flex vertical gap={4}>
            <Typography.Text style={{ fontSize: 12 }} type="secondary">
              ملاحظة
            </Typography.Text>
            <Input
              placeholder="ملاحظة (اختياري)"
              value={depositComment}
              onChange={(e) => setDepositComment(e.target.value)}
            />
          </Flex>
        </Flex>
      </Modal>

      <Modal
        open={!!invoicePreviewUrl}
        onCancel={closeInvoicePreview}
        width={860}
        title={invoicePreviewTitle}
        destroyOnHidden
        footer={[
          <Button key="close" onClick={closeInvoicePreview}>
            إغلاق
          </Button>,
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrintInvoicePreview}>
            طباعة
          </Button>,
        ]}
      >
        {invoicePreviewUrl && (
          <iframe
            ref={invoicePreviewIframeRef}
            src={invoicePreviewUrl}
            title={invoicePreviewTitle}
            style={{ width: '100%', height: 640, border: 'none' }}
          />
        )}
      </Modal>

      <Modal
        open={teamManageOperationId != null}
        onCancel={closeTeamManageModal}
        title="إدارة الفريق الطبي"
        footer={[
          <Button key="close" onClick={closeTeamManageModal}>
            إغلاق
          </Button>,
        ]}
        destroyOnHidden
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Table<OperationTeamMember>
            size="small"
            rowKey="id"
            pagination={false}
            loading={operationDetailQuery.isLoading}
            dataSource={operationDetailQuery.data?.team_members ?? []}
            columns={teamMemberColumns}
            locale={{ emptyText: 'لم يُضف أعضاء بعد' }}
          />

          <Flex gap={8} align="flex-end" wrap="wrap">
            <div style={{ width: 140 }}>
              <Typography.Text style={{ fontSize: 12 }} type="secondary">
                الدور
              </Typography.Text>
              <Select
                style={{ width: '100%' }}
                loading={teamRolesQuery.isLoading}
                value={teamRoleId}
                onChange={(v) => {
                  setTeamRoleId(v)
                  setTeamDoctorId(undefined)
                }}
                options={(teamRolesQuery.data ?? []).map((r) => ({ label: r.name, value: r.id }))}
              />
            </div>
            <div style={{ width: 180 }}>
              <Typography.Text style={{ fontSize: 12 }} type="secondary">
                الطبيب (اختياري)
              </Typography.Text>
              <Select
                style={{ width: '100%' }}
                allowClear
                showSearch
                optionFilterProp="label"
                value={teamDoctorId}
                onChange={setTeamDoctorId}
                options={teamRoleDoctors.map((d) => ({ label: d.name, value: d.id }))}
              />
            </div>
            <div style={{ width: 140 }}>
              <Typography.Text style={{ fontSize: 12 }} type="secondary">
                أو الاسم
              </Typography.Text>
              <Input value={teamMemberName} onChange={(e) => setTeamMemberName(e.target.value)} disabled={!!teamDoctorId} />
            </div>
            <Button
              type="primary"
              loading={addTeamMemberMutation.isPending}
              disabled={!teamRoleId || (!teamDoctorId && !teamMemberName.trim())}
              onClick={handleAddTeamMember}
            >
              إضافة
            </Button>
          </Flex>
        </Space>
      </Modal>
    </ConfigProvider>
  )
}
