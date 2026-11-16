import { Card, Table, Typography, Divider, Space, Flex, Spin, Button } from 'antd'
import { FileDown } from 'lucide-react'
import type { ColumnsType } from 'antd/es/table'
import { formatNumber } from '@/lib/utils'
import { amountToArabicWords } from '@/lib/numberToArabicWords'
import { usePdfPreview } from '@/hooks/usePdfPreview'
import { PdfPreviewModal } from '@/components/common/PdfPreviewModal'
import { admissionPdfPaths } from '@/services/admissionService'
import type { AdmissionInvoice, AdmissionInvoiceLineItem } from '@/types/admission'

const { Title, Text } = Typography

interface InvoiceTabProps {
  invoice: AdmissionInvoice | undefined
  isLoading: boolean
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

export function InvoiceTab({ invoice, isLoading }: InvoiceTabProps) {
  const pdf = usePdfPreview()

  if (isLoading || !invoice) {
    return (
      <Flex align="center" gap={8}>
        <Spin size="small" />
        <Text>جارٍ تحميل الفاتورة...</Text>
      </Flex>
    )
  }

  const serviceColumns: ColumnsType<AdmissionInvoiceLineItem> = [
    { title: 'البند', key: 'name', render: (_, s) => `${s.name} × ${s.quantity}` },
    { title: 'الإجمالي', key: 'total', align: 'end', render: (_, s) => formatNumber(s.total_price) },
  ]

  return (
    <>
      <Space direction="vertical" size={16} style={{ maxWidth: 576, width: '100%' }}>
        <Card>
          <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
            <Title level={4} style={{ margin: 0 }}>
              فاتورة التنويم — {invoice.patient.name}
            </Title>
            <Button
              icon={<FileDown className="h-4 w-4" />}
              loading={pdf.isLoading('preliminary')}
              onClick={() =>
                pdf.open(
                  admissionPdfPaths.preliminaryInvoice(invoice.admission_id),
                  'معاينة الفاتورة المبدئية',
                  'preliminary',
                )
              }
            >
              فاتورة مبدئية
            </Button>
          </Flex>

          <Title level={5} style={{ marginBottom: 8 }}>
            البنود
          </Title>
          <Table
            rowKey="id"
            columns={serviceColumns}
            dataSource={invoice.requested_services}
            pagination={false}
            size="small"
            locale={{ emptyText: 'لا توجد بنود' }}
          />

          <div style={{ marginTop: 8 }}>
            <SummaryRow label="إجمالي الخدمات" value={formatNumber(invoice.services_total)} />
            {invoice.operations_total > 0 && (
              <SummaryRow label="إجمالي العمليات" value={formatNumber(invoice.operations_total)} />
            )}
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

          <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
            المبلغ كتابة: {amountToArabicWords(invoice.total)}
          </Text>
        </Card>
      </Space>

      <PdfPreviewModal url={pdf.url} title={pdf.title} onClose={pdf.close} />
    </>
  )
}
