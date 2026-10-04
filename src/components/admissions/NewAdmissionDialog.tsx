import { useEffect, useRef, useState } from 'react'
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
  CircularProgress,
  Divider,
  Chip,
  Stack,
  Box,
  Typography,
  ListItemText,
  MenuItem,
} from '@mui/material'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { getAvailableBeds, getFloors, getRooms, getWards } from '@/services/facilityService'
import {
  searchLocalPatients,
  searchJawdaPatients,
  importJawdaPatient,
  createLocalPatient,
  getDoctors,
  createDoctor,
} from '@/services/patientService'
import { getRoomTypes } from '@/services/roomTypeService'
import { getRoomTypeName } from '@/lib/roomTypes'
import { getTeamRoles } from '@/services/teamRoleService'
import { createSpecialist, getSpecialists } from '@/services/specialistService'
import { createAdmission } from '@/services/admissionService'
import type { Patient, JawdaPatientResult, Doctor } from '@/types/patient'
import type { Specialist } from '@/types/admission'

type PatientSearchOption =
  | { kind: 'local'; patient: Patient }
  | { kind: 'jawda'; patient: JawdaPatientResult }
  | { kind: 'create'; name: string }

type DoctorSearchOption = { kind: 'doctor'; doctor: Doctor } | { kind: 'create'; name: string }
type DoctorFieldTarget = 'admitting' | 'referral'
type SpecialistSearchOption = { kind: 'specialist'; specialist: Specialist } | { kind: 'create'; name: string }

export function NewAdmissionDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 400)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [floorId, setFloorId] = useState<number | ''>('')
  const [wardId, setWardId] = useState<number | ''>('')
  const [roomId, setRoomId] = useState<number | ''>('')
  const [bedId, setBedId] = useState<number | ''>('')
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [doctorSearch, setDoctorSearch] = useState('')
  const debouncedDoctorSearch = useDebouncedValue(doctorSearch, 400)
  const [referralDoctor, setReferralDoctor] = useState<Doctor | null>(null)
  const [referralDoctorSearch, setReferralDoctorSearch] = useState('')
  const debouncedReferralDoctorSearch = useDebouncedValue(referralDoctorSearch, 400)

  const [createPatientOpen, setCreatePatientOpen] = useState(false)
  const [newPatientName, setNewPatientName] = useState('')
  const [newPatientPhone, setNewPatientPhone] = useState('')
  const [newPatientGender, setNewPatientGender] = useState<'male' | 'female' | ''>('')
  const [newPatientAgeYear, setNewPatientAgeYear] = useState('')

  const [quickAddDoctorOpen, setQuickAddDoctorOpen] = useState(false)
  const [quickAddDoctorTarget, setQuickAddDoctorTarget] = useState<DoctorFieldTarget>('admitting')
  const [newDoctorName, setNewDoctorName] = useState('')
  const [newDoctorRoleId, setNewDoctorRoleId] = useState<number | ''>('')
  const [newDoctorSpecialistId, setNewDoctorSpecialistId] = useState<number | ''>('')
  const [newDoctorSpecialistSearch, setNewDoctorSpecialistSearch] = useState('')

  const floorInputRef = useRef<HTMLInputElement>(null)
  const wardInputRef = useRef<HTMLInputElement>(null)
  const roomInputRef = useRef<HTMLInputElement>(null)
  const bedInputRef = useRef<HTMLInputElement>(null)
  const doctorInputRef = useRef<HTMLInputElement>(null)
  const referralDoctorInputRef = useRef<HTMLInputElement>(null)
  const newPatientNameInputRef = useRef<HTMLInputElement>(null)
  const newPatientPhoneInputRef = useRef<HTMLInputElement>(null)
  const newPatientGenderInputRef = useRef<HTMLInputElement>(null)
  const newPatientAgeInputRef = useRef<HTMLInputElement>(null)
  const newDoctorNameInputRef = useRef<HTMLInputElement>(null)

  function focusField(ref: React.RefObject<HTMLElement | null>) {
    setTimeout(() => ref.current?.focus(), 50)
  }

  /** Enter moves to the next field instead of submitting the form. */
  function advanceOnEnter(nextRef: React.RefObject<HTMLElement | null>) {
    return (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        nextRef.current?.focus()
      }
    }
  }

  const localResultsQuery = useQuery({
    queryKey: ['patients', 'search-local', debouncedSearch],
    queryFn: () => searchLocalPatients(debouncedSearch),
    enabled: debouncedSearch.length >= 2,
  })

  const jawdaResultsQuery = useQuery({
    queryKey: ['patients', 'search-jawda', debouncedSearch],
    queryFn: () => searchJawdaPatients(debouncedSearch),
    enabled: debouncedSearch.length >= 2,
  })

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
  const doctorsQuery = useQuery({
    queryKey: ['doctors', debouncedDoctorSearch],
    queryFn: () => getDoctors(debouncedDoctorSearch),
    enabled: open,
  })
  const referralDoctorsQuery = useQuery({
    queryKey: ['doctors', 'referral', debouncedReferralDoctorSearch],
    queryFn: () => getDoctors(debouncedReferralDoctorSearch),
    enabled: open,
  })
  const teamRolesQuery = useQuery({ queryKey: ['team-roles'], queryFn: getTeamRoles, enabled: quickAddDoctorOpen })
  const specialistsQuery = useQuery({ queryKey: ['specialists'], queryFn: getSpecialists, enabled: quickAddDoctorOpen })

  const importMutation = useMutation({
    mutationFn: importJawdaPatient,
    onSuccess: (patient) => {
      setSelectedPatient(patient)
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      focusField(floorInputRef)
    },
  })

  const createPatientMutation = useMutation({
    mutationFn: createLocalPatient,
    onSuccess: (patient) => {
      toast.success('تم إضافة المريض')
      setSelectedPatient(patient)
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      setCreatePatientOpen(false)
      focusField(floorInputRef)
    },
  })

  const createDoctorMutation = useMutation({
    mutationFn: createDoctor,
    onSuccess: (doctor) => {
      toast.success('تم إضافة الطبيب')
      queryClient.invalidateQueries({ queryKey: ['doctors'] })
      if (quickAddDoctorTarget === 'admitting') {
        setSelectedDoctor(doctor)
        setDoctorSearch('')
        focusField(referralDoctorInputRef)
      } else {
        setReferralDoctor(doctor)
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

  const admitMutation = useMutation({
    mutationFn: createAdmission,
    onSuccess: () => {
      toast.success('تم تنويم المريض بنجاح')
      queryClient.invalidateQueries({ queryKey: ['admissions'] })
      queryClient.invalidateQueries({ queryKey: ['floors'] })
      resetAndClose()
    },
  })

  function resetAndClose() {
    setSearch('')
    setSelectedPatient(null)
    setFloorId('')
    setWardId('')
    setRoomId('')
    setBedId('')
    setSelectedDoctor(null)
    setDoctorSearch('')
    setReferralDoctor(null)
    setReferralDoctorSearch('')
    setCreatePatientOpen(false)
    setNewPatientName('')
    setNewPatientPhone('')
    setNewPatientGender('')
    setNewPatientAgeYear('')
    setQuickAddDoctorOpen(false)
    setNewDoctorName('')
    setNewDoctorRoleId('')
    setNewDoctorSpecialistId('')
    setNewDoctorSpecialistSearch('')
    onClose()
  }

  /** Default a fresh quick-add doctor to "surgeon", the most common role, once roles are loaded. */
  useEffect(() => {
    if (!quickAddDoctorOpen || newDoctorRoleId !== '') return
    const surgeonRoleId = teamRolesQuery.data?.find((role) => role.slug === 'surgeon')?.id
    if (surgeonRoleId !== undefined) setNewDoctorRoleId(surgeonRoleId)
  }, [quickAddDoctorOpen, newDoctorRoleId, teamRolesQuery.data])

  /** Pressing "+" again while this dialog is already open jumps straight to "إضافة مريض جديد". */
  useEffect(() => {
    if (!open || createPatientOpen) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== '+') return
      const target = e.target as HTMLElement
      const isPatientSearchInput = target.id === 'patient-search'
      if (
        !isPatientSearchInput &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return
      }
      e.preventDefault()
      openCreatePatientDialog(search)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, createPatientOpen, search])

  function openCreatePatientDialog(name: string) {
    setNewPatientName(name.trim())
    setNewPatientPhone('')
    setNewPatientGender('')
    setNewPatientAgeYear('')
    setCreatePatientOpen(true)
  }

  function handleCreatePatientSubmit() {
    if (!newPatientName.trim()) return
    createPatientMutation.mutate({
      name: newPatientName.trim(),
      phone: newPatientPhone.trim() || undefined,
      gender: newPatientGender || undefined,
      age_year: newPatientAgeYear ? Number(newPatientAgeYear) : undefined,
    })
  }

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

  const selectedBed = bedsQuery.data?.find((bed) => bed.id === bedId)

  function handleSubmit() {
    if (!selectedPatient || !bedId) return
    admitMutation.mutate({
      patient_id: selectedPatient.id,
      bed_id: Number(bedId),
      admitting_doctor_id: selectedDoctor ? selectedDoctor.id : null,
      referred_by_doctor_id: referralDoctor ? referralDoctor.id : null,
    })
  }

  const isSearchingPatients = localResultsQuery.isLoading || jawdaResultsQuery.isLoading
  const canOfferCreate = debouncedSearch.trim().length >= 2 && !isSearchingPatients
  const patientSearchOptions: PatientSearchOption[] = [
    ...(localResultsQuery.data ?? []).map((patient) => ({ kind: 'local' as const, patient })),
    ...(jawdaResultsQuery.data ?? []).map((patient) => ({ kind: 'jawda' as const, patient })),
    ...(canOfferCreate ? [{ kind: 'create' as const, name: search }] : []),
  ]

  const selectedFloor = floorsQuery.data?.find((floor) => floor.id === floorId) ?? null
  const selectedWard = wardsQuery.data?.find((ward) => ward.id === wardId) ?? null
  const selectedRoom = roomsQuery.data?.find((room) => room.id === roomId) ?? null

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
    <Dialog open={open} onClose={resetAndClose} fullWidth maxWidth="sm" disableEnforceFocus={createPatientOpen}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        تنويم مريض جديد
        <Button variant="contained" onClick={() => openCreatePatientDialog(search)}>
          + تسجيل جديد
        </Button>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {!selectedPatient ? (
            <Autocomplete
              fullWidth
              size="small"
              options={patientSearchOptions}
              filterOptions={(options) => options}
              loading={isSearchingPatients}
              value={null}
              inputValue={search}
              onInputChange={(_, value) => setSearch(value)}
              onChange={(_, option) => {
                if (!option) return
                if (option.kind === 'local') {
                  setSelectedPatient(option.patient)
                  focusField(floorInputRef)
                } else if (option.kind === 'jawda') importMutation.mutate(option.patient)
                else openCreatePatientDialog(option.name)
              }}
              getOptionLabel={(option) => (option.kind === 'create' ? option.name : option.patient.name)}
              noOptionsText={search.length < 2 ? 'اكتب حرفين على الأقل' : 'لا توجد نتائج'}
              renderOption={(props, option) => {
                const { key, ...optionProps } = props
                if (option.kind === 'create') {
                  return (
                    <li key={key} {...optionProps}>
                      <ListItemText primary={`إضافة "${option.name}" كمريض جديد (محلي)`} />
                    </li>
                  )
                }
                return (
                  <li key={key} {...optionProps}>
                    <ListItemText
                      primary={option.patient.name}
                      secondary={
                        option.kind === 'local'
                          ? `محلي — ${option.patient.phone ?? ''}`
                          : `من Jawda Medical — ${option.patient.phone ?? ''}`
                      }
                    />
                    <Chip
                      label={option.kind === 'local' ? 'محفوظ' : 'استيراد'}
                      size="small"
                      color={option.kind === 'local' ? 'default' : 'primary'}
                    />
                  </li>
                )
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  id="patient-search"
                  label="ابحث عن مريض موجود بالاسم او رقم الهاتف"
                  
                  slotProps={{
                    ...params.slotProps,
                    input: {
                      ...params.slotProps.input,
                      endAdornment: (
                        <>
                          {isSearchingPatients ? <CircularProgress color="inherit" size={16} /> : null}
                          {params.slotProps.input.endAdornment}
                        </>
                      ),
                    },
                  }}
                />
              )}
            />
          ) : (
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2">
                المريض: <b>{selectedPatient.name}</b>
              </Typography>
              <Button size="small" onClick={() => setSelectedPatient(null)}>
                تغيير
              </Button>
            </Stack>
          )}

          <Divider />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Autocomplete
              sx={{ flex: 1 }}
              size="small"
              disabled={!selectedPatient}
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
              disabled={!selectedPatient || floorId === ''}
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
              disabled={!selectedPatient || wardId === ''}
              options={roomsQuery.data ?? []}
              getOptionLabel={(room) => `غرفة ${room.room_number} (${getRoomTypeName(roomTypesQuery.data, room.room_type)})`}
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
              disabled={!selectedPatient || roomId === ''}
              options={bedsQuery.data ?? []}
              getOptionLabel={(bed) => `سرير ${bed.bed_number}`}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={selectedBed ?? null}
              onChange={(_, bed) => {
                setBedId(bed ? bed.id : '')
                if (bed) focusField(doctorInputRef)
              }}
              renderInput={(params) => <TextField {...params} label="السرير" inputRef={bedInputRef} />}
            />
          </Box>

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
            value={selectedDoctor ? { kind: 'doctor' as const, doctor: selectedDoctor } : null}
            inputValue={doctorSearch}
            onInputChange={(_, value) => setDoctorSearch(value)}
            onChange={(_, option) => {
              if (!option) {
                setSelectedDoctor(null)
                return
              }
              if (option.kind === 'create') {
                openQuickAddDoctor(option.name, 'admitting')
                return
              }
              setSelectedDoctor(option.doctor)
              focusField(referralDoctorInputRef)
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="  الطبيب المعالج"
                inputRef={doctorInputRef}
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
                setReferralDoctor(null)
                return
              }
              if (option.kind === 'create') {
                openQuickAddDoctor(option.name, 'referral')
                return
              }
              setReferralDoctor(option.doctor)
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="الطبيب المحوِّل"
                inputRef={referralDoctorInputRef}
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
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={resetAndClose}>إلغاء</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!selectedPatient || !bedId || admitMutation.isPending}
        >
          تنويم
        </Button>
      </DialogActions>
    </Dialog>

    <Dialog
      open={createPatientOpen}
      onClose={() => setCreatePatientOpen(false)}
      fullWidth
      maxWidth="xs"
      slotProps={{ transition: { onEntered: () => newPatientNameInputRef.current?.focus() } }}
    >
      <DialogTitle>إضافة مريض جديد</DialogTitle>
      <DialogContent>
        <Stack
          component="form"
          id="create-patient-form"
          onSubmit={(e) => {
            e.preventDefault()
            handleCreatePatientSubmit()
          }}
          spacing={2.5}
          sx={{ pt: 1 }}
        >
          <TextField
            inputRef={newPatientNameInputRef}
            label="اسم المريض"
            fullWidth
            size="small"
            value={newPatientName}
            onChange={(e) => setNewPatientName(e.target.value)}
            onKeyDown={advanceOnEnter(newPatientPhoneInputRef)}
          />
          <TextField
            inputRef={newPatientPhoneInputRef}
            label="رقم الهاتف"
            fullWidth
            size="small"
            value={newPatientPhone}
            onChange={(e) => setNewPatientPhone(e.target.value)}
            onKeyDown={advanceOnEnter(newPatientGenderInputRef)}
          />
          <TextField
            select
            inputRef={newPatientGenderInputRef}
            label="النوع"
            fullWidth
            size="small"
            value={newPatientGender}
            onChange={(e) => setNewPatientGender(e.target.value as 'male' | 'female' | '')}
            onKeyDown={advanceOnEnter(newPatientAgeInputRef)}
          >
            <MenuItem value="male">ذكر</MenuItem>
            <MenuItem value="female">أنثى</MenuItem>
          </TextField>
          <TextField
            inputRef={newPatientAgeInputRef}
            label="العمر (سنوات)"
            type="number"
            fullWidth
            size="small"
            value={newPatientAgeYear}
            onChange={(e) => setNewPatientAgeYear(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setCreatePatientOpen(false)}>إلغاء</Button>
        <Button
          type="submit"
          form="create-patient-form"
          variant="contained"
          disabled={!newPatientName.trim() || createPatientMutation.isPending}
        >
          إضافة
        </Button>
      </DialogActions>
    </Dialog>

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
