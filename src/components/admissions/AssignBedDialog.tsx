import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  TextField,
  Autocomplete,
  FormHelperText,
  Stack,
} from '@mui/material'
import { getAvailableBeds, getBeds, getFloors, getRooms, getWards } from '@/services/facilityService'
import { getRoomTypes } from '@/services/roomTypeService'
import { getRoomTypeName } from '@/lib/roomTypes'
import { assignAdmissionBed, transferAdmissionBed } from '@/services/admissionService'

/**
 * Picks an available bed and assigns it to an admission. In 'assign' mode that's a
 * bedless admission's first bed; in 'transfer' mode it moves an already-bedded
 * admission to a different bed (e.g. out of a private room into a ward), freeing
 * the old bed in the same request.
 */
export function AssignBedDialog({
  open,
  admissionId,
  mode = 'assign',
  onClose,
}: {
  open: boolean
  admissionId: number
  mode?: 'assign' | 'transfer'
  onClose: () => void
}) {
  const queryClient = useQueryClient()

  const [floorId, setFloorId] = useState<number | ''>('')
  const [wardId, setWardId] = useState<number | ''>('')
  const [roomId, setRoomId] = useState<number | ''>('')
  const [bedId, setBedId] = useState<number | ''>('')

  const floorInputRef = useRef<HTMLInputElement>(null)
  const wardInputRef = useRef<HTMLInputElement>(null)
  const roomInputRef = useRef<HTMLInputElement>(null)
  const bedInputRef = useRef<HTMLInputElement>(null)

  function focusField(ref: React.RefObject<HTMLElement | null>) {
    setTimeout(() => ref.current?.focus(), 50)
  }

  const floorsQuery = useQuery({ queryKey: ['floors'], queryFn: getFloors, enabled: open })
  const wardsQuery = useQuery({
    queryKey: ['wards', floorId],
    queryFn: () => getWards(floorId as number),
    enabled: open && floorId !== '',
  })
  const roomsQuery = useQuery({
    queryKey: ['rooms', wardId],
    queryFn: () => getRooms(wardId as number),
    enabled: open && wardId !== '',
  })
  const roomTypesQuery = useQuery({ queryKey: ['room-types'], queryFn: getRoomTypes, enabled: open })
  const bedsQuery = useQuery({
    queryKey: ['beds', 'available', roomId],
    queryFn: () => getAvailableBeds(roomId as number),
    enabled: open && roomId !== '',
  })
  const allBedsQuery = useQuery({
    queryKey: ['beds', 'all', roomId],
    queryFn: () => getBeds(roomId as number),
    enabled: open && roomId !== '',
  })

  /** A room with exactly one available bed selects it automatically. Keyed on the loaded list, so a manual clear sticks. */
  useEffect(() => {
    const availableBeds = bedsQuery.data ?? []
    if (availableBeds.length === 1) setBedId(availableBeds[0].id)
  }, [bedsQuery.data])

  const assignMutation = useMutation({
    mutationFn: () =>
      mode === 'transfer'
        ? transferAdmissionBed(admissionId, Number(bedId))
        : assignAdmissionBed(admissionId, Number(bedId)),
    onMutate: () => {
      if (mode === 'transfer') return { whatsappToastId: undefined }
      const whatsappToastId = toast.loading('جاري إرسال إشعار واتساب للطبيب المحوِّل...')
      return { whatsappToastId }
    },
    onSuccess: (admission, _variables, context) => {
      toast.success(mode === 'transfer' ? 'تم نقل السرير' : 'تم تعيين السرير')

      const notice = admission.whatsapp_doctor_notice
      if (notice && context.whatsappToastId) {
        if (notice.sent) {
          toast.success(notice.message, { id: context.whatsappToastId })
        } else {
          toast.warning(notice.message, { id: context.whatsappToastId })
        }
      } else if (context.whatsappToastId) {
        toast.dismiss(context.whatsappToastId)
      }

      queryClient.invalidateQueries({ queryKey: ['admissions'] })
      queryClient.invalidateQueries({ queryKey: ['floors'] })
      onClose()
    },
    onError: (_error, _variables, context) => {
      if (context?.whatsappToastId) toast.dismiss(context.whatsappToastId)
    },
  })

  const selectedFloor = floorsQuery.data?.find((floor) => floor.id === floorId) ?? null
  const selectedWard = wardsQuery.data?.find((ward) => ward.id === wardId) ?? null
  const selectedRoom = roomsQuery.data?.find((room) => room.id === roomId) ?? null
  const selectedBed = bedsQuery.data?.find((bed) => bed.id === bedId) ?? null

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{mode === 'transfer' ? 'نقل السرير' : 'تعيين سرير'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Autocomplete
              sx={{ flex: 1 }}
              size="small"
              options={floorsQuery.data ?? []}
              getOptionLabel={(floor) => floor.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={selectedFloor}
              onChange={(_, floor) => {
                setFloorId(floor ? floor.id : '')
                setWardId('')
                setRoomId('')
                setBedId('')
                if (floor) focusField(wardInputRef)
              }}
              renderInput={(params) => <TextField {...params} label="الطابق" inputRef={floorInputRef} />}
            />
            <Autocomplete
              sx={{ flex: 1 }}
              size="small"
              disabled={floorId === ''}
              options={wardsQuery.data ?? []}
              getOptionLabel={(ward) => ward.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={selectedWard}
              onChange={(_, ward) => {
                setWardId(ward ? ward.id : '')
                setRoomId('')
                setBedId('')
                if (ward) focusField(roomInputRef)
              }}
              renderInput={(params) => <TextField {...params} label="القسم" inputRef={wardInputRef} />}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Autocomplete
              sx={{ flex: 1 }}
              size="small"
              disabled={wardId === ''}
              options={roomsQuery.data ?? []}
              getOptionLabel={(room) => `غرفة ${room.room_number} (${getRoomTypeName(roomTypesQuery.data, room.room_type)})`}
              getOptionDisabled={(room) => (room.beds ?? []).every((bed) => bed.status !== 'available')}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={selectedRoom}
              onChange={(_, room) => {
                setRoomId(room ? room.id : '')
                setBedId('')
                if (room) focusField(bedInputRef)
              }}
              renderInput={(params) => <TextField {...params} label="العنبر/الغرفة" inputRef={roomInputRef} />}
            />
            <Autocomplete
              sx={{ flex: 1 }}
              size="small"
              disabled={roomId === ''}
              options={bedsQuery.data ?? []}
              getOptionLabel={(bed) => `سرير ${bed.bed_number}`}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={selectedBed}
              onChange={(_, bed) => setBedId(bed ? bed.id : '')}
              renderInput={(params) => <TextField {...params} label="السرير" inputRef={bedInputRef} />}
            />
          </Box>
          {roomId !== '' && bedsQuery.isSuccess && allBedsQuery.isSuccess && bedsQuery.data.length === 0 && (
            <FormHelperText error>
              {allBedsQuery.data.length === 0
                ? 'هذه الغرفة لا تحتوي على أي سرير'
                : 'لا توجد أسرّة شاغرة في هذه الغرفة، جميع أسرّتها مشغولة أو غير متاحة'}
            </FormHelperText>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>إلغاء</Button>
        <Button
          variant="contained"
          onClick={() => assignMutation.mutate()}
          disabled={bedId === '' || assignMutation.isPending}
        >
          {mode === 'transfer' ? 'نقل' : 'تعيين'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
