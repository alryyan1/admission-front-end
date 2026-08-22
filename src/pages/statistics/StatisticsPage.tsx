import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, Tabs } from 'antd'
import { PageLoader } from '@/components/common/PageLoader'
import {
  getAdmissionsStatistics,
  getDoctorsServicesStatistics,
  getFinancialStatistics,
  getOccupancyStatistics,
  getOperationsStatistics,
} from '@/services/statisticsService'
import { OccupancyTab } from '@/components/statistics/OccupancyTab'
import { AdmissionsTab } from '@/components/statistics/AdmissionsTab'
import { FinancialsTab } from '@/components/statistics/FinancialsTab'
import { DoctorsServicesTab } from '@/components/statistics/DoctorsServicesTab'
import { OperationsTab } from '@/components/statistics/OperationsTab'

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10)
}

const now = new Date()
const DEFAULT_FROM = toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1))
const DEFAULT_TO = toDateInputValue(new Date(now.getFullYear(), now.getMonth() + 1, 0))

export function StatisticsPage() {
  const [tab, setTab] = useState('occupancy')
  const [from, setFrom] = useState(DEFAULT_FROM)
  const [to, setTo] = useState(DEFAULT_TO)

  const range = { from, to }

  const occupancyQuery = useQuery({
    queryKey: ['statistics', 'occupancy'],
    queryFn: getOccupancyStatistics,
    enabled: tab === 'occupancy',
  })

  const admissionsQuery = useQuery({
    queryKey: ['statistics', 'admissions', range],
    queryFn: () => getAdmissionsStatistics(range),
    enabled: tab === 'admissions',
  })

  const financialsQuery = useQuery({
    queryKey: ['statistics', 'financials', range],
    queryFn: () => getFinancialStatistics(range),
    enabled: tab === 'financials',
  })

  const doctorsServicesQuery = useQuery({
    queryKey: ['statistics', 'doctors-services', range],
    queryFn: () => getDoctorsServicesStatistics(range),
    enabled: tab === 'doctors-services',
  })

  const operationsQuery = useQuery({
    queryKey: ['statistics', 'operations', range],
    queryFn: () => getOperationsStatistics(range),
    enabled: tab === 'operations',
  })

  return (
    <div>
      <Card className="mb-4">
        <h1 className="text-xl font-semibold">الإحصائيات</h1>
        <p className="text-sm text-muted-foreground">نظرة عامة على الإشغال وحالات التنويم والماليات.</p>
      </Card>

      <Tabs
        activeKey={tab}
        onChange={setTab}
        className="mb-4"
        items={[
          { key: 'occupancy', label: 'الإشغال' },
          { key: 'admissions', label: 'حالات التنويم' },
          { key: 'financials', label: 'الماليات' },
          { key: 'doctors-services', label: 'الأطباء والخدمات' },
          { key: 'operations', label: 'العمليات' },
        ]}
      />

      {tab === 'occupancy' &&
        (occupancyQuery.data ? (
          <OccupancyTab data={occupancyQuery.data} />
        ) : (
          <PageLoader />
        ))}

      {tab === 'admissions' &&
        (admissionsQuery.data ? (
          <AdmissionsTab data={admissionsQuery.data} from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
        ) : (
          <PageLoader />
        ))}

      {tab === 'financials' &&
        (financialsQuery.data ? (
          <FinancialsTab data={financialsQuery.data} from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
        ) : (
          <PageLoader />
        ))}

      {tab === 'doctors-services' &&
        (doctorsServicesQuery.data ? (
          <DoctorsServicesTab
            data={doctorsServicesQuery.data}
            from={from}
            to={to}
            onFromChange={setFrom}
            onToChange={setTo}
          />
        ) : (
          <PageLoader />
        ))}

      {tab === 'operations' &&
        (operationsQuery.data ? (
          <OperationsTab data={operationsQuery.data} from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
        ) : (
          <PageLoader />
        ))}
    </div>
  )
}
