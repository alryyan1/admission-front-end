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
  Box,
  Stack,
  Typography,
  CircularProgress,
  ListItemText,
} from '@mui/material'
import { getInsuranceCompanies } from '@/services/insuranceCompanyService'
import { getCompanies, createCompany } from '@/services/companyService'
import { getGuardianRelationships, createGuardianRelationship } from '@/services/guardianRelationshipService'
import { getFacilitySettings } from '@/services/facilityService'
import { createLocalPatient } from '@/services/patientService'
import { registerAdmission } from '@/services/admissionService'
import { DoctorPickerFields } from '@/components/patients/DoctorPickerFields'
import type { Doctor } from '@/types/patient'
import type { Company, GuardianRelationship } from '@/types/admission'

type CompanySearchOption = { kind: 'company'; company: Company } | { kind: 'create'; name: string }
type GuardianRelationshipSearchOption =
  | { kind: 'relationship'; relationship: GuardianRelationship }
  | { kind: 'create'; name: string }

/** Registers a patient and opens an active admission for them, with no bed or doctor. */
export function RegisterPatientDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | ''>('')
  const [ageYear, setAgeYear] = useState('')
  const [insuranceCompanyId, setInsuranceCompanyId] = useState<string>('')
  const [insuranceCardNumber, setInsuranceCardNumber] = useState('')
  const [companyId, setCompanyId] = useState<string>('')
  const [companySearch, setCompanySearch] = useState('')
  const [guardianRelationshipId, setGuardianRelationshipId] = useState<string>('')
  const [guardianRelationshipSearch, setGuardianRelationshipSearch] = useState('')
  const [relativeName, setRelativeName] = useState('')
  const [relativeRelationship, setRelativeRelationship] = useState('')
  const [relativePhone, setRelativePhone] = useState('')
  const [relativeAddress, setRelativeAddress] = useState('')
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
    staleTime: Infinity,
  })

  const companiesQuery = useQuery({
    queryKey: ['companies'],
    queryFn: getCompanies,
    enabled: open,
    staleTime: Infinity,
  })

  const guardianRelationshipsQuery = useQuery({
    queryKey: ['guardian-relationships'],
    queryFn: getGuardianRelationships,
    enabled: open,
    staleTime: Infinity,
  })

  const facilitySettingsQuery = useQuery({
    queryKey: ['facility-settings'],
    queryFn: getFacilitySettings,
    enabled: open,
  })
  const showRelativeFields = facilitySettingsQuery.data?.show_patient_relative_fields ?? false

  const createCompanyMutation = useMutation({
    mutationFn: createCompany,
    onSuccess: (company) => {
      queryClient.setQueryData<Company[]>(['companies'], (prev) =>
        prev ? [...prev, company].sort((a, b) => a.name.localeCompare(b.name)) : [company],
      )
      setCompanyId(String(company.id))
      setCompanySearch(company.name)
    },
  })

  const createGuardianRelationshipMutation = useMutation({
    mutationFn: createGuardianRelationship,
    onSuccess: (relationship) => {
      queryClient.setQueryData<GuardianRelationship[]>(['guardian-relationships'], (prev) =>
        prev ? [...prev, relationship].sort((a, b) => a.name.localeCompare(b.name)) : [relationship],
      )
      setGuardianRelationshipId(String(relationship.id))
      setGuardianRelationshipSearch(relationship.name)
    },
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
        company_id: companyId ? Number(companyId) : undefined,
        guardian_relationship_id: guardianRelationshipId ? Number(guardianRelationshipId) : undefined,
        admitting_doctor_id: admittingDoctor?.id,
        referred_by_doctor_id: referralDoctor?.id,
        emergency_contact_name: showRelativeFields && relativeName.trim() ? relativeName.trim() : undefined,
        emergency_contact_relationship:
          showRelativeFields && relativeRelationship.trim() ? relativeRelationship.trim() : undefined,
        emergency_contact_phone: showRelativeFields && relativePhone.trim() ? relativePhone.trim() : undefined,
        emergency_contact_address: showRelativeFields && relativeAddress.trim() ? relativeAddress.trim() : undefined,
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

  const columnCount = 2 + (showRelativeFields ? 1 : 0)
  const dialogMaxWidth = columnCount >= 3 ? 'md' : 'sm'

  const companies = companiesQuery.data ?? []
  const companySearchTerm = companySearch.trim()
  const hasExactCompanyMatch = companies.some(
    (company) => company.name.trim().toLowerCase() === companySearchTerm.toLowerCase(),
  )
  const companyOptions: CompanySearchOption[] = [
    ...companies
      .filter((company) => company.name.toLowerCase().includes(companySearchTerm.toLowerCase()))
      .map((company) => ({ kind: 'company' as const, company })),
    ...(companySearchTerm.length >= 2 && !hasExactCompanyMatch
      ? [{ kind: 'create' as const, name: companySearchTerm }]
      : []),
  ]
  const selectedCompany = companies.find((company) => String(company.id) === companyId) ?? null

  const guardianRelationships = guardianRelationshipsQuery.data ?? []
  const guardianRelationshipSearchTerm = guardianRelationshipSearch.trim()
  const hasExactGuardianRelationshipMatch = guardianRelationships.some(
    (relationship) => relationship.name.trim().toLowerCase() === guardianRelationshipSearchTerm.toLowerCase(),
  )
  const guardianRelationshipOptions: GuardianRelationshipSearchOption[] = [
    ...guardianRelationships
      .filter((relationship) => relationship.name.toLowerCase().includes(guardianRelationshipSearchTerm.toLowerCase()))
      .map((relationship) => ({ kind: 'relationship' as const, relationship })),
    ...(guardianRelationshipSearchTerm.length >= 2 && !hasExactGuardianRelationshipMatch
      ? [{ kind: 'create' as const, name: guardianRelationshipSearchTerm }]
      : []),
  ]
  const selectedGuardianRelationship =
    guardianRelationships.find((relationship) => String(relationship.id) === guardianRelationshipId) ?? null

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={dialogMaxWidth}
      slotProps={{ transition: { onEntered: () => nameInputRef.current?.focus() } }}
    >
      <DialogTitle>تسجيل مريض جديد</DialogTitle>
      <DialogContent>
        <Box
          component="form"
          id="register-patient-form"
          onSubmit={(event) => {
            event.preventDefault()
            handleSubmit()
          }}
          sx={{
            pt: 1,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: `repeat(${columnCount}, 1fr)` },
            alignItems: 'start',
            gap: 3,
          }}
        >
          <Stack spacing={2.5}>
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
            <DoctorPickerFields
              admittingDoctor={admittingDoctor}
              onAdmittingDoctorChange={setAdmittingDoctor}
              referralDoctor={referralDoctor}
              onReferralDoctorChange={setReferralDoctor}
            />
          </Stack>

          <Stack spacing={2.5}>
            <Typography variant="subtitle2" color="text.secondary">
              بيانات التأمين
            </Typography>
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
            <Autocomplete
              options={companyOptions}
              filterOptions={(options) => options}
              loading={companiesQuery.isFetching || createCompanyMutation.isPending}
              getOptionLabel={(option) => (option.kind === 'create' ? option.name : option.company.name)}
              isOptionEqualToValue={(option, value) =>
                option.kind === 'company' && value.kind === 'company' && option.company.id === value.company.id
              }
              renderOption={(props, option) => {
                const { key, ...optionProps } = props
                if (option.kind === 'create') {
                  return (
                    <li key={key} {...optionProps}>
                      <ListItemText primary={`+ إضافة "${option.name}" كشركة فرعية`} />
                    </li>
                  )
                }
                return (
                  <li key={key} {...optionProps}>
                    <ListItemText primary={option.company.name} />
                  </li>
                )
              }}
              value={selectedCompany ? { kind: 'company' as const, company: selectedCompany } : null}
              inputValue={companySearch}
              onInputChange={(_, value) => setCompanySearch(value)}
              onChange={(_, option) => {
                if (!option) {
                  setCompanyId('')
                  return
                }
                if (option.kind === 'create') {
                  createCompanyMutation.mutate(option.name)
                  return
                }
                setCompanyId(String(option.company.id))
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="الشركة الفرعية"
                  size="small"
                  slotProps={{
                    ...params.slotProps,
                    input: {
                      ...params.slotProps.input,
                      endAdornment: (
                        <>
                          {companiesQuery.isFetching || createCompanyMutation.isPending ? (
                            <CircularProgress color="inherit" size={16} />
                          ) : null}
                          {params.slotProps.input.endAdornment}
                        </>
                      ),
                    },
                  }}
                />
              )}
            />
            <Autocomplete
              options={guardianRelationshipOptions}
              filterOptions={(options) => options}
              loading={guardianRelationshipsQuery.isFetching || createGuardianRelationshipMutation.isPending}
              getOptionLabel={(option) => (option.kind === 'create' ? option.name : option.relationship.name)}
              isOptionEqualToValue={(option, value) =>
                option.kind === 'relationship' &&
                value.kind === 'relationship' &&
                option.relationship.id === value.relationship.id
              }
              renderOption={(props, option) => {
                const { key, ...optionProps } = props
                if (option.kind === 'create') {
                  return (
                    <li key={key} {...optionProps}>
                      <ListItemText primary={`+ إضافة "${option.name}" كصلة قرابة`} />
                    </li>
                  )
                }
                return (
                  <li key={key} {...optionProps}>
                    <ListItemText primary={option.relationship.name} />
                  </li>
                )
              }}
              value={
                selectedGuardianRelationship
                  ? { kind: 'relationship' as const, relationship: selectedGuardianRelationship }
                  : null
              }
              inputValue={guardianRelationshipSearch}
              onInputChange={(_, value) => setGuardianRelationshipSearch(value)}
              onChange={(_, option) => {
                if (!option) {
                  setGuardianRelationshipId('')
                  return
                }
                if (option.kind === 'create') {
                  createGuardianRelationshipMutation.mutate(option.name)
                  return
                }
                setGuardianRelationshipId(String(option.relationship.id))
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="صلة القرابة بالعائل"
                  size="small"
                  slotProps={{
                    ...params.slotProps,
                    input: {
                      ...params.slotProps.input,
                      endAdornment: (
                        <>
                          {guardianRelationshipsQuery.isFetching || createGuardianRelationshipMutation.isPending ? (
                            <CircularProgress color="inherit" size={16} />
                          ) : null}
                          {params.slotProps.input.endAdornment}
                        </>
                      ),
                    },
                  }}
                />
              )}
            />
          </Stack>

          {showRelativeFields && (
            <Stack spacing={2.5}>
              <Typography variant="subtitle2" color="text.secondary">
                بيانات شخص التواصل
              </Typography>
              <TextField
                label="اسم شخص التواصل"
                fullWidth
                size="small"
                value={relativeName}
                onChange={(event) => setRelativeName(event.target.value)}
              />
              <TextField
                label="صلة القرابة"
                fullWidth
                size="small"
                value={relativeRelationship}
                onChange={(event) => setRelativeRelationship(event.target.value)}
              />
              <TextField
                label="رقم هاتف شخص التواصل"
                fullWidth
                size="small"
                value={relativePhone}
                onChange={(event) => setRelativePhone(event.target.value)}
              />
              <TextField
                label="عنوان شخص التواصل"
                fullWidth
                size="small"
                value={relativeAddress}
                onChange={(event) => setRelativeAddress(event.target.value)}
              />
            </Stack>
          )}
        </Box>
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
