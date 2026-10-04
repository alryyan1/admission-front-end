import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  TextField,
} from '@mui/material'
import { createRoom, updateRoom } from '@/services/facilityService'
import { getRoomTypes } from '@/services/roomTypeService'
import type { Room } from '@/types/facility'

interface RoomFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  wardId: number
  room?: Room | null
}

export function RoomFormDialog({ open, onOpenChange, wardId, room }: RoomFormDialogProps) {
  const queryClient = useQueryClient()
  const isEditing = !!room
  const roomTypesQuery = useQuery({ queryKey: ['room-types'], queryFn: getRoomTypes })

  const [roomNumber, setRoomNumber] = useState('')
  const [roomType, setRoomType] = useState('normal')
  const [capacity, setCapacity] = useState('1')
  const [autoCreateBeds, setAutoCreateBeds] = useState(false)
  const [pricePerDay, setPricePerDay] = useState('')
  const [roomNumberError, setRoomNumberError] = useState(false)
  const [capacityError, setCapacityError] = useState(false)

  useEffect(() => {
    if (!open) return
    setRoomNumber(room?.room_number ?? '')
    setRoomType(room?.room_type ?? 'normal')
    setCapacity(String(room?.capacity ?? 1))
    setAutoCreateBeds(false)
    setPricePerDay(room?.price_per_day ?? '')
    setRoomNumberError(false)
    setCapacityError(false)
  }, [open, room])

  const mutation = useMutation({
    mutationFn: (payload: {
      room_number: string
      room_type: string
      capacity: number
      price_per_day: number | null
      auto_create_beds?: boolean
    }) => (isEditing ? updateRoom(room.id, payload) : createRoom({ ...payload, ward_id: wardId })),
    onSuccess: () => {
      toast.success(isEditing ? 'تم تحديث الغرفة' : 'تم إضافة الغرفة')
      queryClient.invalidateQueries({ queryKey: ['floors'] })
      onOpenChange(false)
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const isRoomNumberMissing = !roomNumber.trim()
    const isCapacityMissing = capacity.trim() === ''
    setRoomNumberError(isRoomNumberMissing)
    setCapacityError(isCapacityMissing)
    if (isRoomNumberMissing || isCapacityMissing) return

    mutation.mutate({
      room_number: roomNumber,
      room_type: roomType,
      capacity: Number(capacity),
      price_per_day: pricePerDay ? Number(pricePerDay) : null,
      ...(isEditing ? {} : { auto_create_beds: autoCreateBeds }),
    })
  }

  return (
    <Dialog open={open} onClose={() => onOpenChange(false)} fullWidth maxWidth="xs">
      <DialogTitle>{isEditing ? `تعديل غرفة ${room.room_number}` : 'إضافة غرفة جديدة'}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogContent>
          <TextField
            fullWidth
            autoFocus
            margin="normal"
            label="رقم الغرفة"
            value={roomNumber}
            onChange={(e) => {
              setRoomNumber(e.target.value)
              setRoomNumberError(false)
            }}
            error={roomNumberError}
            helperText={roomNumberError ? 'هذا الحقل مطلوب' : undefined}
          />
          <TextField
            select
            fullWidth
            margin="normal"
            label="نوع الغرفة"
            value={roomType}
            onChange={(e) => setRoomType(e.target.value)}
            disabled={roomTypesQuery.isLoading}
          >
            {roomTypesQuery.data?.map((type) => (
              <MenuItem key={type.code} value={type.code}>
                {type.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            margin="normal"
            type="number"
            label="عدد السراير"
            value={capacity}
            onChange={(e) => {
              setCapacity(e.target.value)
              setCapacityError(false)
            }}
            error={capacityError}
            helperText={capacityError ? 'هذا الحقل مطلوب' : undefined}
            slotProps={{ htmlInput: { min: 0 } }}
          />
          {!isEditing && (
            <FormControlLabel
              control={<Checkbox checked={autoCreateBeds} onChange={(e) => setAutoCreateBeds(e.target.checked)} />}
              label="إنشاء عدد السراير المحدد تلقائياً"
            />
          )}
          <TextField
            fullWidth
            margin="normal"
            type="number"
            label="السعر لليوم"
            placeholder="غير محدد بعد"
            value={pricePerDay}
            onChange={(e) => setPricePerDay(e.target.value)}
            className="amount-input"
          />
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button type="submit" variant="contained" disabled={mutation.isPending}>
            حفظ
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
