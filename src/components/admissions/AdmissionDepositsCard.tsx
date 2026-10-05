import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, InputNumber, Input, Select, Table, Button, Typography, Flex, Space, Popconfirm } from 'antd'
import { PrinterOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { formatDate, formatNumber } from '@/lib/utils'
import { getPaymentMethods } from '@/services/paymentMethodService'
import { admissionPdfPaths } from '@/services/admissionService'
import { usePdfPreview } from '@/hooks/usePdfPreview'
import { PdfPreviewModal } from '@/components/common/PdfPreviewModal'
import type { AdmissionDeposit } from '@/types/admission'

const { Text } = Typography

interface AdmissionDepositsCardProps {
  deposits: AdmissionDeposit[]
  admissionId: number
  /** Outstanding balance (services + operations − deposits); pre-fills the amount field. */
  patientBalance?: number
  onAddDeposit: (payload: { amount: number; payment_method_id?: number; comment?: string }) => void
  onRemoveDeposit: (depositId: number) => void
  isSubmittingDeposit: boolean
  isRemovingDeposit: boolean
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

/** Deposits management card, shared by {@link BillingTab} and the admissions payments dialog. */
export function AdmissionDepositsCard({
  deposits,
  admissionId,
  patientBalance,
  onAddDeposit,
  onRemoveDeposit,
  isSubmittingDeposit,
  isRemovingDeposit,
}: AdmissionDepositsCardProps) {
  const paymentMethodsQuery = useQuery({ queryKey: ['payment-methods'], queryFn: getPaymentMethods })
  const receiptPdf = usePdfPreview()
  const activePaymentMethods = (paymentMethodsQuery.data ?? []).filter((pm) => pm.is_active)

  const [depositAmount, setDepositAmount] = useState<number | null>(null)
  const [depositMethodId, setDepositMethodId] = useState<number | undefined>(undefined)
  const [depositComment, setDepositComment] = useState('')

  useEffect(() => {
    if (depositMethodId === undefined && activePaymentMethods.length > 0) {
      const preferred = activePaymentMethods.find((pm) => pm.name === 'بنكك')
      setDepositMethodId((preferred ?? activePaymentMethods[0]).id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePaymentMethods.length])

  useEffect(() => {
    if (depositAmount === null && patientBalance != null && patientBalance > 0) {
      setDepositAmount(patientBalance)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientBalance])

  const depositsTotal = deposits.reduce((sum, d) => sum + Number(d.amount), 0)

  function handleAddDeposit() {
    if (depositAmount === null) return
    onAddDeposit({ amount: depositAmount, payment_method_id: depositMethodId, comment: depositComment.trim() || undefined })
    setDepositAmount(null)
    setDepositComment('')
  }

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
        <Flex wrap="wrap" align="flex-end" gap={8} style={{ marginBottom: 12 }}>
          <FieldLabel label="المبلغ">
            <InputNumber
              className="amount-input"
              style={{ width: 150 }}
              min={0}
              value={depositAmount}
              onChange={(v) => setDepositAmount(v)}
              onPressEnter={handleAddDeposit}
            />
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
