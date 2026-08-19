import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatTile } from '@/components/statistics/StatTile'
import { DateRangeFilter } from '@/components/statistics/DateRangeFilter'
import { formatDate, formatNumber } from '@/lib/utils'
import type { FinancialStatistics } from '@/types/statistics'

const METHOD_LABELS: Record<string, string> = {
  cash: 'نقدي',
  bank: 'بنكي',
  fawry: 'فوري',
  ocash: 'أوكاش',
}

const CATEGORICAL_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)']

interface FinancialsTabProps {
  data: FinancialStatistics
  from: string
  to: string
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
}

export function FinancialsTab({ data, from, to, onFromChange, onToChange }: FinancialsTabProps) {
  const depositsByMethod = Object.entries(data.deposits_by_method).map(([method, total]) => ({
    method,
    label: METHOD_LABELS[method] ?? method,
    total,
  }))

  return (
    <div className="flex flex-col gap-4">
      <DateRangeFilter from={from} to={to} onFromChange={onFromChange} onToChange={onToChange} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="إجمالي المحصّل" value={formatNumber(data.paid_total)} />
        <StatTile label="فواتير غير مسددة" value={formatNumber(data.outstanding_total)} />
        <StatTile label="إجمالي الودائع" value={formatNumber(data.deposits_total)} />
        <StatTile label="إجمالي الخدمات" value={formatNumber(data.services_total)} />
      </div>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold">التحصيل اليومي</h2>
        {data.daily_revenue.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.daily_revenue} margin={{ left: 8, right: 8 }}>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="date" tickFormatter={(v) => formatDate(v)} stroke="var(--chart-muted)" fontSize={12} />
              <YAxis stroke="var(--chart-muted)" fontSize={12} />
              <Tooltip
                labelFormatter={(v) => formatDate(v as string)}
                formatter={(value: number) => [formatNumber(value), 'المحصّل']}
                contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }}
              />
              <Bar dataKey="total" fill="var(--chart-1)" radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">لا توجد بيانات ضمن الفترة المحددة</p>
        )}
      </Card>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-6">
          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold">الودائع حسب طريقة الدفع</h2>
            {depositsByMethod.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={depositsByMethod} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                  <XAxis dataKey="label" stroke="var(--chart-muted)" fontSize={12} />
                  <YAxis stroke="var(--chart-muted)" fontSize={12} />
                  <Tooltip
                    formatter={(value: number) => [formatNumber(value), 'المبلغ']}
                    contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }}
                  />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]} barSize={24}>
                    {depositsByMethod.map((entry, index) => (
                      <Cell key={entry.method} fill={CATEGORICAL_COLORS[index % CATEGORICAL_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">لا توجد بيانات ضمن الفترة المحددة</p>
            )}
          </Card>
        </div>
        <div className="col-span-12 md:col-span-6">
          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold">تفاصيل الودائع</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الطريقة</TableHead>
                  <TableHead>المبلغ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {depositsByMethod.map((row) => (
                  <TableRow key={row.method}>
                    <TableCell>{row.label}</TableCell>
                    <TableCell>{formatNumber(row.total)}</TableCell>
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
