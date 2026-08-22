import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DateRangeFilter } from '@/components/statistics/DateRangeFilter'
import { formatNumber } from '@/lib/utils'
import type { DoctorsServicesStatistics, TopDoctor, TopService } from '@/types/statistics'

interface DoctorsServicesTabProps {
  data: DoctorsServicesStatistics
  from: string
  to: string
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
}

const doctorColumns: ColumnsType<TopDoctor> = [
  { title: 'الطبيب', dataIndex: 'name', key: 'name' },
  { title: 'التخصص', dataIndex: 'specialist', key: 'specialist', render: (v) => v ?? '—' },
  {
    title: 'عدد الحالات',
    dataIndex: 'admissions_count',
    key: 'admissions_count',
    render: (v) => formatNumber(v),
  },
]

const serviceColumns: ColumnsType<TopService> = [
  { title: 'الخدمة', dataIndex: 'name', key: 'name' },
  {
    title: 'الكمية',
    dataIndex: 'total_quantity',
    key: 'total_quantity',
    render: (v) => formatNumber(v),
  },
  {
    title: 'الإيراد',
    dataIndex: 'total_revenue',
    key: 'total_revenue',
    render: (v) => formatNumber(v),
  },
]

export function DoctorsServicesTab({ data, from, to, onFromChange, onToChange }: DoctorsServicesTabProps) {
  return (
    <div className="flex flex-col gap-4">
      <DateRangeFilter from={from} to={to} onFromChange={onFromChange} onToChange={onToChange} />

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-6">
          <Card>
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
            <Table
              className="mt-3"
              rowKey="id"
              columns={doctorColumns}
              dataSource={data.top_doctors}
              pagination={false}
            />
          </Card>
        </div>

        <div className="col-span-12 md:col-span-6">
          <Card>
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
            <Table
              className="mt-3"
              rowKey="name"
              columns={serviceColumns}
              dataSource={data.top_services}
              pagination={false}
            />
          </Card>
        </div>
      </div>
    </div>
  )
}
