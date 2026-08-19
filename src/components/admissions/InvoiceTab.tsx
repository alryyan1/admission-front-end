import { Card, Table, Tag, Button, Typography, Divider, Space, Flex, Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { formatDate, formatNumber } from '@/lib/utils'
import type { AdmissionInvoice, Invoice, InvoiceStatus, RequestedService } from '@/types/admission'

const { Title, Text } = Typography

interface InvoiceTabProps {
  invoice: AdmissionInvoice | undefined
  isLoading: boolean
  persistedInvoices: Invoice[]
  onGenerateInvoice: () => void
  onMarkPaid: (invoiceId: number) => void
  isGenerating: boolean
}

const statusLabels: Record<InvoiceStatus, string> = {
  draft: 'مسودة',
  issued: 'صادرة',
  paid: 'محصّلة',
  cancelled: 'ملغاة',
}

function SummaryRow({
  label,
  value,
  bold,
  valueColor,
}: {
  label: string
  value: React.ReactNode
  bold?: boolean
  valueColor?: string
}) {
  return (
    <Flex justify="space-between">
      <Text type={bold ? undefined : 'secondary'} strong={bold}>
        {label}
      </Text>
      <Text strong={bold} style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </Text>
    </Flex>
  )
}

export function InvoiceTab({
  invoice,
  isLoading,
  persistedInvoices,
  onGenerateInvoice,
  onMarkPaid,
  isGenerating,
}: InvoiceTabProps) {
  if (isLoading || !invoice) {
    return (
      <Flex align="center" gap={8}>
        <Spin size="small" />
        <Text>جارٍ تحميل الفاتورة...</Text>
      </Flex>
    )
  }

  const serviceColumns: ColumnsType<RequestedService> = [
    { title: 'الخدمة', key: 'name', render: (_, s) => `${s.name} × ${s.quantity}` },
    { title: 'الإجمالي', key: 'total', align: 'end', render: (_, s) => formatNumber(s.total_price) },
  ]

  const invoiceColumns: ColumnsType<Invoice> = [
    { title: 'رقم الفاتورة', dataIndex: 'invoice_number', key: 'invoice_number' },
    { title: 'التاريخ', key: 'issued_at', render: (_, i) => (i.issued_at ? formatDate(i.issued_at) : '—') },
    { title: 'الإجمالي', key: 'total', render: (_, i) => formatNumber(i.total) },
    {
      title: 'الحالة',
      key: 'status',
      render: (_, i) => <Tag color={i.status === 'paid' ? 'success' : 'default'}>{statusLabels[i.status]}</Tag>,
    },
    {
      title: '',
      key: 'actions',
      render: (_, i) =>
        i.status === 'issued' && (
          <Button size="small" onClick={() => onMarkPaid(i.id)}>
            تحصيل
          </Button>
        ),
    },
  ]

  return (
    <Space direction="vertical" size={16} style={{ maxWidth: 576, width: '100%' }}>
      <Card>
        <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
          <Title level={4} style={{ margin: 0 }}>
            فاتورة التنويم — {invoice.patient.name}
          </Title>
          <Button type="primary" onClick={onGenerateInvoice} loading={isGenerating}>
            إصدار فاتورة
          </Button>
        </Flex>

        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          {invoice.billing_mode === 'short_stay' ? (
            <SummaryRow label="مدة الإقامة القصيرة" value={`${invoice.admission_duration_hours} ساعة`} />
          ) : (
            <>
              <SummaryRow label="عدد الليالي" value={invoice.nights_stayed} />
              <SummaryRow
                label="سعر اليوم"
                value={invoice.price_per_day != null ? formatNumber(invoice.price_per_day) : null}
              />
            </>
          )}
          <SummaryRow label="تكلفة الإقامة" value={formatNumber(invoice.bed_charges)} bold />
        </Space>

        <Divider style={{ margin: '12px 0' }} />

        <Title level={5} style={{ marginBottom: 8 }}>
          الخدمات
        </Title>
        <Table
          rowKey="id"
          columns={serviceColumns}
          dataSource={invoice.requested_services}
          pagination={false}
          size="small"
          locale={{ emptyText: 'لا توجد خدمات' }}
        />

        <div style={{ marginTop: 8 }}>
          <SummaryRow label="إجمالي الخدمات" value={formatNumber(invoice.services_total)} bold />
        </div>

        <Divider style={{ margin: '12px 0' }} />

        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <Flex justify="space-between">
            <Text strong style={{ fontSize: 16 }}>
              الإجمالي الكلي
            </Text>
            <Text strong style={{ fontSize: 16 }}>
              {formatNumber(invoice.total)}
            </Text>
          </Flex>
          <SummaryRow label="الدفعات المسددة" value={formatNumber(invoice.deposits_total)} valueColor="#16a34a" />
          <SummaryRow
            label="المبلغ المتبقي"
            value={formatNumber(invoice.balance_due)}
            bold
            valueColor={invoice.balance_due > 0 ? '#dc2626' : '#16a34a'}
          />
        </Space>
      </Card>

      {persistedInvoices.length > 0 && (
        <Card title="الفواتير الصادرة">
          <Table rowKey="id" columns={invoiceColumns} dataSource={persistedInvoices} pagination={false} size="small" />
        </Card>
      )}
    </Space>
  )
}
