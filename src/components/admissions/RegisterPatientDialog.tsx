import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  MenuItem,
  Stack,
} from '@mui/material'
import { getInsuranceCompanies } from '@/services/insuranceCompanyService'
import { createLocalPatient } from '@/services/patientService'
import { registerAdmission } from '@/services/admissionService'
import { DoctorPickerFields } from '@/components/patients/DoctorPickerFields'
import type { Doctor } from '@/types/patient'

/** Registers a patient and opens an active admission for them, with no bed or doctor. */
export function RegisterPatientDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | ''>('')
  const [ageYear, setAgeYear] = useState('')
  const [insuranceCompanyId, setInsuranceCompanyId] = useState<string>('')
  const [insuranceCardNumber, setInsuranceCardNumber] = useState('')
  const [admittingDoctor, setAdmittingDoctor] = useState<Doctor | null>(null)
  const [referralDoctor, setReferralDoctor] = useState<Doctor | null>(null)

  const nameInputRef = useRef<HTMLInputElement>(null)
  const phoneInputRef = useRef<HTMLInputElement>(null)
  const genderInputRef = useRef<HTMLInputElement>(null)
  const ageInputRef = useRef<HTMLInputElement>(null)

  const insuranceCompaniesQuery = useQuery({
    queryKey: ['insurance-companies'],
    queryFn: getInsuranceCompanies,
    enabled: open,
  })

  const registerMutation = useMutation({
    mutationFn: async () => {
      const patient = await createLocalPatient({
        name: name.trim(),
        phone: phone.trim() || undefined,
        gender: gender || undefined,
        age_year: ageYear ? Number(ageYear) : undefined,
        insurance_company_id: insuranceCompanyId ? Number(insuranceCompanyId) : undefined,
        insurance_card_number:
          insuranceCompanyId && insuranceCardNumber.trim() ? insuranceCardNumber.trim() : undefined,
        admitting_doctor_id: admittingDoctor?.id,
        referred_by_doctor_id: referralDoctor?.id,
      })
      return registerAdmission(patient.id)
    },
    onSuccess: () => {
      toast.success('تم تسجيل المريض وفتح التنويم')
      queryClient.invalidateQueries({ queryKey: ['admissions'] })
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      onClose()
    },
  })

  function handleSubmit() {
    if (!name.trim() || registerMutation.isPending) return
    registerMutation.mutate()
  }

  /** Enter moves to the next field instead of submitting the form. */
  function advanceOnEnter(nextRef: React.RefObject<HTMLElement | null>) {
    return (event: React.KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        nextRef.current?.focus()
      }
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" slotProps={{ transition: { onEntered: () => nameInputRef.current?.focus() } }}>
      <DialogTitle>تسجيل مريض جديد</DialogTitle>
      <DialogContent>
        <Stack
          component="form"
          id="register-patient-form"
          onSubmit={(event) => {
            event.preventDefault()
            handleSubmit()
          }}
          spacing={2.5}
          sx={{ pt: 1 }}
        >
          <TextField
            inputRef={nameInputRef}
            label="اسم المريض"
            fullWidth
            size="small"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={advanceOnEnter(phoneInputRef)}
          />
          <TextField
            inputRef={phoneInputRef}
            label="رقم الهاتف"
            fullWidth
            size="small"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            onKeyDown={advanceOnEnter(genderInputRef)}
          />
          <TextField
            select
            inputRef={genderInputRef}
            label="النوع"
            fullWidth
            size="small"
            value={gender}
            onChange={(event) => setGender(event.target.value as 'male' | 'female' | '')}
            onKeyDown={advanceOnEnter(ageInputRef)}
          >
            <MenuItem value="male">ذكر</MenuItem>
            <MenuItem value="female">أنثى</MenuItem>
          </TextField>
          <TextField
            inputRef={ageInputRef}
            label="العمر (سنوات)"
            type="number"
            fullWidth
            size="small"
            value={ageYear}
            onChange={(event) => setAgeYear(event.target.value)}
          />
          <Autocomplete
            options={insuranceCompaniesQuery.data ?? []}
            getOptionLabel={(company) => company.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            loading={insuranceCompaniesQuery.isLoading}
            noOptionsText="لا توجد شركات تأمين"
            value={
              (insuranceCompaniesQuery.data ?? []).find((company) => String(company.id) === insuranceCompanyId) ?? null
            }
            onChange={(_, company) => {
              setInsuranceCompanyId(company ? String(company.id) : '')
              if (!company) setInsuranceCardNumber('')
            }}
            renderInput={(params) => <TextField {...params} label="شركة التأمين" size="small" />}
          />
          {insuranceCompanyId && (
            <TextField
              label="رقم البطاقة"
              fullWidth
              size="small"
              value={insuranceCardNumber}
              onChange={(event) => setInsuranceCardNumber(event.target.value)}
            />
          )}
          <DoctorPickerFields
            admittingDoctor={admittingDoctor}
            onAdmittingDoctorChange={setAdmittingDoctor}
            referralDoctor={referralDoctor}
            onReferralDoctorChange={setReferralDoctor}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>إلغاء</Button>
        <Button
          type="submit"
          form="register-patient-form"
          variant="contained"
          disabled={!name.trim() || registerMutation.isPending}
        >
          تسجيل
        </Button>
      </DialogActions>
    </Dialog>
  )
}
