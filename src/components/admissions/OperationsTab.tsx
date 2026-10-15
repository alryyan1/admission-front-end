import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Card,
  CardHeader,
  CardContent,
  Box,
  Stack,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Divider,
  TextField,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material'
import { DollarOutlined, CheckCircleFilled, CloseCircleOutlined, WhatsAppOutlined } from '@ant-design/icons'
import { ConfirmRemoveButton } from '@/components/common/ConfirmRemoveButton'
import { getPaymentMethods } from '@/services/paymentMethodService'
import { sendOperationInvoicePdfWhatsApp } from '@/services/whatsappService'
import { ScheduleOperationModal, type OperationFormPayload } from '@/components/admissions/ScheduleOperationModal'
import { OperationPriceCell } from '@/components/admissions/OperationPriceCell'
import { OperationActionsMenu } from '@/components/admissions/OperationActionsMenu'
import { OperationTeamModal } from '@/components/admissions/OperationTeamModal'
import type { Operation } from '@/types/admission'

interface OperationsTabProps {
  operations: Operation[]
  loading?: boolean
  onSchedule: (payload: OperationFormPayload) => Promise<unknown>
  onUpdate: (operationId: number, payload: Partial<OperationFormPayload>) => Promise<unknown>
  onDelete: (operationId: number) => void
  onTeamChanged?: () => void
  /** Sets the "intended" payment method before/without actually paying (see the per-row select). */
  onUpdatePaymentMethod: (operationId: number, paymentMethodId: number | null) => void
  /** Marks an operation paid and records its linked deposit (see the "سداد" button). */
  onPayOperation: (operationId: number, paymentMethodId?: number | null) => void
  /** Reverts onPayOperation: deletes its deposit and clears the paid flag (see "إلغاء السداد"). */
  onCancelPayment: (operationId: number) => void
  isSubmitting: boolean
  isDeleting?: boolean
  isPayingOperation?: boolean
  isCancellingPayment?: boolean
  /** When true, operations can't be scheduled or edited, and team members can't be changed (the admission is discharged or cancelled). */
  readOnly?: boolean
}

/** Standalone "send invoice via WhatsApp" button for an operation row; needs its own mutation, so it can't be inlined in a .map(). */
function OperationWhatsAppButton({ operation }: { operation: Operation }) {
  const sendWhatsAppMutation = useMutation({
    mutationFn: () => sendOperationInvoicePdfWhatsApp(operation.id),
    onSuccess: ({ sent, message }) => {
      if (sent) {
        toast.success(message)
      } else {
        toast.warning(message)
      }
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'تعذر إرسال الفاتورة عبر واتساب'
      toast.error(message)
    },
  })

  const hasPrice = operation.price != null
  const priceTooltip = hasPrice ? 'إرسال الفاتورة عبر واتساب' : 'حدّد سعر العملية أولاً'

  return (
    <Tooltip title={priceTooltip} placement="top">
      <span>
        <IconButton
          size="small"
          color="success"
          disabled={!hasPrice || sendWhatsAppMutation.isPending}
          onClick={(e) => {
            e.stopPropagation()
            sendWhatsAppMutation.mutate()
          }}
        >
          {sendWhatsAppMutation.isPending ? <CircularProgress size={16} color="success" /> : <WhatsAppOutlined />}
        </IconButton>
      </span>
    </Tooltip>
  )
}

/** Operations management card, mirroring {@link AdmissionServicesCard}'s layout. */
export function OperationsTab({
  operations,
  loading,
  onSchedule,
  onUpdate,
  onDelete,
  onTeamChanged,
  onUpdatePaymentMethod,
  onPayOperation,
  onCancelPayment,
  isSubmitting,
  isDeleting,
  isPayingOperation = false,
  isCancellingPayment = false,
  readOnly = false,
}: OperationsTabProps) {
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [editingOperation, setEditingOperation] = useState<Operation | null>(null)
  const [teamOperationId, setTeamOperationId] = useState<number | null>(null)
  const paymentMethodsQuery = useQuery({ queryKey: ['payment-methods'], queryFn: getPaymentMethods })
  const preferredPaymentMethodId = (paymentMethodsQuery.data ?? []).find(
    (pm) => pm.is_active && pm.name === 'بنكك',
  )?.id

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
        <Stack spacing={1.5}>
          {operations.length === 0 && !loading && (
            <Typography variant="body2" color="text.secondary">
              لا توجد عمليات مجدولة بعد
            </Typography>
          )}
          {operations.map((op) => (
            <Paper
              key={op.id}
              variant="outlined"
              sx={{ p: 2, cursor: 'pointer' }}
              onClick={() => setTeamOperationId(op.id)}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Typography variant="subtitle2" color="text.secondary">
                  #{op.operation_number ?? '—'}
                </Typography>
                <Stack spacing={0}>
                  <Typography variant="body1" fontWeight={600}>
                    {op.procedure?.name_ar ?? '—'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {op.surgeon?.name ?? '—'}
                  </Typography>
                </Stack>
                <Tooltip title={op.is_paid ? 'مدفوعة' : 'غير مدفوعة'}>
                  {op.is_paid ? (
                    <CheckCircleFilled style={{ color: '#52c41a', fontSize: 18 }} />
                  ) : (
                    <CloseCircleOutlined style={{ color: '#bfbfbf', fontSize: 18 }} />
                  )}
                </Tooltip>
                <Box sx={{ flexGrow: 1 }} />
                <OperationWhatsAppButton operation={op} />
              </Stack>

              <Divider sx={{ my: 1.5 }} />

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  flexWrap: 'wrap',
                  rowGap: 1.5,
                  width: '100%',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <Stack direction="row" spacing={4} alignItems="flex-end" flexWrap="wrap" useFlexGap rowGap={1.5}>
                  <Stack spacing={0.5}>
                    <Typography variant="caption" color="text.secondary">
                      السعر
                    </Typography>
                    <OperationPriceCell
                      operation={op}
                      disabled={readOnly || op.is_paid}
                      onCommit={(price) => onUpdate(op.id, { price })}
                    />
                  </Stack>

                  <Stack spacing={0.5}>
                    <Typography variant="caption" color="text.secondary">
                      طريقة الدفع
                    </Typography>
                    <TextField
                      select
                      size="small"
                      disabled={readOnly}
                      value={op.payment_method_id ?? preferredPaymentMethodId ?? ''}
                      onChange={(e) =>
                        onUpdatePaymentMethod(op.id, e.target.value === '' ? null : Number(e.target.value))
                      }
                      sx={{ width: 140 }}
                      slotProps={{ select: { displayEmpty: true } }}
                    >
                      <MenuItem value="">
                        <em>بدون تحديد</em>
                      </MenuItem>
                      {(paymentMethodsQuery.data ?? []).map((pm) => (
                        <MenuItem key={pm.id} value={pm.id}>
                          {pm.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Stack>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center">
                  {op.is_paid ? (
                    <ConfirmRemoveButton
                      label="إلغاء السداد"
                      confirmLabel="إلغاء السداد"
                      description="إلغاء حالة السداد لهذه العملية؟ سيتم حذف الدفعة المرتبطة بها."
                      iconOnly
                      loading={isCancellingPayment}
                      disabled={readOnly}
                      onConfirm={() => onCancelPayment(op.id)}
                    />
                  ) : (
                    <Tooltip title="تسجيل دفعة بقيمة هذه العملية">
                      <span>
                        <Button
                          size="small"
                          color="success"
                          startIcon={<DollarOutlined />}
                          disabled={readOnly || isPayingOperation || op.price == null}
                          onClick={() => onPayOperation(op.id, op.payment_method_id ?? preferredPaymentMethodId ?? null)}
                        >
                          سداد
                        </Button>
                      </span>
                    </Tooltip>
                  )}
                  <OperationActionsMenu
                    operation={op}
                    readOnly={readOnly}
                    isDeleting={isDeleting}
                    onEdit={() => setEditingOperation(op)}
                    onOpenTeam={() => setTeamOperationId(op.id)}
                    onDelete={() => onDelete(op.id)}
                  />
                </Stack>
              </Box>
            </Paper>
          ))}
        </Stack>
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
          entitlementsApproved={teamOperation.entitlements_approved}
        />
      )}
    </Card>
  )
}
