import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Card,
  CardHeader,
  CardContent,
  Box,
  Stack,
  TextField,
  Autocomplete,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography,
  Tooltip,
  Skeleton,
} from '@mui/material'
import { ThunderboltFilled } from '@ant-design/icons'
import { formatNumber } from '@/lib/utils'
import { ConfirmRemoveButton } from '@/components/common/ConfirmRemoveButton'
import { getChartOpeningServiceSetting, getServices } from '@/services/serviceService'
import type { RequestedService } from '@/types/admission'
import type { Service } from '@/types/service'

interface AdmissionServicesCardProps {
  services: RequestedService[]
  isLoading?: boolean
  onAddService: (payload: { name: string; quantity?: number; unit_price: number }) => void
  onUpdateService: (serviceId: number, payload: { quantity?: number; unit_price?: number }) => void
  onRemoveService: (serviceId: number) => void
  onCalculateAccommodationFee: () => void
  isSubmittingService: boolean
  isUpdatingService: boolean
  isRemovingService: boolean
  isCalculatingAccommodationFee: boolean
  /** When true, services can't be removed (the admission already has payments). */
  hasPayments?: boolean
  /** Set to false when the host page renders its own "رسوم فتح الملف"/"رسوم الإقامة" quick-add buttons elsewhere (e.g. next to a payments button). Defaults to true. */
  showQuickActions?: boolean
  /** When true, services can't be added, edited or removed (the admission is discharged or cancelled). */
  readOnly?: boolean
}

function parseNumericInput(raw: string, integer?: boolean): number | null {
  if (raw === '') return null
  const parsed = integer ? parseInt(raw, 10) : Number(raw)
  return Number.isNaN(parsed) ? null : parsed
}

function EditableNumberCell({
  value,
  min,
  disabled,
  currency,
  integer,
  onCommit,
}: {
  value: number
  min: number
  disabled?: boolean
  currency?: boolean
  integer?: boolean
  onCommit: (value: number) => void
}) {
  const [draft, setDraft] = useState<number | null>(value)

  useEffect(() => {
    setDraft(value)
  }, [value])

  function commit() {
    if (draft !== null && draft !== value) {
      onCommit(draft)
    }
  }

  return (
    <TextField
      className={currency ? 'amount-input' : undefined}
      type="number"
      size="small"
      disabled={disabled}
      value={draft ?? ''}
      onChange={(e) => setDraft(parseNumericInput(e.target.value, integer))}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit()
      }}
      slotProps={{ htmlInput: { min, step: integer ? 1 : 'any' } }}
      sx={{ width: 110 }}
    />
  )
}

/** Requested-services management card, shared by {@link BillingTab} and the admissions work area. */
export function AdmissionServicesCard({
  services,
  isLoading = false,
  onAddService,
  onUpdateService,
  onRemoveService,
  onCalculateAccommodationFee,
  isSubmittingService,
  isUpdatingService,
  isRemovingService,
  isCalculatingAccommodationFee,
  hasPayments = false,
  showQuickActions = true,
  readOnly = false,
}: AdmissionServicesCardProps) {
  const catalogQuery = useQuery({ queryKey: ['services', 'active'], queryFn: () => getServices({ active_only: true }) })
  const chartOpeningQuery = useQuery({
    queryKey: ['chart-opening-service-setting'],
    queryFn: getChartOpeningServiceSetting,
    enabled: showQuickActions,
  })

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [quantity, setQuantity] = useState<number | null>(1)
  const [unitPrice, setUnitPrice] = useState<number | null>(null)
  const unitPriceRef = useRef<HTMLInputElement>(null)

  function closeAddDialog() {
    setAddDialogOpen(false)
    setSelectedService(null)
    setQuantity(1)
    setUnitPrice(null)
  }

  function handleServiceSelect(service: Service | null) {
    setSelectedService(service)
    setUnitPrice(service ? Number(service.price) : null)
    setTimeout(() => unitPriceRef.current?.focus(), 0)
  }

  function handleAddService() {
    if (!selectedService || unitPrice === null) return
    onAddService({ name: selectedService.name_ar, quantity: quantity ?? 1, unit_price: unitPrice })
    closeAddDialog()
  }

  const servicesTotal = services.reduce((sum, s) => sum + Number(s.total_price), 0)

  function handleAddFileOpeningFee() {
    const service = chartOpeningQuery.data?.service
    if (!service) {
      toast.error('لم يتم إعداد خدمة رسوم فتح الملف من الإعدادات')
      return
    }
    onAddService({ name: service.name_ar, quantity: 1, unit_price: Number(service.price) })
  }

  return (
    <Card>
      <CardHeader action={
        readOnly ? undefined : (
          <Button variant="contained" onClick={() => setAddDialogOpen(true)}>
            + إضافة خدمة
          </Button>
        )
      } title="الخدمات المطلوبة" />
      <CardContent>
        {showQuickActions && !readOnly && (
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={handleAddFileOpeningFee}
              disabled={isSubmittingService || chartOpeningQuery.isLoading || !chartOpeningQuery.data?.service}
            >
              رسوم فتح الملف
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={onCalculateAccommodationFee}
              disabled={isCalculatingAccommodationFee}
            >
              رسوم الإقامة
            </Button>
          </Stack>
        )}

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>الخدمة</TableCell>
              <TableCell>العدد</TableCell>
              <TableCell>سعر الوحدة</TableCell>
              <TableCell>الإجمالي</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading &&
              Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  <TableCell>
                    <Skeleton variant="text" width={140} />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width={40} />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width={70} />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width={70} />
                  </TableCell>
                  <TableCell />
                </TableRow>
              ))}
            {!isLoading && services.length === 0 && !isSubmittingService && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography variant="body2" color="text.secondary">
                    لا توجد خدمات بعد
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {!isLoading && services.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <span>{s.name}</span>
                    {s.is_auto_added && (
                      <Tooltip title="تمت إضافتها تلقائياً">
                        <ThunderboltFilled style={{ color: '#faad14' }} />
                      </Tooltip>
                    )}
                  </Stack>
                </TableCell>
                <TableCell>
                  <EditableNumberCell
                    value={s.quantity}
                    min={1}
                    integer
                    disabled={isUpdatingService || readOnly}
                    onCommit={(quantity) => onUpdateService(s.id, { quantity })}
                  />
                </TableCell>
                <TableCell>
                  <EditableNumberCell
                    value={Number(s.unit_price)}
                    min={0}
                    currency
                    disabled={isUpdatingService || readOnly}
                    onCommit={(unit_price) => onUpdateService(s.id, { unit_price })}
                  />
                </TableCell>
                <TableCell>{formatNumber(s.total_price)}</TableCell>
                <TableCell align="right">
                  <ConfirmRemoveButton
                    loading={isRemovingService}
                    disabled={hasPayments || readOnly}
                    onConfirm={() => onRemoveService(s.id)}
                  />
                </TableCell>
              </TableRow>
            ))}
            {isSubmittingService && (
              <TableRow>
                <TableCell>
                  <Skeleton variant="text" width={140} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width={40} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width={70} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width={70} />
                </TableCell>
                <TableCell />
              </TableRow>
            )}
            {!isLoading && services.length > 0 && (
              <TableRow>
                <TableCell colSpan={3}>
                  <Typography variant="body2" fontWeight={700}>
                    الإجمالي
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={700}>
                    {formatNumber(servicesTotal)}
                  </Typography>
                </TableCell>
                <TableCell />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={addDialogOpen} onClose={closeAddDialog} fullWidth maxWidth="sm">
        <DialogTitle>إضافة خدمة</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 2, pt: 1 }}>
            <Autocomplete
              autoFocus
              size="small"
              sx={{ width: 220 }}
              options={catalogQuery.data ?? []}
              getOptionLabel={(s) => s.name_ar}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              loading={catalogQuery.isLoading}
              value={selectedService}
              onChange={(_, service) => handleServiceSelect(service)}
              renderInput={(params) => <TextField {...params} label="الخدمة" />}
            />
            <TextField
              label="العدد"
              type="number"
              size="small"
              value={quantity ?? ''}
              onChange={(e) => setQuantity(parseNumericInput(e.target.value, true))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddService()
              }}
              slotProps={{ htmlInput: { min: 1, step: 1 } }}
              sx={{ width: 110 }}
            />
            <TextField
              className="amount-input"
              inputRef={unitPriceRef}
              label="سعر الوحدة"
              type="number"
              size="small"
              value={unitPrice ?? ''}
              onChange={(e) => setUnitPrice(e.target.value === '' ? null : Number(e.target.value))}
              onFocus={(e) => e.target.select()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddService()
              }}
              slotProps={{ htmlInput: { min: 0 } }}
              sx={{ width: 112 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAddDialog}>إلغاء</Button>
          <Button
            variant="contained"
            onClick={handleAddService}
            disabled={!selectedService || unitPrice === null || isSubmittingService}
          >
            إضافة
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}
