import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ConfigProvider, Card, DatePicker, Select, Table, Typography, Flex, Statistic, Empty } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import { useAntTheme } from '@/lib/antdTheme'
import { getDoctorRevenueReport } from '@/services/reportService'
import { getDoctors } from '@/services/patientService'
import { formatNumber } from '@/lib/utils'
import type { DoctorRevenueAdmissionRow } from '@/types/report'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

interface PatientRevenueRow {
  patient_id: number
  patient_name: string | null
  admissions_count: number
  stay_days: number
  room_revenue: number
  services_revenue: number
  operations_revenue: number
  total_revenue: number
}

function groupByPatient(admissions: DoctorRevenueAdmissionRow[]): PatientRevenueRow[] {
  const byPatient = new Map<number, PatientRevenueRow>()

  for (const row of admissions) {
    const existing = byPatient.get(row.patient_id)
    if (existing) {
      existing.admissions_count += 1
      existing.stay_days += row.stay_days
      existing.room_revenue += row.room_revenue
      existing.services_revenue += row.services_revenue
      existing.operations_revenue += row.operations_revenue
      existing.total_revenue += row.total_revenue
      continue
    }
    byPatient.set(row.patient_id, {
      patient_id: row.patient_id,
      patient_name: row.patient_name,
      admissions_count: 1,
      stay_days: row.stay_days,
      room_revenue: row.room_revenue,
      services_revenue: row.services_revenue,
      operations_revenue: row.operations_revenue,
      total_revenue: row.total_revenue,
    })
  }

  return [...byPatient.values()].sort((a, b) => b.total_revenue - a.total_revenue)
}

/** Per-patient revenue breakdown (accommodation / services / operations) for a referring doctor's patients. */
export function ReferringDoctorRevenueReportPage() {
  const antTheme = useAntTheme()
  const [doctorId, setDoctorId] = useState<number | null>(null)
  const [range, setRange] = useState<[Dayjs, Dayjs]>(() => [dayjs().startOf('month'), dayjs().endOf('month')])

  const from = range[0].format('YYYY-MM-DD')
  const to = range[1].format('YYYY-MM-DD')
  const isRangeValid = !range[1].isBefore(range[0], 'day')

  const doctorsQuery = useQuery({ queryKey: ['doctors', ''], queryFn: () => getDoctors(), staleTime: Infinity })

  const reportQuery = useQuery({
    queryKey: ['reports', 'doctor-revenue', 'referring', doctorId, from, to],
    queryFn: () => getDoctorRevenueReport({ doctor_id: doctorId!, doctor_role: 'referring', from, to }),
    enabled: !!doctorId && isRangeValid,
  })

  const report = reportQuery.data
  const patientRows = useMemo(() => groupByPatient(report?.admissions ?? []), [report])

  const columns: ColumnsType<PatientRevenueRow> = [
    { title: 'المريض', dataIndex: 'patient_name', key: 'patient_name', render: (v) => v ?? '—' },
    {
      title: 'عدد التنويمات',
      key: 'admissions_count',
      align: 'center',
      render: (_, row) => formatNumber(row.admissions_count),
    },
    {
      title: 'عدد أيام الإقامة',
      key: 'stay_days',
      align: 'center',
      render: (_, row) => formatNumber(row.stay_days),
    },
    {
      title: 'إيراد الإقامة',
      key: 'room_revenue',
      align: 'end',
      render: (_, row) => formatNumber(row.room_revenue),
    },
    {
      title: 'إيراد الخدمات',
      key: 'services_revenue',
      align: 'end',
      render: (_, row) => formatNumber(row.services_revenue),
    },
    {
      title: 'إيراد العمليات',
      key: 'operations_revenue',
      align: 'end',
      render: (_, row) => formatNumber(row.operations_revenue),
    },
    {
      title: 'الإجمالي',
      key: 'total_revenue',
      align: 'end',
      render: (_, row) => <strong>{formatNumber(row.total_revenue)}</strong>,
    },
  ]

  return (
    <ConfigProvider direction="rtl" theme={antTheme}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={12} style={{ marginBottom: 16 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            إيراد مرضى الطبيب المحول
          </Title>
          <Text type="secondary">إيراد الإقامة والخدمات والعمليات لكل مريض محوّل من الطبيب المحدد</Text>
        </div>
        <Flex gap={8} wrap="wrap">
          <Select
            style={{ width: 240 }}
            placeholder="اختر الطبيب المحول"
            allowClear
            showSearch
            optionFilterProp="label"
            loading={doctorsQuery.isLoading}
            value={doctorId ?? undefined}
            onChange={(value) => setDoctorId(value ?? null)}
            options={(doctorsQuery.data ?? []).map((d) => ({ label: d.name, value: d.id }))}
          />
          <RangePicker
            size="small"
            value={range}
            onChange={(value) => value?.[0] && value?.[1] && setRange([value[0], value[1]])}
            allowClear={false}
            status={isRangeValid ? undefined : 'error'}
            format="YYYY-MM-DD"
          />
        </Flex>
      </Flex>

      {!doctorId && (
        <Card>
          <Empty description="اختر طبيبًا محولًا لعرض تقرير الإيرادات الخاص بمرضاه" />
        </Card>
      )}

      {report && (
        <>
          <Flex gap={12} wrap="wrap" style={{ marginBottom: 16 }}>
            <Card size="small" style={{ minWidth: 150 }}>
              <Statistic title="عدد المرضى" value={report.summary.patients_count} />
            </Card>
            <Card size="small" style={{ minWidth: 150 }}>
              <Statistic title="عدد التنويمات" value={report.summary.admissions_count} />
            </Card>
            <Card size="small" style={{ minWidth: 150 }}>
              <Statistic title="إيراد الإقامة" value={formatNumber(report.summary.room_revenue)} />
            </Card>
            <Card size="small" style={{ minWidth: 150 }}>
              <Statistic title="إيراد الخدمات" value={formatNumber(report.summary.services_revenue)} />
            </Card>
            <Card size="small" style={{ minWidth: 150 }}>
              <Statistic title="إيراد العمليات" value={formatNumber(report.summary.operations_revenue)} />
            </Card>
            <Card size="small" style={{ minWidth: 150 }}>
              <Statistic
                title="الإجمالي"
                value={formatNumber(report.summary.total_revenue)}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Flex>

          <Card size="small" title="الإيراد حسب المريض">
            <Table<PatientRevenueRow>
              size="small"
              rowKey="patient_id"
              loading={reportQuery.isLoading}
              columns={columns}
              dataSource={patientRows}
              pagination={false}
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={2}>
                      <Text strong>الإجمالي</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} align="center">
                      <Text strong>{formatNumber(report.summary.stay_days_count)}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align="end">
                      <Text strong>{formatNumber(report.summary.room_revenue)}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4} align="end">
                      <Text strong>{formatNumber(report.summary.services_revenue)}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={5} align="end">
                      <Text strong>{formatNumber(report.summary.operations_revenue)}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={6} align="end">
                      <Text strong>{formatNumber(report.summary.total_revenue)}</Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </Card>
        </>
      )}
    </ConfigProvider>
  )
}
