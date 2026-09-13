import { Card, Table, Typography, Flex, Divider, Button } from 'antd'
import { FileDown } from 'lucide-react'
import type { ColumnsType } from 'antd/es/table'
import { formatDate, formatNumber } from '@/lib/utils'
import { usePdfPreview } from '@/hooks/usePdfPreview'
import { PdfPreviewModal } from '@/components/common/PdfPreviewModal'
import { admissionPdfPaths } from '@/services/admissionService'
import type { AdmissionDeposit, Operation, RequestedService } from '@/types/admission'

const { Text } = Typography

interface AccountStatementTabProps {
  services: RequestedService[]
  operations: Operation[]
  deposits: AdmissionDeposit[]
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

export function AccountStatementTab({ services, operations, deposits, admissionId }: AccountStatementTabProps) {
  const pdf = usePdfPreview()

  const rows = [
    ...services.map((s) => ({
      key: `service-${s.id}`,
      date: s.created_at,
      description: `${s.name} × ${s.quantity}`,
      debit: Number(s.total_price),
      credit: 0,
    })),
    ...operations
      .filter((op) => op.price != null)
      .map((op) => ({
        key: `operation-${op.id}`,
        date: op.scheduled_at ?? '',
        description: `عملية: ${op.procedure?.name_ar ?? `#${op.operation_number ?? op.id}`}`,
        debit: Number(op.price),
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

  return (
    <>
      <Card
        title="كشف الحساب"
        style={{ maxWidth: 768 }}
        extra={
          <Button
            icon={<FileDown className="h-4 w-4" />}
            loading={pdf.isLoading()}
            onClick={() => pdf.open(admissionPdfPaths.accountStatement(admissionId), 'معاينة كشف الحساب')}
          >
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
            <Text type="secondary">إجمالي المدين (الخدمات والعمليات)</Text>
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

      <PdfPreviewModal url={pdf.url} title={pdf.title} onClose={pdf.close} />
    </>
  )
}
