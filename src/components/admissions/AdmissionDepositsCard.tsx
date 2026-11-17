import { Card, Table, Button, Typography, Space, Popconfirm } from 'antd'
import { PrinterOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { formatDate, formatNumber } from '@/lib/utils'
import { admissionPdfPaths } from '@/services/admissionService'
import { usePdfPreview } from '@/hooks/usePdfPreview'
import { PdfPreviewModal } from '@/components/common/PdfPreviewModal'
import type { AdmissionDeposit } from '@/types/admission'

const { Text } = Typography

interface AdmissionDepositsCardProps {
  deposits: AdmissionDeposit[]
  admissionId: number
  onRemoveDeposit: (depositId: number) => void
  isRemovingDeposit: boolean
}

/** Deposits list, shared by {@link BillingTab} and the admissions payments dialog. Deposits are recorded only against a specific service/operation (see their own "pay" actions) — this card is read-only plus removal. */
export function AdmissionDepositsCard({
  deposits,
  admissionId,
  onRemoveDeposit,
  isRemovingDeposit,
}: AdmissionDepositsCardProps) {
  const receiptPdf = usePdfPreview()
  const depositsTotal = deposits.reduce((sum, d) => sum + Number(d.amount), 0)

  const depositColumns: ColumnsType<AdmissionDeposit> = [
    { title: 'الكود', key: 'id', render: (_, d) => `#${d.id}` },
    { title: 'التاريخ', key: 'paid_at', render: (_, d) => formatDate(d.paid_at) },
    { title: 'المبلغ', key: 'amount', render: (_, d) => formatNumber(d.amount) },
    { title: 'الطريقة', key: 'method', render: (_, d) => d.payment_method?.name ?? '—' },
    { title: 'استلمها', key: 'paid_by', render: (_, d) => d.paid_by_name ?? '—' },
    { title: 'ملاحظة', key: 'comment', render: (_, d) => d.comment ?? '—' },
    {
      title: '',
      key: 'actions',
      render: (_, d) => (
        <Space size={0}>
          <Button
            size="small"
            type="text"
            icon={<PrinterOutlined />}
            loading={receiptPdf.isLoading(`receipt-${d.id}`)}
            onClick={() =>
              receiptPdf.open(
                admissionPdfPaths.depositReceipt(admissionId, d.id),
                'معاينة إيصال الدفعة',
                `receipt-${d.id}`,
              )
            }
          >
            إيصال
          </Button>
          <Popconfirm
            title="حذف الدفعة؟"
            description="لا يمكن التراجع عن هذا الإجراء."
            onConfirm={() => onRemoveDeposit(d.id)}
          >
            <Button size="small" danger type="text" loading={isRemovingDeposit}>
              إزالة
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <>
      <Card title="الدفعات">
        <Table
          rowKey="id"
          columns={depositColumns}
          dataSource={deposits}
          pagination={false}
          size="small"
          locale={{ emptyText: 'لا توجد دفعات بعد' }}
          summary={() =>
            deposits.length > 0 ? (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>
                  <Text strong>الإجمالي</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <Text strong>{formatNumber(depositsTotal)}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} colSpan={3} />
              </Table.Summary.Row>
            ) : null
          }
        />
      </Card>

      <PdfPreviewModal url={receiptPdf.url} title={receiptPdf.title} onClose={receiptPdf.close} />
    </>
  )
}
