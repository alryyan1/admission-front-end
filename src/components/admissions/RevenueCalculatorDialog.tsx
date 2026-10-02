import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Modal, Table, DatePicker, Button, Flex, Typography, Spin } from 'antd'
import { FilePdfOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import { getRevenueCalculator, reportPdfPaths } from '@/services/reportService'
import type { RevenueCalculatorRow } from '@/types/report'
import { usePdfPreview } from '@/hooks/usePdfPreview'
import { PdfPreviewModal } from '@/components/common/PdfPreviewModal'
import { formatNumber } from '@/lib/utils'

const { Text } = Typography

interface RevenueCalculatorDialogProps {
  open: boolean
  onClose: () => void
}

export function RevenueCalculatorDialog({ open, onClose }: RevenueCalculatorDialogProps) {
  const [date, setDate] = useState<Dayjs>(dayjs())
  const pdf = usePdfPreview()

  const dateStr = date.format('YYYY-MM-DD')

  const query = useQuery({
    queryKey: ['revenue-calculator', dateStr],
    queryFn: () => getRevenueCalculator(dateStr),
    enabled: open,
  })

  const paymentMethods = query.data?.payment_methods ?? []

  const columns: ColumnsType<RevenueCalculatorRow> = [
    {
      title: 'البيان',
      dataIndex: 'label',
      key: 'label',
      render: (label: string) => <Text strong={label === 'الصافي'}>{label}</Text>,
    },
    ...paymentMethods.map((method) => ({
      title: method,
      key: method,
      align: 'center' as const,
      render: (_: unknown, row: RevenueCalculatorRow) => formatNumber((row.amounts[method] ?? 0).toFixed(2)),
    })),
    {
      title: 'الإجمالي',
      key: 'total',
      align: 'center' as const,
      render: (_: unknown, row: RevenueCalculatorRow) => <Text strong>{formatNumber(row.total.toFixed(2))}</Text>,
    },
  ]

  return (
    <>
      <Modal title="حاسبة الإيرادات" open={open} onCancel={onClose} width={720} destroyOnClose footer={null}>
        <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
          <DatePicker value={date} onChange={(value) => value && setDate(value)} format="YYYY-MM-DD" allowClear={false} />
          <Button
            type="primary"
            icon={<FilePdfOutlined />}
            loading={pdf.isLoading()}
            onClick={() => pdf.open(reportPdfPaths.revenueCalculator(dateStr), 'حاسبة الإيرادات')}
          >
            معاينة / طباعة PDF
          </Button>
        </Flex>
        <Spin spinning={query.isLoading}>
          <Table<RevenueCalculatorRow>
            rowKey="label"
            columns={columns}
            dataSource={query.data?.rows ?? []}
            pagination={false}
            size="small"
            bordered
          />
        </Spin>
      </Modal>
      <PdfPreviewModal url={pdf.url} title={pdf.title} onClose={pdf.close} />
    </>
  )
}
