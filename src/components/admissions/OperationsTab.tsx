import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/utils'
import { getDoctors } from '@/services/patientService'
import { getOperationRooms } from '@/services/facilityService'
import type { Operation, OperationStatus } from '@/types/admission'

interface OperationsTabProps {
  operations: Operation[]
  onSchedule: (payload: {
    surgeon_id: number
    operation_room_id?: number | null
    procedure_name: string
    scheduled_at: string
    notes?: string
  }) => void
  onStart: (operationId: number) => void
  onComplete: (operationId: number) => void
  onCancel: (operationId: number, cancellationReason: string) => void
  isSubmitting: boolean
}

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

export function OperationsTab({ operations, onSchedule, onStart, onComplete, onCancel, isSubmitting }: OperationsTabProps) {
  const [surgeonId, setSurgeonId] = useState('')
  const [operationRoomId, setOperationRoomId] = useState('')
  const [procedureName, setProcedureName] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [notes, setNotes] = useState('')

  const doctorsQuery = useQuery({ queryKey: ['doctors', ''], queryFn: () => getDoctors() })
  const operationRoomsQuery = useQuery({ queryKey: ['rooms', 'operation'], queryFn: getOperationRooms })

  function handleSubmit() {
    if (!surgeonId || !procedureName.trim() || !scheduledAt) return
    onSchedule({
      surgeon_id: Number(surgeonId),
      operation_room_id: operationRoomId ? Number(operationRoomId) : undefined,
      procedure_name: procedureName,
      scheduled_at: scheduledAt,
      notes: notes || undefined,
    })
    setSurgeonId('')
    setOperationRoomId('')
    setProcedureName('')
    setScheduledAt('')
    setNotes('')
  }

  function handleCancel(operation: Operation) {
    const reason = window.prompt('سبب الإلغاء (اختياري):') ?? ''
    if (window.confirm('هل أنت متأكد من إلغاء هذه العملية؟')) {
      onCancel(operation.id, reason)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4">
        <h2 className="mb-2 text-sm font-semibold">جدولة عملية جديدة</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <Label>الجراح</Label>
            <Select value={surgeonId} onValueChange={setSurgeonId}>
              <SelectTrigger className="h-8 w-48">
                <SelectValue placeholder="اختر الجراح" />
              </SelectTrigger>
              <SelectContent>
                {(doctorsQuery.data ?? []).map((doctor) => (
                  <SelectItem key={doctor.id} value={String(doctor.id)}>
                    {doctor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label>غرفة العمليات</Label>
            <Select value={operationRoomId} onValueChange={setOperationRoomId}>
              <SelectTrigger className="h-8 w-44">
                <SelectValue placeholder="اختياري" />
              </SelectTrigger>
              <SelectContent>
                {(operationRoomsQuery.data ?? []).map((room) => (
                  <SelectItem key={room.id} value={String(room.id)}>
                    غرفة {room.room_number} — {room.ward?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="procedure-name">الإجراء</Label>
            <Input
              id="procedure-name"
              className="h-8 w-48"
              value={procedureName}
              onChange={(e) => setProcedureName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="scheduled-at">الموعد</Label>
            <Input
              id="scheduled-at"
              type="datetime-local"
              className="h-8 w-48"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
          <Button size="sm" onClick={handleSubmit} disabled={isSubmitting}>
            جدولة
          </Button>
        </div>
        <div className="mt-3 flex flex-col gap-1">
          <Label htmlFor="operation-notes">ملاحظات</Label>
          <Textarea
            id="operation-notes"
            className="max-w-md"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </Card>

      <Card>
        <div>
          {operations.map((operation, idx) => (
            <div key={operation.id}>
              {idx > 0 && <Separator />}
              <div className="flex items-center justify-between gap-4 p-4">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {operation.procedure_name}
                    <Badge variant={STATUS_VARIANTS[operation.status]}>{STATUS_LABELS[operation.status]}</Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {operation.operation_number ?? '—'} · د. {operation.surgeon?.name ?? '—'}
                    {operation.operation_room && ` · غرفة ${operation.operation_room.room_number}`}
                    {' · '}
                    {formatDateTime(operation.scheduled_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {operation.status === 'scheduled' && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => onStart(operation.id)}>
                        بدء
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleCancel(operation)}>
                        إلغاء
                      </Button>
                    </>
                  )}
                  {operation.status === 'in_progress' && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => onComplete(operation.id)}>
                        إنهاء
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleCancel(operation)}>
                        إلغاء
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          {operations.length === 0 && <p className="p-4 text-sm text-muted-foreground">لا توجد عمليات مجدولة بعد</p>}
        </div>
      </Card>
    </div>
  )
}
