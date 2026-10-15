import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ConfigProvider, Card, DatePicker, Table, Typography, Flex, Statistic, Row, Col } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import { useAntTheme } from '@/lib/antdTheme'
import { getDoctorEntitlementsReport } from '@/services/reportService'
import { formatNumber } from '@/lib/utils'
import type { DoctorEntitlementDoctorRow, PaymentMethodBreakdown } from '@/types/report'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

export function DoctorEntitlementsReportPage() {
  const antTheme = useAntTheme()
  const [range, setRange] = useState<[Dayjs, Dayjs]>(() => [dayjs().startOf('month'), dayjs().endOf('month')])

  const from = range[0].format('YYYY-MM-DD')
  const to = range[1].format('YYYY-MM-DD')
  const isRangeValid = !range[1].isBefore(range[0], 'day')

  const reportQuery = useQuery({
    queryKey: ['reports', 'doctor-entitlements', from, to],
    queryFn: () => getDoctorEntitlementsReport({ from, to }),
    enabled: isRangeValid,
  })

  const report = reportQuery.data

  const columns: ColumnsType<DoctorEntitlementDoctorRow> = [
    { title: 'الطبيب', dataIndex: 'name', key: 'name' },
    { title: 'الدور', key: 'role', render: (_, row) => row.role ?? '—' },
    {
      title: 'عدد العمليات',
      key: 'operations_count',
      align: 'center',
      render: (_, row) => formatNumber(row.operations_count),
    },
    {
      title: 'الإجمالي',
      key: 'total',
      align: 'end',
      render: (_, row) => <strong>{formatNumber(row.total)}</strong>,
    },
  ]

  const methodColumns: ColumnsType<PaymentMethodBreakdown> = [
    { title: 'طريقة الدفع', dataIndex: 'method', key: 'method' },
    { title: 'العدد', dataIndex: 'count', key: 'count', align: 'center', render: (value) => formatNumber(value) },
    {
      title: 'الإجمالي',
      key: 'total',
      align: 'end',
      render: (_, row) => <strong>{formatNumber(row.total)}</strong>,
    },
  ]

  return (
    <ConfigProvider direction="rtl" theme={antTheme}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={12} style={{ marginBottom: 16 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            استحقاقات الأطباء من العمليات
          </Title>
          <Text type="secondary">مبالغ استحقاقات أعضاء فريق العمليات حسب تاريخ إنشاء العملية</Text>
        </div>
        <RangePicker
          size="small"
          value={range}
          onChange={(value) => value?.[0] && value?.[1] && setRange([value[0], value[1]])}
          allowClear={false}
          status={isRangeValid ? undefined : 'error'}
          format="YYYY-MM-DD"
        />
      </Flex>

      {report && (
        <Flex gap={12} wrap="wrap" style={{ marginBottom: 16 }}>
          <Card size="small" style={{ minWidth: 160 }}>
            <Statistic title="عدد العمليات" value={report.summary.operations_count} />
          </Card>
          <Card size="small" style={{ minWidth: 160 }}>
            <Statistic title="إجمالي الاستحقاقات" value={formatNumber(report.summary.total)} />
          </Card>
        </Flex>
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card size="small" title="الاستحقاقات حسب الطبيب">
            <Table<DoctorEntitlementDoctorRow>
              size="small"
              rowKey="name"
              loading={reportQuery.isLoading}
              columns={columns}
              dataSource={report?.doctors ?? []}
              pagination={false}
              summary={() =>
                report && (
                  <Table.Summary fixed>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={2}>
                        <Text strong>الإجمالي</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} align="center">
                        <Text strong>{formatNumber(report.summary.operations_count)}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3} align="end">
                        <Text strong>{formatNumber(report.summary.total)}</Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                )
              }
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card size="small" title="الاستحقاقات حسب طريقة الدفع">
            <Table<PaymentMethodBreakdown>
              size="small"
              rowKey="method"
              loading={reportQuery.isLoading}
              columns={methodColumns}
              dataSource={report?.by_method ?? []}
              pagination={false}
              summary={() =>
                report && (
                  <Table.Summary fixed>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={2}>
                        <Text strong>الإجمالي</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} align="end">
                        <Text strong>{formatNumber(report.summary.total)}</Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                )
              }
            />
          </Card>
        </Col>
      </Row>
    </ConfigProvider>
  )
}
