import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
  TextField,
} from '@mui/material'
import { createFloor, updateFloor } from '@/services/facilityService'
import type { Floor } from '@/types/facility'

interface FloorFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  floor?: Floor | null
}

export function FloorFormDialog({ open, onOpenChange, floor }: FloorFormDialogProps) {
  const queryClient = useQueryClient()
  const isEditing = !!floor

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState(true)
  const [nameError, setNameError] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(floor?.name ?? '')
    setDescription(floor?.description ?? '')
    setStatus(floor?.status ?? true)
    setNameError(false)
  }, [open, floor])

  const mutation = useMutation({
    mutationFn: (payload: { name: string; description?: string; status: boolean }) =>
      isEditing ? updateFloor(floor.id, payload) : createFloor(payload),
    onSuccess: () => {
      toast.success(isEditing ? 'تم تحديث الطابق' : 'تم إضافة الطابق')
      queryClient.invalidateQueries({ queryKey: ['floors'] })
      onOpenChange(false)
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim()) {
      setNameError(true)
      return
    }
    mutation.mutate({ name, description: description || '', status })
  }

  return (
    <Dialog open={open} onClose={() => onOpenChange(false)} fullWidth maxWidth="xs">
      <DialogTitle>{isEditing ? `تعديل ${floor.name}` : 'إضافة طابق جديد'}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogContent>
          <TextField
            fullWidth
            autoFocus
            margin="normal"
            label="اسم الطابق"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setNameError(false)
            }}
            error={nameError}
            helperText={nameError ? 'هذا الحقل مطلوب' : undefined}
          />
          <TextField
            fullWidth
            margin="normal"
            label="الوصف"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <FormControlLabel
            control={<Checkbox checked={status} onChange={(e) => setStatus(e.target.checked)} />}
            label="نشط"
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
