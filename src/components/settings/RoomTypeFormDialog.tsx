import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material'
import { createRoomType, updateRoomType } from '@/services/roomTypeService'
import type { RoomType } from '@/types/facility'

interface RoomTypeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  roomType?: RoomType | null
  onSaved?: (roomType: RoomType) => void
}

export function RoomTypeFormDialog({ open, onOpenChange, roomType, onSaved }: RoomTypeFormDialogProps) {
  const queryClient = useQueryClient()
  const isEditing = !!roomType

  const [name, setName] = useState('')
  const [nameError, setNameError] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(roomType?.name ?? '')
    setNameError(false)
  }, [open, roomType])

  const mutation = useMutation({
    mutationFn: (payload: { name: string }) =>
      isEditing ? updateRoomType(roomType.id, payload) : createRoomType(payload),
    onSuccess: (savedRoomType) => {
      toast.success(isEditing ? 'تم تحديث نوع الغرفة' : 'تم إضافة نوع الغرفة')
      queryClient.invalidateQueries({ queryKey: ['room-types'] })
      onOpenChange(false)
      onSaved?.(savedRoomType)
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setNameError(true)
      return
    }
    mutation.mutate({ name: trimmed })
  }

  return (
    <Dialog open={open} onClose={() => onOpenChange(false)} fullWidth maxWidth="xs">
      <DialogTitle sx={{ pb: 1 }}>{isEditing ? `تعديل ${roomType.name}` : 'إضافة نوع غرفة جديد'}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            fullWidth
            autoFocus
            size="small"
            label="اسم نوع الغرفة"
            placeholder="مثال: غرفة عزل"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setNameError(false)
            }}
            error={nameError}
            helperText={nameError ? 'هذا الحقل مطلوب' : undefined}
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
