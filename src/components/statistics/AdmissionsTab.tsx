import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatTile } from '@/components/statistics/StatTile'
import { DateRangeFilter } from '@/components/statistics/DateRangeFilter'
import { formatDate, formatNumber } from '@/lib/utils'
import type { AdmissionsStatistics } from '@/types/statistics'

const STATUS_LABELS: Record<string, string> = {
  admitted: 'نشطة',
  discharged: 'مخرّجة',
  cancelled: 'ملغاة',
}

interface AdmissionsTabProps {
  data: AdmissionsStatistics
  from: string
  to: string
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
}

export function AdmissionsTab({ data, from, to, onFromChange, onToChange }: AdmissionsTabProps) {
  const totalInRange = Object.values(data.status_counts).reduce((sum, count) => sum + count, 0)

  return (
    <div className="flex flex-col gap-4">
      <DateRangeFilter from={from} to={to} onFromChange={onFromChange} onToChange={onToChange} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="الحالات النشطة حالياً" value={formatNumber(data.active_admissions)} />
        <StatTile label="حالات ضمن الفترة" value={formatNumber(totalInRange)} />
        <StatTile
          label="متوسط مدة الإقامة"
          value={data.average_length_of_stay_hours != null ? `${data.average_length_of_stay_hours} ساعة` : '—'}
        />
        <StatTile label="حالات ملغاة" value={formatNumber(data.status_counts.cancelled ?? 0)} />
      </div>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold">حالات التنويم يومياً</h2>
        {data.daily_trend.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.daily_trend} margin={{ left: 8, right: 8 }}>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="date" tickFormatter={(v) => formatDate(v)} stroke="var(--chart-muted)" fontSize={12} />
              <YAxis allowDecimals={false} stroke="var(--chart-muted)" fontSize={12} />
              <Tooltip
                labelFormatter={(v) => formatDate(v as string)}
                formatter={(value: number) => [formatNumber(value), 'حالات تنويم']}
                contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }}
              />
              <Line type="monotone" dataKey="total" stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">لا توجد بيانات ضمن الفترة المحددة</p>
        )}
      </Card>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-6">
          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold">الحالات حسب النوع</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>النوع</TableHead>
                  <TableHead>العدد</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(data.type_counts).map(([type, count]) => (
                  <TableRow key={type}>
                    <TableCell>{type || '—'}</TableCell>
                    <TableCell>{formatNumber(count)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
        <div className="col-span-12 md:col-span-6">
          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold">الحالات حسب الوضع</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الوضع</TableHead>
                  <TableHead>العدد</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(data.status_counts).map(([status, count]) => (
                  <TableRow key={status}>
                    <TableCell>{STATUS_LABELS[status] ?? status}</TableCell>
                    <TableCell>{formatNumber(count)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </div>
  )
}
