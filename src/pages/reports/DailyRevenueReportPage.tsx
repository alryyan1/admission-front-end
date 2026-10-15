import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ConfigProvider, Card, DatePicker, Table, Typography, Flex, Button } from 'antd'
import { FileTextOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import { useAntTheme } from '@/lib/antdTheme'
import { PdfPreviewModal } from '@/components/common/PdfPreviewModal'
import { usePdfPreview } from '@/hooks/usePdfPreview'
import { getDailyRevenueReport, reportPdfPaths } from '@/services/reportService'
import { formatNumber } from '@/lib/utils'
import type { DailyRevenueDay } from '@/types/report'

const { Title, Text } = Typography

const ARABIC_WEEKDAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

export function DailyRevenueReportPage() {
  const antTheme = useAntTheme()
  const [month, setMonth] = useState<Dayjs>(() => dayjs())
  const pdf = usePdfPreview()

  const monthKey = month.format('YYYY-MM')

  const reportQuery = useQuery({
    queryKey: ['reports', 'daily-revenue', monthKey],
    queryFn: () => getDailyRevenueReport(monthKey),
  })

  const report = reportQuery.data

  const columns: ColumnsType<DailyRevenueDay> = [
    {
      title: 'اليوم',
      key: 'weekday',
      render: (_, day) => ARABIC_WEEKDAYS[dayjs(day.date).day()],
    },
    {
      title: 'التاريخ',
      key: 'date',
      render: (_, day) => dayjs(day.date).format('DD/MM/YYYY'),
    },
    ...(report?.payment_methods ?? []).map((method) => ({
      title: method.name,
      key: method.key,
      align: 'end' as const,
      render: (_: unknown, day: DailyRevenueDay) => formatNumber(day.amounts[method.key] ?? 0),
    })),
    {
      title: 'الإجمالي',
      key: 'total',
      align: 'end',
      render: (_, day) => <strong>{formatNumber(day.total)}</strong>,
    },
  ]

  return (
    <ConfigProvider direction="rtl" theme={antTheme}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={12} style={{ marginBottom: 16 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            الإيراد اليومي
          </Title>
          <Text type="secondary">المدفوعات لكل يوم من أيام الشهر مقسمة حسب طريقة الدفع</Text>
        </div>
        <Flex align="center" gap={8}>
          <DatePicker
            size="small"
            picker="month"
            value={month}
            onChange={(value) => value && setMonth(value)}
            allowClear={false}
            format="YYYY-MM"
          />
          <Button
            size="small"
            icon={<FileTextOutlined />}
            loading={pdf.isLoading()}
            onClick={() => pdf.open(reportPdfPaths.dailyRevenue(monthKey), 'معاينة تقرير الإيراد اليومي')}
          >
            معاينة PDF
          </Button>
        </Flex>
      </Flex>

      <Card size="small">
        <Table<DailyRevenueDay>
          size="small"
          rowKey="date"
          loading={reportQuery.isLoading}
          columns={columns}
          dataSource={report?.days ?? []}
          pagination={false}
          summary={() =>
            report && (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={2}>
                    <Text strong>إجمالي الشهر</Text>
                  </Table.Summary.Cell>
                  {report.payment_methods.map((method, index) => (
                    <Table.Summary.Cell key={method.key} index={index + 2} align="end">
                      <Text strong>{formatNumber(report.totals.amounts[method.key] ?? 0)}</Text>
                    </Table.Summary.Cell>
                  ))}
                  <Table.Summary.Cell index={report.payment_methods.length + 2} align="end">
                    <Text strong>{formatNumber(report.totals.total)}</Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )
          }
        />
      </Card>

      <PdfPreviewModal url={pdf.url} title={pdf.title} onClose={pdf.close} />
    </ConfigProvider>
  )
}
