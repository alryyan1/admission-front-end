import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card } from 'antd'
import { StatTile } from '@/components/statistics/StatTile'
import { PageLoader } from '@/components/common/PageLoader'
import { getAdmissionsStatistics, getOccupancyStatistics, getOperationsStatistics } from '@/services/statisticsService'
import { formatNumber } from '@/lib/utils'

export function DashboardPage() {
  const occupancyQuery = useQuery({ queryKey: ['statistics', 'occupancy'], queryFn: getOccupancyStatistics })
  const admissionsQuery = useQuery({
    queryKey: ['statistics', 'admissions', 'dashboard'],
    queryFn: () => getAdmissionsStatistics(),
  })
  const operationsQuery = useQuery({
    queryKey: ['statistics', 'operations', 'dashboard'],
    queryFn: () => getOperationsStatistics(),
  })

  const loading = occupancyQuery.isLoading || admissionsQuery.isLoading || operationsQuery.isLoading

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4">
        <h1 className="text-xl font-semibold">لوحة التحكم</h1>
        <p className="text-sm text-muted-foreground">نظرة عامة على الإشغال وحالات التنويم والعمليات اليوم.</p>
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
            <StatTile label="أسرّة متاحة" value={formatNumber(occupancyQuery.data?.summary.available_beds ?? 0)} />
            <StatTile label="أسرّة مشغولة" value={formatNumber(occupancyQuery.data?.summary.occupied_beds ?? 0)} />
            <StatTile label="نسبة إشغال الأسرّة" value={`${occupancyQuery.data?.summary.occupancy_rate ?? 0}%`} />
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatTile label="عمليات مجدولة اليوم" value={formatNumber(operationsQuery.data?.today.scheduled ?? 0)} />
            <StatTile label="عمليات مكتملة اليوم" value={formatNumber(operationsQuery.data?.today.completed ?? 0)} />
            <StatTile label="عمليات ملغاة اليوم" value={formatNumber(operationsQuery.data?.today.cancelled ?? 0)} />
            <StatTile
              label="متوسط مدة التنويم"
              value={
                admissionsQuery.data?.average_length_of_stay_hours != null
                  ? `${admissionsQuery.data.average_length_of_stay_hours} ساعة`
                  : '—'
              }
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
