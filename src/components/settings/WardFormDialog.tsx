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
  MenuItem,
  TextField,
} from '@mui/material'
import { createWard, updateWard } from '@/services/facilityService'
import type { Ward, WardGender } from '@/types/facility'

interface WardFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  floorId: number
  ward?: Ward | null
}

const GENDER_LABEL: Record<WardGender, string> = {
  male: 'رجالي',
  female: 'نسائي',
  children: 'أطفال',
}

type GenderOption = WardGender | 'none'

const GENDER_OPTIONS: GenderOption[] = ['none', 'male', 'female', 'children']

const GENDER_OPTION_LABEL: Record<GenderOption, string> = {
  none: 'عام (بدون تحديد)',
  ...GENDER_LABEL,
}

export function WardFormDialog({ open, onOpenChange, floorId, ward }: WardFormDialogProps) {
  const queryClient = useQueryClient()
  const isEditing = !!ward

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [gender, setGender] = useState<GenderOption>('none')
  const [status, setStatus] = useState(true)
  const [nameError, setNameError] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(ward?.name ?? '')
    setDescription(ward?.description ?? '')
    setGender(ward?.gender ?? 'none')
    setStatus(ward?.status ?? true)
    setNameError(false)
  }, [open, ward])

  const mutation = useMutation({
    mutationFn: (payload: { name: string; description?: string; gender: WardGender | null; status: boolean }) =>
      isEditing ? updateWard(ward.id, payload) : createWard({ ...payload, floor_id: floorId }),
    onSuccess: () => {
      toast.success(isEditing ? 'تم تحديث الجناح' : 'تم إضافة الجناح')
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
    mutation.mutate({
      name,
      description: description || '',
      gender: gender === 'none' ? null : gender,
      status,
    })
  }

  return (
    <Dialog open={open} onClose={() => onOpenChange(false)} fullWidth maxWidth="xs">
      <DialogTitle>{isEditing ? `تعديل ${ward.name}` : 'إضافة جناح جديد'}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogContent>
          <TextField
            fullWidth
            autoFocus
            margin="normal"
            label="اسم الجناح"
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
          <TextField
            select
            fullWidth
            margin="normal"
            label="النوع"
            value={gender}
            onChange={(e) => setGender(e.target.value as GenderOption)}
          >
            {GENDER_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {GENDER_OPTION_LABEL[option]}
              </MenuItem>
            ))}
          </TextField>
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
