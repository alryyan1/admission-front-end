import { useEffect, useRef, useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { toast } from 'sonner'
import { Card, Table, Tag, Button, Typography, Divider, Space, Flex, Spin, Modal } from 'antd'
import { FileDown, Printer } from 'lucide-react'
import type { ColumnsType } from 'antd/es/table'
import { formatDate, formatNumber } from '@/lib/utils'
import { amountToArabicWords } from '@/lib/numberToArabicWords'
import { useFacilityPdfAssets } from '@/hooks/useFacilityPdfAssets'
import { InvoicePdfDocument } from '@/components/admissions/InvoicePdfDocument'
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
  const { assets: pdfAssets } = useFacilityPdfAssets()
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false)
  const [isGeneratingFinal, setIsGeneratingFinal] = useState<number | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewTitle, setPreviewTitle] = useState('معاينة الفاتورة المبدئية')
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  if (isLoading || !invoice) {
    return (
      <Flex align="center" gap={8}>
        <Spin size="small" />
        <Text>جارٍ تحميل الفاتورة...</Text>
      </Flex>
    )
  }

  async function handleOpenDraftPreview() {
    if (!invoice) return
    setIsGeneratingDraft(true)
    try {
      const blob = await pdf(
        <InvoicePdfDocument
          assets={pdfAssets}
          patientName={invoice.patient.name}
          admissionId={invoice.admission_id}
          services={invoice.requested_services}
          servicesTotal={invoice.services_total}
          depositsTotal={invoice.deposits_total}
          balanceDue={invoice.balance_due}
          total={invoice.total}
        />,
      ).toBlob()
      setPreviewTitle('معاينة الفاتورة المبدئية')
      setPreviewUrl(URL.createObjectURL(blob))
    } catch {
      toast.error('تعذر إنشاء ملف PDF')
    } finally {
      setIsGeneratingDraft(false)
    }
  }

  async function handleOpenFinalPreview(persistedInvoice: Invoice) {
    if (!invoice) return
    setIsGeneratingFinal(persistedInvoice.id)
    try {
      const items = persistedInvoice.items ?? []
      const blob = await pdf(
        <InvoicePdfDocument
          assets={pdfAssets}
          patientName={invoice.patient.name}
          admissionId={invoice.admission_id}
          services={items.map((item) => ({ id: item.id, name: item.description, quantity: item.quantity, total_price: item.total }))}
          servicesTotal={Number(persistedInvoice.subtotal)}
          total={Number(persistedInvoice.total)}
          isFinal
          invoiceNumber={persistedInvoice.invoice_number}
          issuedAt={persistedInvoice.issued_at}
        />,
      ).toBlob()
      setPreviewTitle('معاينة الفاتورة النهائية')
      setPreviewUrl(URL.createObjectURL(blob))
    } catch {
      toast.error('تعذر إنشاء ملف PDF')
    } finally {
      setIsGeneratingFinal(null)
    }
  }

  function handleClosePreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
  }

  function handlePrintPreview() {
    iframeRef.current?.contentWindow?.print()
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
      render: (_, i) => (
        <Space size={4}>
          <Button
            size="small"
            icon={<Printer className="h-4 w-4" />}
            loading={isGeneratingFinal === i.id}
            onClick={() => handleOpenFinalPreview(i)}
          >
            طباعة
          </Button>
          {i.status === 'issued' && (
            <Button size="small" onClick={() => onMarkPaid(i.id)}>
              تحصيل
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <>
    <Space direction="vertical" size={16} style={{ maxWidth: 576, width: '100%' }}>
      <Card>
        <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
          <Title level={4} style={{ margin: 0 }}>
            فاتورة التنويم — {invoice.patient.name}
          </Title>
          <Space>
            <Button icon={<FileDown className="h-4 w-4" />} onClick={handleOpenDraftPreview} loading={isGeneratingDraft}>
              فاتورة مبدئية
            </Button>
            <Button type="primary" onClick={onGenerateInvoice} loading={isGenerating}>
              إصدار فاتورة
            </Button>
          </Space>
        </Flex>

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

        <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
          المبلغ كتابة: {amountToArabicWords(invoice.total)}
        </Text>
      </Card>

      {persistedInvoices.length > 0 && (
        <Card title="الفواتير الصادرة">
          <Table rowKey="id" columns={invoiceColumns} dataSource={persistedInvoices} pagination={false} size="small" />
        </Card>
      )}
    </Space>

    <Modal
      open={!!previewUrl}
      onCancel={handleClosePreview}
      width={860}
      title={previewTitle}
      destroyOnHidden
      footer={[
        <Button key="close" onClick={handleClosePreview}>
          إغلاق
        </Button>,
        <Button key="print" type="primary" icon={<Printer className="h-4 w-4" />} onClick={handlePrintPreview}>
          طباعة
        </Button>,
      ]}
    >
      {previewUrl && (
        <iframe
          ref={iframeRef}
          src={previewUrl}
          title={previewTitle}
          style={{ width: '100%', height: 640, border: 'none' }}
        />
      )}
    </Modal>
    </>
  )
}
