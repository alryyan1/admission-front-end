import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  CircularProgress,
  Stack,
  MenuItem,
  ListItemText,
} from '@mui/material'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { getDoctors, createDoctor } from '@/services/patientService'
import { getTeamRoles } from '@/services/teamRoleService'
import { createSpecialist, getSpecialists } from '@/services/specialistService'
import type { Doctor } from '@/types/patient'
import type { Specialist } from '@/types/admission'

type DoctorSearchOption = { kind: 'doctor'; doctor: Doctor } | { kind: 'create'; name: string }
type DoctorFieldTarget = 'admitting' | 'referral'
type SpecialistSearchOption = { kind: 'specialist'; specialist: Specialist } | { kind: 'create'; name: string }

interface DoctorPickerFieldsProps {
  admittingDoctor: Doctor | null
  onAdmittingDoctorChange: (doctor: Doctor | null) => void
  referralDoctor: Doctor | null
  onReferralDoctorChange: (doctor: Doctor | null) => void
}

/** Admitting and referring doctor pickers, with an inline dialog to add a doctor that does not exist yet. */
export function DoctorPickerFields({
  admittingDoctor,
  onAdmittingDoctorChange,
  referralDoctor,
  onReferralDoctorChange,
}: DoctorPickerFieldsProps) {
  const queryClient = useQueryClient()
  const referralInputRef = useRef<HTMLInputElement>(null)
  const newDoctorNameInputRef = useRef<HTMLInputElement>(null)

  const [doctorSearch, setDoctorSearch] = useState('')
  const debouncedDoctorSearch = useDebouncedValue(doctorSearch, 400)
  const [referralDoctorSearch, setReferralDoctorSearch] = useState('')
  const debouncedReferralDoctorSearch = useDebouncedValue(referralDoctorSearch, 400)

  const [quickAddDoctorOpen, setQuickAddDoctorOpen] = useState(false)
  const [quickAddDoctorTarget, setQuickAddDoctorTarget] = useState<DoctorFieldTarget>('admitting')
  const [newDoctorName, setNewDoctorName] = useState('')
  const [newDoctorRoleId, setNewDoctorRoleId] = useState<number | ''>('')
  const [newDoctorSpecialistId, setNewDoctorSpecialistId] = useState<number | ''>('')
  const [newDoctorSpecialistSearch, setNewDoctorSpecialistSearch] = useState('')

  const doctorsQuery = useQuery({
    queryKey: ['doctors', debouncedDoctorSearch],
    queryFn: () => getDoctors(debouncedDoctorSearch),
  })
  const referralDoctorsQuery = useQuery({
    queryKey: ['doctors', 'referral', debouncedReferralDoctorSearch],
    queryFn: () => getDoctors(debouncedReferralDoctorSearch),
  })
  const teamRolesQuery = useQuery({ queryKey: ['team-roles'], queryFn: getTeamRoles, enabled: quickAddDoctorOpen })
  const specialistsQuery = useQuery({ queryKey: ['specialists'], queryFn: getSpecialists, enabled: quickAddDoctorOpen })

  const createDoctorMutation = useMutation({
    mutationFn: createDoctor,
    onSuccess: (doctor) => {
      toast.success('تم إضافة الطبيب')
      queryClient.invalidateQueries({ queryKey: ['doctors'] })
      if (quickAddDoctorTarget === 'admitting') {
        onAdmittingDoctorChange(doctor)
        setDoctorSearch('')
        referralInputRef.current?.focus()
      } else {
        onReferralDoctorChange(doctor)
        setReferralDoctorSearch('')
      }
      setQuickAddDoctorOpen(false)
    },
  })

  const createSpecialistMutation = useMutation({
    mutationFn: createSpecialist,
    onSuccess: (specialist: Specialist) => {
      queryClient.setQueryData<Specialist[]>(['specialists'], (prev) =>
        prev ? [...prev, specialist].sort((a, b) => a.name.localeCompare(b.name)) : [specialist],
      )
      setNewDoctorSpecialistId(specialist.id)
      setNewDoctorSpecialistSearch(specialist.name)
    },
  })

  /** Default a fresh quick-add doctor to "surgeon", the most common role, once roles are loaded. */
  useEffect(() => {
    if (!quickAddDoctorOpen || newDoctorRoleId !== '') return
    const surgeonRoleId = teamRolesQuery.data?.find((role) => role.slug === 'surgeon')?.id
    if (surgeonRoleId !== undefined) setNewDoctorRoleId(surgeonRoleId)
  }, [quickAddDoctorOpen, newDoctorRoleId, teamRolesQuery.data])

  function openQuickAddDoctor(name: string, target: DoctorFieldTarget) {
    setNewDoctorName(name.trim())
    setNewDoctorRoleId('')
    setNewDoctorSpecialistId('')
    setNewDoctorSpecialistSearch('')
    setQuickAddDoctorTarget(target)
    setQuickAddDoctorOpen(true)
  }

  function handleCreateDoctorSubmit() {
    if (!newDoctorName.trim() || !newDoctorRoleId) return
    createDoctorMutation.mutate({
      name: newDoctorName.trim(),
      specialist_id: newDoctorSpecialistId || null,
      role_id: Number(newDoctorRoleId),
    })
  }

  const canOfferCreateDoctor = debouncedDoctorSearch.trim().length >= 2 && !doctorsQuery.isFetching
  const doctorOptions: DoctorSearchOption[] = [
    ...(doctorsQuery.data ?? []).map((doctor) => ({ kind: 'doctor' as const, doctor })),
    ...(canOfferCreateDoctor ? [{ kind: 'create' as const, name: doctorSearch }] : []),
  ]

  const canOfferCreateReferralDoctor =
    debouncedReferralDoctorSearch.trim().length >= 2 && !referralDoctorsQuery.isFetching
  const referralDoctorOptions: DoctorSearchOption[] = [
    ...(referralDoctorsQuery.data ?? []).map((doctor) => ({ kind: 'doctor' as const, doctor })),
    ...(canOfferCreateReferralDoctor ? [{ kind: 'create' as const, name: referralDoctorSearch }] : []),
  ]

  const specialists = specialistsQuery.data ?? []
  const selectedNewDoctorSpecialist = specialists.find((specialist) => specialist.id === newDoctorSpecialistId) ?? null
  const specialistSearchTerm = newDoctorSpecialistSearch.trim()
  const hasExactSpecialistMatch = specialists.some(
    (specialist) => specialist.name.trim().toLowerCase() === specialistSearchTerm.toLowerCase(),
  )
  const specialistOptions: SpecialistSearchOption[] = [
    ...specialists
      .filter((specialist) => specialist.name.toLowerCase().includes(specialistSearchTerm.toLowerCase()))
      .map((specialist) => ({ kind: 'specialist' as const, specialist })),
    ...(specialistSearchTerm.length >= 2 && !hasExactSpecialistMatch
      ? [{ kind: 'create' as const, name: specialistSearchTerm }]
      : []),
  ]

  function renderDoctorOption(props: React.HTMLAttributes<HTMLLIElement> & { key?: React.Key }, option: DoctorSearchOption) {
    const { key, ...optionProps } = props
    if (option.kind === 'create') {
      return (
        <li key={key} {...optionProps}>
          <ListItemText primary={`+ إضافة "${option.name}" كطبيب جديد`} />
        </li>
      )
    }
    return (
      <li key={key} {...optionProps}>
        <ListItemText primary={option.doctor.name} secondary={option.doctor.specialist?.name} />
      </li>
    )
  }

  return (
    <>
      <Autocomplete
        fullWidth
        size="small"
        options={doctorOptions}
        filterOptions={(options) => options}
        loading={doctorsQuery.isFetching}
        getOptionLabel={(option) => (option.kind === 'create' ? option.name : option.doctor.name)}
        isOptionEqualToValue={(option, value) =>
          option.kind === 'doctor' && value.kind === 'doctor' && option.doctor.id === value.doctor.id
        }
        renderOption={renderDoctorOption}
        value={admittingDoctor ? { kind: 'doctor' as const, doctor: admittingDoctor } : null}
        inputValue={doctorSearch}
        onInputChange={(_, value) => setDoctorSearch(value)}
        onChange={(_, option) => {
          if (!option) {
            onAdmittingDoctorChange(null)
            return
          }
          if (option.kind === 'create') {
            openQuickAddDoctor(option.name, 'admitting')
            return
          }
          onAdmittingDoctorChange(option.doctor)
          referralInputRef.current?.focus()
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="الطبيب المعالج"
            slotProps={{
              ...params.slotProps,
              input: {
                ...params.slotProps.input,
                endAdornment: (
                  <>
                    {doctorsQuery.isFetching ? <CircularProgress color="inherit" size={16} /> : null}
                    {params.slotProps.input.endAdornment}
                  </>
                ),
              },
            }}
          />
        )}
      />

      <Autocomplete
        fullWidth
        size="small"
        options={referralDoctorOptions}
        filterOptions={(options) => options}
        loading={referralDoctorsQuery.isFetching}
        getOptionLabel={(option) => (option.kind === 'create' ? option.name : option.doctor.name)}
        isOptionEqualToValue={(option, value) =>
          option.kind === 'doctor' && value.kind === 'doctor' && option.doctor.id === value.doctor.id
        }
        renderOption={renderDoctorOption}
        value={referralDoctor ? { kind: 'doctor' as const, doctor: referralDoctor } : null}
        inputValue={referralDoctorSearch}
        onInputChange={(_, value) => setReferralDoctorSearch(value)}
        onChange={(_, option) => {
          if (!option) {
            onReferralDoctorChange(null)
            return
          }
          if (option.kind === 'create') {
            openQuickAddDoctor(option.name, 'referral')
            return
          }
          onReferralDoctorChange(option.doctor)
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="الطبيب المحوّل"
            inputRef={referralInputRef}
            slotProps={{
              ...params.slotProps,
              input: {
                ...params.slotProps.input,
                endAdornment: (
                  <>
                    {referralDoctorsQuery.isFetching ? <CircularProgress color="inherit" size={16} /> : null}
                    {params.slotProps.input.endAdornment}
                  </>
                ),
              },
            }}
          />
        )}
      />

      <Dialog
        open={quickAddDoctorOpen}
        onClose={() => setQuickAddDoctorOpen(false)}
        fullWidth
        maxWidth="xs"
        slotProps={{ transition: { onEntered: () => newDoctorNameInputRef.current?.focus() } }}
      >
        <DialogTitle>إضافة طبيب جديد</DialogTitle>
        <DialogContent>
          <Stack
            component="form"
            id="create-doctor-form"
            onSubmit={(e) => {
              e.preventDefault()
              handleCreateDoctorSubmit()
            }}
            spacing={2.5}
            sx={{ pt: 1 }}
          >
            <TextField
              inputRef={newDoctorNameInputRef}
              label="اسم الطبيب"
              fullWidth
              size="small"
              value={newDoctorName}
              onChange={(e) => setNewDoctorName(e.target.value)}
            />
            <TextField
              select
              label="الدور"
              fullWidth
              size="small"
              value={newDoctorRoleId}
              onChange={(e) => setNewDoctorRoleId(e.target.value ? Number(e.target.value) : '')}
            >
              {(teamRolesQuery.data ?? []).map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  {role.name}
                </MenuItem>
              ))}
            </TextField>
            <Autocomplete
              fullWidth
              size="small"
              options={specialistOptions}
              filterOptions={(options) => options}
              loading={specialistsQuery.isFetching || createSpecialistMutation.isPending}
              disabled={createSpecialistMutation.isPending}
              noOptionsText="اكتب حرفين على الأقل للإضافة"
              getOptionLabel={(option) => (option.kind === 'create' ? option.name : option.specialist.name)}
              isOptionEqualToValue={(option, value) =>
                option.kind === 'specialist' && value.kind === 'specialist' && option.specialist.id === value.specialist.id
              }
              renderOption={(props, option) => {
                const { key, ...optionProps } = props
                if (option.kind === 'create') {
                  return (
                    <li key={key} {...optionProps}>
                      <ListItemText primary={`+ إضافة "${option.name}" كتخصص جديد`} />
                    </li>
                  )
                }
                return (
                  <li key={key} {...optionProps}>
                    <ListItemText primary={option.specialist.name} />
                  </li>
                )
              }}
              value={
                selectedNewDoctorSpecialist ? { kind: 'specialist' as const, specialist: selectedNewDoctorSpecialist } : null
              }
              inputValue={newDoctorSpecialistSearch}
              onInputChange={(_, value) => setNewDoctorSpecialistSearch(value)}
              onChange={(_, option) => {
                if (!option) {
                  setNewDoctorSpecialistId('')
                  return
                }
                if (option.kind === 'create') {
                  createSpecialistMutation.mutate(option.name)
                  return
                }
                setNewDoctorSpecialistId(option.specialist.id)
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="التخصص"
                  slotProps={{
                    ...params.slotProps,
                    input: {
                      ...params.slotProps.input,
                      endAdornment: (
                        <>
                          {createSpecialistMutation.isPending ? <CircularProgress color="inherit" size={16} /> : null}
                          {params.slotProps.input.endAdornment}
                        </>
                      ),
                    },
                  }}
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuickAddDoctorOpen(false)}>إلغاء</Button>
          <Button
            type="submit"
            form="create-doctor-form"
            variant="contained"
            disabled={!newDoctorName.trim() || !newDoctorRoleId || createDoctorMutation.isPending}
          >
            إضافة
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
