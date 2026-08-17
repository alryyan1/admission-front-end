import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface DateRangeFilterProps {
  from: string
  to: string
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
}

export function DateRangeFilter({ from, to, onFromChange, onToChange }: DateRangeFilterProps) {
  return (
    <div className="mb-4 flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <Label htmlFor="range-from">من تاريخ</Label>
        <Input
          id="range-from"
          type="date"
          className="h-8 w-40"
          value={from}
          max={to}
          onChange={(e) => onFromChange(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="range-to">إلى تاريخ</Label>
        <Input
          id="range-to"
          type="date"
          className="h-8 w-40"
          value={to}
          min={from}
          onChange={(e) => onToChange(e.target.value)}
        />
      </div>
    </div>
  )
}
