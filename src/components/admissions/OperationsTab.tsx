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
  Tooltip,
  Typography,
} from '@mui/material'
import { DollarOutlined, CheckCircleFilled, CloseCircleOutlined, ExclamationCircleFilled, WhatsAppOutlined } from '@ant-design/icons'
import { getPaymentMethods } from '@/services/paymentMethodService'
import { sendOperationInvoicePdfWhatsApp } from '@/services/whatsappService'
import { ScheduleOperationModal, type OperationFormPayload } from '@/components/admissions/ScheduleOperationModal'
import { OperationPriceCell } from '@/components/admissions/OperationPriceCell'
import { OperationActionsMenu } from '@/components/admissions/OperationActionsMenu'
import { OperationTeamModal } from '@/components/admissions/OperationTeamModal'
import { OperationPaymentDialog } from '@/components/admissions/OperationPaymentDialog'
import { formatNumber } from '@/lib/utils'
import type { Operation } from '@/types/admission'

interface OperationsTabProps {
  operations: Operation[]
  loading?: boolean
  onSchedule: (payload: OperationFormPayload) => Promise<unknown>
  onUpdate: (operationId: number, payload: Partial<OperationFormPayload>) => Promise<unknown>
  onDelete: (operationId: number) => void
  onTeamChanged?: () => void
  /** Records a (possibly partial) payment toward an operation's price (see the payments dialog). */
  onPayOperation: (operationId: number, payload: { amount: number; payment_method_id?: number | null }) => void
  /** Deletes a single payment from an operation's history (see the payments dialog). */
  onRemoveDeposit: (depositId: number) => void
  isSubmitting: boolean
  isDeleting?: boolean
  isPayingOperation?: boolean
  isRemovingDeposit?: boolean
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
  onPayOperation,
  onRemoveDeposit,
  isSubmitting,
  isDeleting,
  isPayingOperation = false,
  isRemovingDeposit = false,
  readOnly = false,
}: OperationsTabProps) {
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [editingOperation, setEditingOperation] = useState<Operation | null>(null)
  const [teamOperationId, setTeamOperationId] = useState<number | null>(null)
  const [paymentOperationId, setPaymentOperationId] = useState<number | null>(null)
  const paymentMethodsQuery = useQuery({ queryKey: ['payment-methods'], queryFn: getPaymentMethods })
  const preferredPaymentMethodId = (paymentMethodsQuery.data ?? []).find(
    (pm) => pm.is_active && pm.name === 'بنكك',
  )?.id

  const teamOperation = teamOperationId != null ? operations.find((op) => op.id === teamOperationId) ?? null : null
  const paymentOperation = paymentOperationId != null ? operations.find((op) => op.id === paymentOperationId) ?? null : null

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
                <Tooltip
                  title={
                    op.is_paid
                      ? 'مدفوعة'
                      : op.amount_paid > 0
                        ? `دفعة جزئية — المتبقي ${formatNumber(op.remaining_amount ?? 0)}`
                        : 'غير مدفوعة'
                  }
                >
                  {op.is_paid ? (
                    <CheckCircleFilled style={{ color: '#52c41a', fontSize: 18 }} />
                  ) : op.amount_paid > 0 ? (
                    <ExclamationCircleFilled style={{ color: '#faad14', fontSize: 18 }} />
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
                      disabled={readOnly || op.amount_paid > 0}
                      onCommit={(price) => onUpdate(op.id, { price })}
                    />
                    {op.amount_paid > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        مدفوع {formatNumber(op.amount_paid)} / متبقي {formatNumber(op.remaining_amount ?? 0)}
                      </Typography>
                    )}
                  </Stack>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center">
                  <Tooltip title={op.price == null ? 'حدّد سعر العملية أولاً' : 'عرض وتسجيل الدفعات'}>
                    <span>
                      <Button
                        size="small"
                        color={op.is_paid ? 'success' : op.amount_paid > 0 ? 'warning' : 'primary'}
                        startIcon={<DollarOutlined />}
                        disabled={op.price == null}
                        onClick={() => setPaymentOperationId(op.id)}
                      >
                        الدفعات
                      </Button>
                    </span>
                  </Tooltip>
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

      <OperationPaymentDialog
        open={!!paymentOperation}
        operation={paymentOperation}
        onClose={() => setPaymentOperationId(null)}
        paymentMethods={paymentMethodsQuery.data ?? []}
        preferredPaymentMethodId={preferredPaymentMethodId}
        onPay={onPayOperation}
        onRemoveDeposit={onRemoveDeposit}
        isPaying={isPayingOperation}
        isRemovingDeposit={isRemovingDeposit}
        readOnly={readOnly}
      />
    </Card>
  )
}
