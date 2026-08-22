import { Card } from 'antd'
import { cn } from '@/lib/utils'

interface StatTileProps {
  label: string
  value: string
  className?: string
}

export function StatTile({ label, value, className }: StatTileProps) {
  return (
    <Card className={cn(className)}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </Card>
  )
}
