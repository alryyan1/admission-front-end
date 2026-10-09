import { useState } from 'react'
import {
  Card,
  CardHeader,
  CardContent,
  Stack,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography,
  Tooltip,
  Badge,
  Chip,
} from '@mui/material'
import { EditOutlined, TeamOutlined } from '@ant-design/icons'
import { formatDateTime } from '@/lib/utils'
import { ScheduleOperationModal, type OperationFormPayload } from '@/components/admissions/ScheduleOperationModal'
import { OperationPriceCell } from '@/components/admissions/OperationPriceCell'
import { OperationInvoiceButton } from '@/components/admissions/OperationInvoiceButton'
import { OperationTeamModal } from '@/components/admissions/OperationTeamModal'
import type { Operation } from '@/types/admission'

interface OperationsTabProps {
  operations: Operation[]
  loading?: boolean
  onSchedule: (payload: OperationFormPayload) => Promise<unknown>
  onUpdate: (operationId: number, payload: Partial<OperationFormPayload>) => Promise<unknown>
  onTeamChanged?: () => void
  isSubmitting: boolean
  /** When true, operations can't be scheduled or edited, and team members can't be changed (the admission is discharged or cancelled). */
  readOnly?: boolean
}

/** Operations management card, mirroring {@link AdmissionServicesCard}'s layout. */
export function OperationsTab({
  operations,
  loading,
  onSchedule,
  onUpdate,
  onTeamChanged,
  isSubmitting,
  readOnly = false,
}: OperationsTabProps) {
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [editingOperation, setEditingOperation] = useState<Operation | null>(null)
  const [teamOperationId, setTeamOperationId] = useState<number | null>(null)

  const teamOperation = teamOperationId != null ? operations.find((op) => op.id === teamOperationId) ?? null : null

  return (
    <Card>
      <CardHeader action={
        readOnly ? undefined : (
          <Button variant="contained" onClick={() => setScheduleOpen(true)}>
            + طلب عملية جديدة
          </Button>
        )
      } title="العمليات" />
      <CardContent>
        
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>رقم العملية</TableCell>
              <TableCell>الإجراء</TableCell>
              <TableCell>الجراح</TableCell>
              <TableCell>السعر</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {operations.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography variant="body2" color="text.secondary">
                    لا توجد عمليات مجدولة بعد
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {operations.map((op) => (
              <TableRow key={op.id} hover sx={{ cursor: 'pointer' }} onClick={() => setTeamOperationId(op.id)}>
                <TableCell>{op.operation_number ?? '—'}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <span>{op.procedure?.name_ar ?? '—'}</span>
                  </Stack>
                </TableCell>
                <TableCell>{op.surgeon?.name ?? '—'}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <OperationPriceCell
                    operation={op}
                    disabled={readOnly}
                    onCommit={(price) => onUpdate(op.id, { price })}
                  />
                </TableCell>
                <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" justifyContent="flex-end">
                    {!readOnly && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<EditOutlined />}
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingOperation(op)
                        }}
                      >
                        تعديل
                      </Button>
                    )}
                    <OperationInvoiceButton operation={op} />
                    <Tooltip title="أعضاء الفريق الطبي">
                      <Badge badgeContent={op.team_members?.length ?? 0} color="primary">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<TeamOutlined />}
                          onClick={(e) => {
                            e.stopPropagation()
                            setTeamOperationId(op.id)
                          }}
                        >
                          الفريق
                        </Button>
                      </Badge>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <ScheduleOperationModal
        open={scheduleOpen || !!editingOperation}
        operation={editingOperation}
        onClose={() => {
          setScheduleOpen(false)
          setEditingOperation(null)
        }}
        onSchedule={async (payload) => {
          await onSchedule(payload)
          setScheduleOpen(false)
        }}
        onUpdate={async (operationId, payload) => {
          await onUpdate(operationId, payload)
          setEditingOperation(null)
        }}
        isSubmitting={isSubmitting}
      />

      {teamOperation && (
        <OperationTeamModal
          open={!!teamOperation}
          onClose={() => setTeamOperationId(null)}
          operationId={teamOperation.id}
          existingMembers={teamOperation.team_members ?? []}
          operationPrice={teamOperation.price}
          operationName={teamOperation.procedure?.name_ar}
          onAdded={onTeamChanged}
          readOnly={readOnly}
        />
      )}
    </Card>
  )
}
