import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DateRangeFilter } from '@/components/statistics/DateRangeFilter'
import { formatNumber } from '@/lib/utils'
import type { DoctorsServicesStatistics } from '@/types/statistics'

interface DoctorsServicesTabProps {
  data: DoctorsServicesStatistics
  from: string
  to: string
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
}

export function DoctorsServicesTab({ data, from, to, onFromChange, onToChange }: DoctorsServicesTabProps) {
  return (
    <div className="flex flex-col gap-4">
      <DateRangeFilter from={from} to={to} onFromChange={onFromChange} onToChange={onToChange} />

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-6">
          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold">الأطباء الأكثر استقبالاً للحالات</h2>
            {data.top_doctors.length > 0 ? (
              <ResponsiveContainer width="100%" height={Math.max(data.top_doctors.length * 36, 120)}>
                <BarChart data={data.top_doctors} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid horizontal={false} stroke="var(--chart-grid)" />
                  <XAxis type="number" allowDecimals={false} stroke="var(--chart-muted)" fontSize={12} />
                  <YAxis type="category" dataKey="name" width={110} stroke="var(--chart-muted)" fontSize={12} />
                  <Tooltip
                    formatter={(value: number) => [formatNumber(value), 'عدد الحالات']}
                    contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }}
                  />
                  <Bar dataKey="admissions_count" fill="var(--chart-1)" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">لا توجد بيانات ضمن الفترة المحددة</p>
            )}
            <Table className="mt-3">
              <TableHeader>
                <TableRow>
                  <TableHead>الطبيب</TableHead>
                  <TableHead>التخصص</TableHead>
                  <TableHead>عدد الحالات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.top_doctors.map((doctor) => (
                  <TableRow key={doctor.id}>
                    <TableCell>{doctor.name}</TableCell>
                    <TableCell>{doctor.specialist ?? '—'}</TableCell>
                    <TableCell>{formatNumber(doctor.admissions_count)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>

        <div className="col-span-12 md:col-span-6">
          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold">الخدمات الأكثر طلباً</h2>
            {data.top_services.length > 0 ? (
              <ResponsiveContainer width="100%" height={Math.max(data.top_services.length * 36, 120)}>
                <BarChart data={data.top_services} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid horizontal={false} stroke="var(--chart-grid)" />
                  <XAxis type="number" stroke="var(--chart-muted)" fontSize={12} />
                  <YAxis type="category" dataKey="name" width={110} stroke="var(--chart-muted)" fontSize={12} />
                  <Tooltip
                    formatter={(value: number) => [formatNumber(value), 'الإيراد']}
                    contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }}
                  />
                  <Bar dataKey="total_revenue" fill="var(--chart-1)" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">لا توجد بيانات ضمن الفترة المحددة</p>
            )}
            <Table className="mt-3">
              <TableHeader>
                <TableRow>
                  <TableHead>الخدمة</TableHead>
                  <TableHead>الكمية</TableHead>
                  <TableHead>الإيراد</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.top_services.map((service) => (
                  <TableRow key={service.name}>
                    <TableCell>{service.name}</TableCell>
                    <TableCell>{formatNumber(service.total_quantity)}</TableCell>
                    <TableCell>{formatNumber(service.total_revenue)}</TableCell>
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
