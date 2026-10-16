import { Card } from 'antd'
import { StatTile } from '@/components/statistics/StatTile'
import { cn, formatNumber } from '@/lib/utils'
import type { FinancialStatistics } from '@/types/statistics'

interface NetProfitCardProps {
  data: FinancialStatistics
}

/** Cash-basis net profit for the dashboard's date range: collected deposits minus doctor/team entitlements and expenses. */
export function NetProfitCard({ data }: NetProfitCardProps) {
  const isProfit = data.net_total >= 0

  return (
    <Card>
      <h2 className="mb-3 text-sm font-semibold">صافي الربح (نقدي)</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatTile label="المحصّل" value={formatNumber(data.deposits_total)} />
        <StatTile label="استحقاقات الفريق الطبي" value={formatNumber(data.entitlements_total)} />
        <StatTile label="المصروفات" value={formatNumber(data.expenses_total)} />
        <StatTile label="فواتير غير مسددة" value={formatNumber(data.outstanding_total)} />
        <StatTile
          label="صافي الربح"
          value={formatNumber(data.net_total)}
          valueClassName={cn(isProfit ? 'text-green-600' : 'text-red-600')}
        />
      </div>
    </Card>
  )
}
