import { useEffect, useRef, useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { toast } from 'sonner'
import { Card, Table, Typography, Flex, Divider, Button, Modal } from 'antd'
import { FileDown, Printer } from 'lucide-react'
import type { ColumnsType } from 'antd/es/table'
import { formatDate, formatNumber } from '@/lib/utils'
import { useFacilityPdfAssets } from '@/hooks/useFacilityPdfAssets'
import { AccountStatementPdfDocument } from '@/components/admissions/AccountStatementPdfDocument'
import type { AdmissionDeposit, RequestedService } from '@/types/admission'

const { Text } = Typography

interface AccountStatementTabProps {
  services: RequestedService[]
  deposits: AdmissionDeposit[]
  patientName: string
  admissionId: number
}

interface StatementRow {
  key: string
  date: string
  description: string
  debit: number
  credit: number
  balance: number
}

export function AccountStatementTab({ services, deposits, patientName, admissionId }: AccountStatementTabProps) {
  const { assets: pdfAssets } = useFacilityPdfAssets()
  const [isGenerating, setIsGenerating] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const rows = [
    ...services.map((s) => ({
      key: `service-${s.id}`,
      date: s.created_at,
      description: `${s.name} × ${s.quantity}`,
      debit: Number(s.total_price),
      credit: 0,
    })),
    ...deposits.map((d) => ({
      key: `deposit-${d.id}`,
      date: d.paid_at,
      description: d.payment_method?.name ? `دفعة — ${d.payment_method.name}` : 'دفعة',
      debit: 0,
      credit: Number(d.amount),
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  let runningBalance = 0
  const statementRows: StatementRow[] = rows.map((row) => {
    runningBalance += row.debit - row.credit
    return { ...row, balance: runningBalance }
  })

  const totalDebit = rows.reduce((sum, r) => sum + r.debit, 0)
  const totalCredit = rows.reduce((sum, r) => sum + r.credit, 0)
  const balanceDue = totalDebit - totalCredit

  const columns: ColumnsType<StatementRow> = [
    { title: 'التاريخ', key: 'date', render: (_, r) => formatDate(r.date) },
    { title: 'البيان', dataIndex: 'description', key: 'description' },
    { title: 'مدين', key: 'debit', align: 'end', render: (_, r) => (r.debit ? formatNumber(r.debit) : '—') },
    { title: 'دائن', key: 'credit', align: 'end', render: (_, r) => (r.credit ? formatNumber(r.credit) : '—') },
    { title: 'الرصيد', key: 'balance', align: 'end', render: (_, r) => formatNumber(r.balance) },
  ]

  async function handleOpenPreview() {
    setIsGenerating(true)
    try {
      const blob = await pdf(
        <AccountStatementPdfDocument
          assets={pdfAssets}
          patientName={patientName}
          admissionId={admissionId}
          rows={statementRows}
          totalDebit={totalDebit}
          totalCredit={totalCredit}
          balanceDue={balanceDue}
        />,
      ).toBlob()
      setPreviewUrl(URL.createObjectURL(blob))
    } catch {
      toast.error('تعذر إنشاء ملف PDF')
    } finally {
      setIsGenerating(false)
    }
  }

  function handleClosePreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
  }

  function handlePrint() {
    iframeRef.current?.contentWindow?.print()
  }

  return (
    <>
      <Card
        title="كشف الحساب"
        style={{ maxWidth: 768 }}
        extra={
          <Button icon={<FileDown className="h-4 w-4" />} onClick={handleOpenPreview} loading={isGenerating}>
            تصدير PDF
          </Button>
        }
      >
        <Table
          rowKey="key"
          columns={columns}
          dataSource={statementRows}
          pagination={false}
          size="small"
          locale={{ emptyText: 'لا توجد حركات بعد' }}
        />

        <Divider style={{ margin: '12px 0' }} />

        <Flex vertical gap={4}>
          <Flex justify="space-between">
            <Text type="secondary">إجمالي المدين (الخدمات)</Text>
            <Text>{formatNumber(totalDebit)}</Text>
          </Flex>
          <Flex justify="space-between">
            <Text type="secondary">إجمالي الدائن (الدفعات)</Text>
            <Text>{formatNumber(totalCredit)}</Text>
          </Flex>
          <Flex justify="space-between">
            <Text strong style={{ fontSize: 16 }}>
              الرصيد المستحق
            </Text>
            <Text strong style={{ fontSize: 16, color: balanceDue > 0 ? '#dc2626' : '#16a34a' }}>
              {formatNumber(balanceDue)}
            </Text>
          </Flex>
        </Flex>
      </Card>

      <Modal
        open={!!previewUrl}
        onCancel={handleClosePreview}
        width={860}
        title="معاينة كشف الحساب"
        destroyOnHidden
        footer={[
          <Button key="close" onClick={handleClosePreview}>
            إغلاق
          </Button>,
          <Button key="print" type="primary" icon={<Printer className="h-4 w-4" />} onClick={handlePrint}>
            طباعة
          </Button>,
        ]}
      >
        {previewUrl && (
          <iframe
            ref={iframeRef}
            src={previewUrl}
            title="معاينة كشف الحساب"
            style={{ width: '100%', height: 640, border: 'none' }}
          />
        )}
      </Modal>
    </>
  )
}
