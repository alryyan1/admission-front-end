import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  MenuItem,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material'
import { formatNumber, formatDateTime } from '@/lib/utils'
import { ConfirmRemoveButton } from '@/components/common/ConfirmRemoveButton'
import type { Operation } from '@/types/admission'
import type { PaymentMethod } from '@/types/paymentMethod'

interface OperationPaymentDialogProps {
  open: boolean
  operation: Operation | null
  onClose: () => void
  paymentMethods: PaymentMethod[]
  preferredPaymentMethodId?: number
  onPay: (operationId: number, payload: { amount: number; payment_method_id?: number | null }) => void
  onRemoveDeposit: (depositId: number) => void
  isPaying?: boolean
  isRemovingDeposit?: boolean
  readOnly?: boolean
}

/** Add a (possibly partial) payment toward an operation's price, and manage its payment history. */
export function OperationPaymentDialog({
  open,
  operation,
  onClose,
  paymentMethods,
  preferredPaymentMethodId,
  onPay,
  onRemoveDeposit,
  isPaying = false,
  isRemovingDeposit = false,
  readOnly = false,
}: OperationPaymentDialogProps) {
  const remaining = operation?.remaining_amount ?? 0
  const [amount, setAmount] = useState<number | null>(remaining)
  const [paymentMethodId, setPaymentMethodId] = useState<number | ''>('')

  useEffect(() => {
    if (!open || !operation) return
    setAmount(operation.remaining_amount)
    setPaymentMethodId(preferredPaymentMethodId ?? operation.payment_method_id ?? paymentMethods[0]?.id ?? '')
  }, [open, operation, preferredPaymentMethodId, paymentMethods])

  if (!operation) return null

  const canPay = !readOnly && remaining > 0 && amount != null && amount > 0 && amount <= remaining && paymentMethodId !== ''

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>دفعات العملية — {operation.procedure?.name_ar ?? `#${operation.operation_number}`}</DialogTitle>
      <DialogContent>
        <Stack spacing={0.5} sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            السعر: {formatNumber(operation.price ?? 0)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            المدفوع: {formatNumber(operation.amount_paid)}
          </Typography>
          <Typography variant="body2" fontWeight={600} color={remaining > 0 ? 'error.main' : 'success.main'}>
            المتبقي: {formatNumber(remaining)}
          </Typography>
        </Stack>

        {remaining > 0 && !readOnly && (
          <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 2 }}>
            <TextField
              type="number"
              size="small"
              label="المبلغ"
              value={amount ?? ''}
              onChange={(e) => setAmount(e.target.value === '' ? null : Number(e.target.value))}
              slotProps={{ htmlInput: { min: 0.01, max: remaining, step: 1000 } }}
              error={amount != null && amount > remaining}
              helperText={amount != null && amount > remaining ? 'المبلغ أكبر من المتبقي' : ' '}
              sx={{ width: 160 }}
            />
            <TextField
              select
              size="small"
              label="طريقة الدفع"
              value={paymentMethodId}
              onChange={(e) => setPaymentMethodId(Number(e.target.value))}
              sx={{ width: 160 }}
            >
              {paymentMethods.map((pm) => (
                <MenuItem key={pm.id} value={pm.id}>
                  {pm.name}
                </MenuItem>
              ))}
            </TextField>
            <Button
              variant="contained"
              color="success"
              loading={isPaying}
              disabled={!canPay}
              onClick={() => amount != null && paymentMethodId !== '' && onPay(operation.id, { amount, payment_method_id: paymentMethodId })}
            >
              تسجيل الدفعة
            </Button>
          </Stack>
        )}

        <Divider sx={{ mb: 1 }} />
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          سجل الدفعات
        </Typography>
        {operation.deposits && operation.deposits.length > 0 ? (
          <List dense disablePadding>
            {operation.deposits.map((deposit) => (
              <ListItem
                key={deposit.id}
                secondaryAction={
                  !readOnly && (
                    <ConfirmRemoveButton
                      label="حذف الدفعة"
                      confirmLabel="حذف"
                      description="حذف هذه الدفعة؟ لا يمكن التراجع عن هذا الإجراء."
                      iconOnly
                      loading={isRemovingDeposit}
                      onConfirm={() => onRemoveDeposit(deposit.id)}
                    />
                  )
                }
                disableGutters
              >
                <ListItemText
                  primary={formatNumber(deposit.amount)}
                  secondary={`${deposit.payment_method?.name ?? 'بدون تحديد'} — ${formatDateTime(deposit.paid_at)}${deposit.paid_by_name ? ` — ${deposit.paid_by_name}` : ''}`}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">
            لا توجد دفعات مسجلة لهذه العملية بعد
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>إغلاق</Button>
      </DialogActions>
    </Dialog>
  )
}
