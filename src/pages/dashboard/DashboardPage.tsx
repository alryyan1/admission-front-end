import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, DatePicker, Flex } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { PageLoader } from '@/components/common/PageLoader'
import { ServiceRevenueCard } from '@/components/statistics/ServiceRevenueCard'
import { OperationRevenueCard } from '@/components/statistics/OperationRevenueCard'
import { RoomRevenueCard } from '@/components/statistics/RoomRevenueCard'
import { FacilityOccupancySummary } from '@/components/facility/FacilityOccupancyMap'
import {
  getAdmissionsStatistics,
  getOperationRevenueStatistics,
  getServiceRevenueStatistics,
} from '@/services/statisticsService'
import { getAdmissionRevenueReport } from '@/services/reportService'
import { formatNumber } from '@/lib/utils'

const { RangePicker } = DatePicker

export function DashboardPage() {
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([dayjs().startOf('month'), dayjs().endOf('month')])
  const dateFrom = dateRange[0].format('YYYY-MM-DD')
  const dateTo = dateRange[1].format('YYYY-MM-DD')

  const serviceRevenueQuery = useQuery({
    queryKey: ['statistics', 'service-revenue', 'dashboard', dateFrom, dateTo],
    queryFn: () => getServiceRevenueStatistics({ from: dateFrom, to: dateTo }),
  })

  const operationRevenueQuery = useQuery({
    queryKey: ['statistics', 'operation-revenue', 'dashboard', dateFrom, dateTo],
    queryFn: () => getOperationRevenueStatistics({ from: dateFrom, to: dateTo }),
  })

  const roomRevenueQuery = useQuery({
    queryKey: ['reports', 'admission-revenue', 'dashboard', dateFrom, dateTo],
    queryFn: () => getAdmissionRevenueReport({ from: dateFrom, to: dateTo }),
  })

  const admissionsQuery = useQuery({
    queryKey: ['statistics', 'admissions', 'dashboard', dateFrom, dateTo],
    queryFn: () => getAdmissionsStatistics({ from: dateFrom, to: dateTo }),
  })
  const admittedCount = Object.values(admissionsQuery.data?.status_counts ?? {}).reduce((sum, n) => sum + n, 0)

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4">
        <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
          <div>
            <h1 className="text-xl font-semibold">لوحة التحكم</h1>
            <p className="text-sm text-muted-foreground">نظرة عامة على الإيرادات خلال الفترة المحددة.</p>
          </div>
          <Flex align="center" gap={16}>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">عدد المرضى المسجلين خلال الفترة المحددة</p>
              <p className="text-lg font-semibold">{formatNumber(admittedCount)}</p>
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
        </Flex>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          {serviceRevenueQuery.isLoading ? (
            <PageLoader />
          ) : serviceRevenueQuery.data ? (
            <ServiceRevenueCard data={serviceRevenueQuery.data} />
          ) : null}

          {operationRevenueQuery.isLoading ? (
            <PageLoader />
          ) : operationRevenueQuery.data ? (
            <OperationRevenueCard data={operationRevenueQuery.data} />
          ) : null}

          {roomRevenueQuery.isLoading ? (
            <PageLoader />
          ) : roomRevenueQuery.data ? (
            <RoomRevenueCard data={roomRevenueQuery.data} />
          ) : null}
        </div>

        <FacilityOccupancySummary />
      </div>
    </div>
  )
}
