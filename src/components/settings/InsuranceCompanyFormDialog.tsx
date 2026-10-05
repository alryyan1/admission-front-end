import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material'
import { createInsuranceCompany } from '@/services/insuranceCompanyService'

interface InsuranceCompanyFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** MUI dialog for adding an insurance company; existing rows are edited inline on the settings page. */
export function InsuranceCompanyFormDialog({ open, onOpenChange }: InsuranceCompanyFormDialogProps) {
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [coverage, setCoverage] = useState('')
  const [nameError, setNameError] = useState(false)

  useEffect(() => {
    if (!open) return
    setName('')
    setPhone('')
    setEmail('')
    setCoverage('')
    setNameError(false)
  }, [open])

  const mutation = useMutation({
    mutationFn: createInsuranceCompany,
    onSuccess: () => {
      toast.success('تمت إضافة شركة التأمين')
      queryClient.invalidateQueries({ queryKey: ['insurance-companies'] })
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
      name: name.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      coverage_percentage: coverage === '' ? null : Number(coverage),
    })
  }

  return (
    <Dialog open={open} onClose={() => onOpenChange(false)} fullWidth maxWidth="xs">
      <DialogTitle>إضافة شركة تأمين</DialogTitle>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogContent>
          <TextField
            fullWidth
            autoFocus
            margin="normal"
            label="اسم الشركة"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setNameError(false)
            }}
            error={nameError}
            helperText={nameError ? 'هذا الحقل مطلوب' : undefined}
          />
          <TextField fullWidth margin="normal" label="رقم الهاتف" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <TextField
            fullWidth
            margin="normal"
            type="email"
            label="البريد الإلكتروني"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            fullWidth
            margin="normal"
            type="number"
            label="نسبة التحمل (%)"
            value={coverage}
            onChange={(e) => setCoverage(e.target.value)}
            slotProps={{ htmlInput: { min: 0, max: 100, step: 0.01 } }}
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
