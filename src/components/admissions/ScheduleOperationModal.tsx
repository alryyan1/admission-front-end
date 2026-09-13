import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  Box,
} from '@mui/material'
import dayjs, { APP_TIMEZONE } from '@/lib/dayjs'
import { getDoctors } from '@/services/patientService'
import { getTeamRoles } from '@/services/teamRoleService'
import { getProcedures } from '@/services/procedureService'
import type { Operation, Procedure } from '@/types/admission'
import type { Doctor } from '@/types/patient'

export interface OperationFormPayload {
  surgeon_id: number
  procedure_id: number
  price: number | null
  scheduled_at: string | null
}

interface ScheduleOperationModalProps {
  open: boolean
  onClose: () => void
  operation?: Operation | null
  onSchedule: (payload: OperationFormPayload) => Promise<unknown>
  onUpdate?: (operationId: number, payload: Partial<OperationFormPayload>) => Promise<unknown>
  isSubmitting: boolean
}

export function ScheduleOperationModal({
  open,
  onClose,
  operation,
  onSchedule,
  onUpdate,
  isSubmitting,
}: ScheduleOperationModalProps) {
  const [procedure, setProcedure] = useState<Procedure | null>(null)
  const [surgeon, setSurgeon] = useState<Doctor | null>(null)
  const [price, setPrice] = useState<number | null>(null)
  const [scheduledAt, setScheduledAt] = useState('')
  const surgeonInputRef = useRef<HTMLInputElement>(null)
  const priceInputRef = useRef<HTMLInputElement>(null)

  const proceduresQuery = useQuery({ queryKey: ['procedures', 'active'], queryFn: () => getProcedures({ active_only: true }) })
  const teamRolesQuery = useQuery({ queryKey: ['team-roles'], queryFn: getTeamRoles })
  const surgeonRoleId = teamRolesQuery.data?.find((r) => r.slug === 'surgeon')?.id
  const doctorsQuery = useQuery({
    queryKey: ['doctors', '', surgeonRoleId],
    queryFn: () => getDoctors(undefined, surgeonRoleId),
    enabled: surgeonRoleId !== undefined,
  })

  useEffect(() => {
    if (!open) {
      setProcedure(null)
      setSurgeon(null)
      setPrice(null)
      setScheduledAt('')
      return
    }
    if (operation) {
      setProcedure(operation.procedure ?? null)
      setSurgeon(operation.surgeon ?? null)
      setPrice(operation.price != null ? Number(operation.price) : null)
      setScheduledAt(operation.scheduled_at ? dayjs(operation.scheduled_at).tz().format('YYYY-MM-DDTHH:mm') : '')
    }
  }, [open, operation])

  async function handleSubmit() {
    if (!procedure || !surgeon) return
    try {
      const payload: OperationFormPayload = {
        procedure_id: procedure.id,
        surgeon_id: surgeon.id,
        price: price ?? null,
        scheduled_at: scheduledAt ? dayjs.tz(scheduledAt, APP_TIMEZONE).toISOString() : null,
      }
      if (operation) {
        await onUpdate?.(operation.id, payload)
      } else {
        await onSchedule(payload)
      }
    } catch {
      // request failed — surfaced by the global API error toast; keep the modal open for retry
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{operation ? 'تعديل العملية' : 'طلب عملية جديدة'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          <Autocomplete
            autoFocus
            options={proceduresQuery.data ?? []}
            // groupBy={(p) => p.category?.name ?? 'غير مصنفة'}
            getOptionLabel={(p) => p.name_ar}
            isOptionEqualToValue={(o, v) => o.id === v.id}
            loading={proceduresQuery.isLoading}
            value={procedure}
            onChange={(_, value) => {
              setProcedure(value)
              if (value) setTimeout(() => surgeonInputRef.current?.focus(), 0)
            }}
            renderInput={(params) => <TextField {...params} label="الإجراء المطلوب" required />}
          />

          <Autocomplete
            options={doctorsQuery.data ?? []}
            getOptionLabel={(d) => d.name}
            isOptionEqualToValue={(o, v) => o.id === v.id}
            loading={doctorsQuery.isLoading}
            value={surgeon}
            onChange={(_, value) => {
              setSurgeon(value)
              if (value) setTimeout(() => priceInputRef.current?.focus(), 0)
            }}
            renderInput={(params) => <TextField {...params} inputRef={surgeonInputRef} label="الجراح" required />}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              className="amount-input"
              inputRef={priceInputRef}
              label="سعر العملية"
              type="number"
              fullWidth
              placeholder="0"
              value={price ?? ''}
              onChange={(e) => setPrice(e.target.value === '' ? null : Number(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && procedure && surgeon) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
              slotProps={{ htmlInput: { min: 0, step: 1000 } }}
            />
            <TextField
              label="تاريخ العملية"
              type="datetime-local"
              fullWidth
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>إلغاء</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          loading={isSubmitting}
          disabled={!procedure || !surgeon}
        >
          {operation ? 'حفظ التعديلات' : 'طلب العملية'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
