import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { StatTile } from '@/components/statistics/StatTile'
import { DateRangeFilter } from '@/components/statistics/DateRangeFilter'
import { formatNumber } from '@/lib/utils'
import type { OperationsStatistics, TopSurgeon } from '@/types/statistics'

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'مجدولة',
  in_progress: 'جارية',
  completed: 'مكتملة',
  cancelled: 'ملغاة',
}

interface StatusCountRow {
  status: string
  count: number
}

const statusColumns: ColumnsType<StatusCountRow> = [
  { title: 'الحالة', dataIndex: 'status', key: 'status', render: (v) => STATUS_LABELS[v] ?? v },
  { title: 'العدد', dataIndex: 'count', key: 'count', render: (v) => formatNumber(v) },
]

const surgeonColumns: ColumnsType<TopSurgeon> = [
  { title: 'الجراح', dataIndex: 'name', key: 'name', render: (v) => v ?? '—' },
  { title: 'التخصص', dataIndex: 'specialist', key: 'specialist', render: (v) => v ?? '—' },
  { title: 'إجمالي العمليات', dataIndex: 'total', key: 'total', render: (v) => formatNumber(v) },
  { title: 'مكتملة', dataIndex: 'completed_count', key: 'completed_count', render: (v) => formatNumber(v) },
  { title: 'ملغاة', dataIndex: 'cancelled_count', key: 'cancelled_count', render: (v) => formatNumber(v) },
]

interface OperationsTabProps {
  data: OperationsStatistics
  from: string
  to: string
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
}

export function OperationsTab({ data, from, to, onFromChange, onToChange }: OperationsTabProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatTile label="عمليات مجدولة اليوم" value={formatNumber(data.today.scheduled)} />
        <StatTile label="عمليات مكتملة اليوم" value={formatNumber(data.today.completed)} />
        <StatTile label="عمليات ملغاة اليوم" value={formatNumber(data.today.cancelled)} />
      </div>

      <DateRangeFilter from={from} to={to} onFromChange={onFromChange} onToChange={onToChange} />

      <Card>
        <h2 className="mb-3 text-sm font-semibold">العمليات حسب الحالة (ضمن الفترة)</h2>
        <Table
          rowKey="status"
          columns={statusColumns}
          dataSource={Object.entries(data.status_counts).map(([status, count]) => ({ status, count }))}
          pagination={false}
        />
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold">العمليات حسب الجراح</h2>
        {data.by_surgeon.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(data.by_surgeon.length * 36, 120)}>
            <BarChart data={data.by_surgeon} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid horizontal={false} stroke="var(--chart-grid)" />
              <XAxis type="number" allowDecimals={false} stroke="var(--chart-muted)" fontSize={12} />
              <YAxis type="category" dataKey="name" width={110} stroke="var(--chart-muted)" fontSize={12} />
              <Tooltip
                formatter={(value: number) => [formatNumber(value), 'عدد العمليات']}
                contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }}
              />
              <Bar dataKey="total" fill="var(--chart-1)" radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">لا توجد بيانات ضمن الفترة المحددة</p>
        )}
        <Table
          className="mt-3"
          rowKey="id"
          columns={surgeonColumns}
          dataSource={data.by_surgeon}
          pagination={false}
        />
      </Card>
    </div>
  )
}
