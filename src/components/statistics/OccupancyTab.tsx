import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { StatTile } from '@/components/statistics/StatTile'
import { formatNumber } from '@/lib/utils'
import type { OccupancyStatistics, WardOccupancy } from '@/types/statistics'

interface OccupancyTabProps {
  data: OccupancyStatistics
}

interface WardOccupancyRow extends WardOccupancy {
  occupancy_rate: number
}

const wardColumns: ColumnsType<WardOccupancyRow> = [
  { title: 'الطابق', dataIndex: 'floor_name', key: 'floor_name' },
  { title: 'الجناح', dataIndex: 'ward_name', key: 'ward_name' },
  { title: 'إجمالي الأسرّة', dataIndex: 'total_beds', key: 'total_beds', render: (v) => formatNumber(v) },
  { title: 'المشغولة', dataIndex: 'occupied_beds', key: 'occupied_beds', render: (v) => formatNumber(v) },
  { title: 'نسبة الإشغال', dataIndex: 'occupancy_rate', key: 'occupancy_rate', render: (v) => `${v}%` },
]

export function OccupancyTab({ data }: OccupancyTabProps) {
  const chartData: WardOccupancyRow[] = data.by_ward
    .map((ward) => ({
      ...ward,
      occupancy_rate: ward.total_beds > 0 ? Math.round((ward.occupied_beds / ward.total_beds) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.occupancy_rate - a.occupancy_rate)

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatTile label="إجمالي الأسرّة" value={formatNumber(data.summary.total_beds)} />
        <StatTile label="أسرّة مشغولة" value={formatNumber(data.summary.occupied_beds)} />
        <StatTile label="أسرّة متاحة" value={formatNumber(data.summary.available_beds)} />
        <StatTile label="تحت الصيانة" value={formatNumber(data.summary.maintenance_beds)} />
        <StatTile label="نسبة الإشغال" value={`${data.summary.occupancy_rate}%`} />
      </div>

      <Card>
        <h2 className="mb-3 text-sm font-semibold">نسبة الإشغال حسب الجناح</h2>
        <ResponsiveContainer width="100%" height={Math.max(chartData.length * 36, 120)}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 24 }}>
            <CartesianGrid horizontal={false} stroke="var(--chart-grid)" />
            <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} stroke="var(--chart-muted)" fontSize={12} />
            <YAxis type="category" dataKey="ward_name" width={110} stroke="var(--chart-muted)" fontSize={12} />
            <Tooltip
              formatter={(value: number) => [`${value}%`, 'نسبة الإشغال']}
              contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }}
            />
            <Bar dataKey="occupancy_rate" fill="var(--chart-1)" radius={[0, 4, 4, 0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold">تفاصيل الإشغال</h2>
        <Table rowKey="ward_id" columns={wardColumns} dataSource={chartData} pagination={false} />
      </Card>
    </div>
  )
}
