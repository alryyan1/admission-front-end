import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { PageLoader } from '@/components/common/PageLoader'
import { formatDateTime } from '@/lib/utils'
import { getAllOperations } from '@/services/operationService'
import type { OperationStatus } from '@/types/admission'

const STATUS_LABELS: Record<OperationStatus, string> = {
  scheduled: 'مجدولة',
  in_progress: 'جارية',
  completed: 'مكتملة',
  cancelled: 'ملغاة',
}

const STATUS_VARIANTS: Record<OperationStatus, 'secondary' | 'warning' | 'success' | 'destructive'> = {
  scheduled: 'secondary',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'destructive',
}

export function OperationsPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<OperationStatus | 'all'>('all')
  const [date, setDate] = useState('')
  const [search, setSearch] = useState('')

  const operationsQuery = useQuery({
    queryKey: ['operations', status, date, search],
    queryFn: () =>
      getAllOperations({
        status: status === 'all' ? undefined : status,
        date: date || undefined,
        search: search || undefined,
      }),
  })

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">العمليات</h1>
      </div>

      <Card className="mb-4 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <Label>الحالة</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as OperationStatus | 'all')}>
              <SelectTrigger className="h-8 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="scheduled">مجدولة</SelectItem>
                <SelectItem value="in_progress">جارية</SelectItem>
                <SelectItem value="completed">مكتملة</SelectItem>
                <SelectItem value="cancelled">ملغاة</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="operations-date">التاريخ</Label>
            <Input id="operations-date" type="date" className="h-8 w-40" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="operations-search">بحث</Label>
            <Input
              id="operations-search"
              className="h-8 w-48"
              placeholder="اسم المريض أو الإجراء"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {operationsQuery.isLoading ? (
        <PageLoader />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم العملية</TableHead>
                <TableHead>المريض</TableHead>
                <TableHead>الإجراء</TableHead>
                <TableHead>الجراح</TableHead>
                <TableHead>غرفة العمليات</TableHead>
                <TableHead>الموعد</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {operationsQuery.data?.data.map((operation) => (
                <TableRow
                  key={operation.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/admissions/${operation.admission_id}`)}
                >
                  <TableCell>{operation.operation_number ?? '—'}</TableCell>
                  <TableCell>{operation.admission?.patient?.name ?? '—'}</TableCell>
                  <TableCell>{operation.procedure_name}</TableCell>
                  <TableCell>{operation.surgeon?.name ?? '—'}</TableCell>
                  <TableCell>{operation.operation_room?.room_number ?? '—'}</TableCell>
                  <TableCell>{formatDateTime(operation.scheduled_at)}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[operation.status]}>{STATUS_LABELS[operation.status]}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
