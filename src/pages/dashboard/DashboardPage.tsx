import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, DatePicker, Flex } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { StatTile } from '@/components/statistics/StatTile'
import { PageLoader } from '@/components/common/PageLoader'
import {
  getAdmissionsStatistics,
  getFinancialStatistics,
  getOccupancyStatistics,
  getOperationsStatistics,
} from '@/services/statisticsService'
import { formatNumber } from '@/lib/utils'

const { RangePicker } = DatePicker

export function DashboardPage() {
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([dayjs(), dayjs()])
  const dateFrom = dateRange[0].format('YYYY-MM-DD')
  const dateTo = dateRange[1].format('YYYY-MM-DD')

  const occupancyQuery = useQuery({ queryKey: ['statistics', 'occupancy'], queryFn: getOccupancyStatistics })
  const admissionsQuery = useQuery({
    queryKey: ['statistics', 'admissions', 'dashboard', dateFrom, dateTo],
    queryFn: () => getAdmissionsStatistics({ from: dateFrom, to: dateTo }),
  })
  const operationsQuery = useQuery({
    queryKey: ['statistics', 'operations', 'dashboard'],
    queryFn: () => getOperationsStatistics(),
  })
  const financialsQuery = useQuery({
    queryKey: ['statistics', 'financials', 'dashboard', dateFrom, dateTo],
    queryFn: () => getFinancialStatistics({ from: dateFrom, to: dateTo }),
  })

  const loading =
    occupancyQuery.isLoading || admissionsQuery.isLoading || operationsQuery.isLoading || financialsQuery.isLoading

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4">
        <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
          <div>
            <h1 className="text-xl font-semibold">لوحة التحكم</h1>
            <p className="text-sm text-muted-foreground">نظرة عامة على الإشغال وحالات التنويم والعمليات اليوم.</p>
          </div>
          <RangePicker
            value={dateRange}
            onChange={(values) => {
              if (values && values[0] && values[1]) {
                setDateRange([values[0], values[1]])
              }
            }}
            allowClear={false}
            format="YYYY-MM-DD"
          />
        </Flex>
      </Card>

      {loading ? (
        <PageLoader />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatTile
              label="المرضى المنومون حالياً"
              value={formatNumber(admissionsQuery.data?.active_admissions ?? 0)}
            />
            <StatTile
              label="أسرّة متاحة (إقامة قصيرة)"
              value={formatNumber(occupancyQuery.data?.summary.available_short_stay_beds ?? 0)}
            />
            <StatTile label="غرف متاحة" value={formatNumber(occupancyQuery.data?.summary.available_rooms ?? 0)} />
            <StatTile label="عمليات مجدولة اليوم" value={formatNumber(operationsQuery.data?.today.scheduled ?? 0)} />
            <StatTile
              label="غرف إقامة قصيرة"
              value={formatNumber(occupancyQuery.data?.summary.short_stay_rooms_total ?? 0)}
            />
            <StatTile
              label="غرف إقامة عادية"
              value={formatNumber(occupancyQuery.data?.summary.regular_rooms_total ?? 0)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatTile label="إجمالي الإيرادات" value={formatNumber(financialsQuery.data?.deposits_total ?? 0)} />
            <StatTile label="إجمالي الاستحقاقات" value={formatNumber(financialsQuery.data?.entitlements_total ?? 0)} />
            <StatTile label="إجمالي المصروفات" value={formatNumber(financialsQuery.data?.expenses_total ?? 0)} />
            <StatTile
              label="الصافي"
              value={formatNumber(financialsQuery.data?.net_total ?? 0)}
              valueClassName={(financialsQuery.data?.net_total ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}
            />
          </div>

          <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <h2 className="text-sm font-semibold">تقارير مفصّلة حسب الطبيب والقسم</h2>
              <p className="text-sm text-muted-foreground">
                إشغال الأجنحة، الأطباء الأكثر استقبالاً للحالات، والعمليات حسب الجراح.
              </p>
            </div>
            <Link to="/statistics" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
              عرض التقارير الكاملة ←
            </Link>
          </Card>
        </>
      )}
    </div>
  )
}
