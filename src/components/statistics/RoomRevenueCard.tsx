import { Card, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { formatNumber } from '@/lib/utils'
import type { AdmissionRevenueReport, RoomTypeRevenueBreakdown } from '@/types/report'

interface RoomRevenueCardProps {
  data: AdmissionRevenueReport
}

const columns: ColumnsType<RoomTypeRevenueBreakdown> = [
  { title: 'نوع الغرفة', dataIndex: 'room_type_name', key: 'room_type_name' },
  { title: 'إيراد محصل', dataIndex: 'total', key: 'total', render: (v) => formatNumber(v) },
]

/** Accommodation fee revenue by room type, for the dashboard's date range. */
export function RoomRevenueCard({ data }: RoomRevenueCardProps) {
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">إيراد الإقامة</h2>
        <span className="text-sm font-semibold text-muted-foreground">
          الإجمالي: {formatNumber(data.summary.room_revenue)}
        </span>
      </div>

      <Table
        className="mt-3"
        size="small"
        rowKey={(row) => row.room_type_code ?? 'unknown'}
        columns={columns}
        dataSource={data.by_room_type}
        pagination={false}
      />
    </Card>
  )
}
