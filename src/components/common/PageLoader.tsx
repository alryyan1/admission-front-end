import { CircularProgress } from '@mui/material'
import { cn } from '@/lib/utils'

export function PageLoader({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center py-16', className)}>
      <CircularProgress size={32} />
    </div>
  )
}
