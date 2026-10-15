import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { formatNumber } from '@/lib/utils'
import type { ServiceRevenueStatistics, TopService } from '@/types/statistics'

interface ServiceRevenueCardProps {
  data: ServiceRevenueStatistics
}

const columns: ColumnsType<TopService> = [
  { title: 'الخدمة', dataIndex: 'name', key: 'name' },
  // { title: 'العدد', dataIndex: 'total_quantity', key: 'total_quantity', render: (v) => formatNumber(v) },
  { title: 'إيراد محصل', dataIndex: 'total_revenue', key: 'total_revenue', render: (v) => formatNumber(v) },
]

/** Revenue per requested service (excluding accommodation fees), for the dashboard's date range. */
export function ServiceRevenueCard({ data }: ServiceRevenueCardProps) {
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">إيراد الخدمات</h2>
        <span className="text-sm font-semibold text-muted-foreground">
          الإجمالي: {formatNumber(data.total_revenue)}
        </span>
      </div>

   

      <Table className="mt-3" rowKey="name" columns={columns} dataSource={data.services} pagination={false} />
    </Card>
  )
}
