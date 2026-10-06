import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Autocomplete, Stack } from '@mui/material'
import { getAvailableBeds, getFloors, getRooms, getWards } from '@/services/facilityService'
import { assignAdmissionBed } from '@/services/admissionService'

/** Picks an available bed and assigns it to an admission that was registered without one. */
export function AssignBedDialog({
  open,
  admissionId,
  onClose,
}: {
  open: boolean
  admissionId: number
  onClose: () => void
}) {
  const queryClient = useQueryClient()

  const [floorId, setFloorId] = useState<number | ''>('')
  const [wardId, setWardId] = useState<number | ''>('')
  const [roomId, setRoomId] = useState<number | ''>('')
  const [bedId, setBedId] = useState<number | ''>('')

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
  const bedsQuery = useQuery({
    queryKey: ['beds', 'available', roomId],
    queryFn: () => getAvailableBeds(roomId as number),
    enabled: open && roomId !== '',
  })

  /** A room with exactly one available bed selects it automatically. Keyed on the loaded list, so a manual clear sticks. */
  useEffect(() => {
    const availableBeds = bedsQuery.data ?? []
    if (availableBeds.length === 1) setBedId(availableBeds[0].id)
  }, [bedsQuery.data])

  const assignMutation = useMutation({
    mutationFn: () => assignAdmissionBed(admissionId, Number(bedId)),
    onSuccess: () => {
      toast.success('تم تعيين السرير')
      queryClient.invalidateQueries({ queryKey: ['admissions'] })
      queryClient.invalidateQueries({ queryKey: ['floors'] })
      onClose()
    },
  })

  const selectedFloor = floorsQuery.data?.find((floor) => floor.id === floorId) ?? null
  const selectedWard = wardsQuery.data?.find((ward) => ward.id === wardId) ?? null
  const selectedRoom = roomsQuery.data?.find((room) => room.id === roomId) ?? null
  const selectedBed = bedsQuery.data?.find((bed) => bed.id === bedId) ?? null

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>تعيين سرير</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <Autocomplete
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
            }}
            renderInput={(params) => <TextField {...params} label="الطابق" />}
          />
          <Autocomplete
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
            }}
            renderInput={(params) => <TextField {...params} label="القسم" />}
          />
          <Autocomplete
            size="small"
            disabled={wardId === ''}
            options={roomsQuery.data ?? []}
            getOptionLabel={(room) => `غرفة ${room.room_number}`}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            value={selectedRoom}
            onChange={(_, room) => {
              setRoomId(room ? room.id : '')
              setBedId('')
            }}
            renderInput={(params) => <TextField {...params} label="العنبر/الغرفة" />}
          />
          <Autocomplete
            size="small"
            disabled={roomId === ''}
            options={bedsQuery.data ?? []}
            getOptionLabel={(bed) => `سرير ${bed.bed_number}`}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            value={selectedBed}
            onChange={(_, bed) => setBedId(bed ? bed.id : '')}
            renderInput={(params) => <TextField {...params} label="السرير" />}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>إلغاء</Button>
        <Button
          variant="contained"
          onClick={() => assignMutation.mutate()}
          disabled={bedId === '' || assignMutation.isPending}
        >
          تعيين
        </Button>
      </DialogActions>
    </Dialog>
  )
}
