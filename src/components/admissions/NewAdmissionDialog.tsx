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
import { getInsuranceCompanies } from '@/services/insuranceCompanyService'
import { getAvailableBeds, getFloors, getRooms, getWards } from '@/services/facilityService'
import {
  searchLocalPatients,
  searchJawdaPatients,
  importJawdaPatient,
  createLocalPatient,
} from '@/services/patientService'
import { getRoomTypes } from '@/services/roomTypeService'
import { getRoomTypeName } from '@/lib/roomTypes'
import { createAdmission } from '@/services/admissionService'
import type { Patient, JawdaPatientResult } from '@/types/patient'
import { ADMISSION_ENTRY_TYPE_LABELS, type AdmissionEntryType } from '@/types/admission'

type PatientSearchOption =
  | { kind: 'local'; patient: Patient }
  | { kind: 'jawda'; patient: JawdaPatientResult }
  | { kind: 'create'; name: string }

export function NewAdmissionDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 400)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [floorId, setFloorId] = useState<number | ''>('')
  const [wardId, setWardId] = useState<number | ''>('')
  const [roomId, setRoomId] = useState<number | ''>('')
  const [bedId, setBedId] = useState<number | ''>('')
  const [entryType, setEntryType] = useState<AdmissionEntryType | ''>('')
  const [referringHospitalName, setReferringHospitalName] = useState('')

  const [createPatientOpen, setCreatePatientOpen] = useState(false)
  const [newPatientName, setNewPatientName] = useState('')
  const [newPatientPhone, setNewPatientPhone] = useState('')
  const [newPatientGender, setNewPatientGender] = useState<'male' | 'female' | ''>('')
  const [newPatientAgeYear, setNewPatientAgeYear] = useState('')
  const [newPatientInsuranceCompanyId, setNewPatientInsuranceCompanyId] = useState<string>('')
  const [newPatientInsuranceCardNumber, setNewPatientInsuranceCardNumber] = useState('')

  const floorInputRef = useRef<HTMLInputElement>(null)
  const wardInputRef = useRef<HTMLInputElement>(null)
  const roomInputRef = useRef<HTMLInputElement>(null)
  const bedInputRef = useRef<HTMLInputElement>(null)
  const newPatientNameInputRef = useRef<HTMLInputElement>(null)
  const newPatientPhoneInputRef = useRef<HTMLInputElement>(null)
  const newPatientGenderInputRef = useRef<HTMLInputElement>(null)
  const newPatientAgeInputRef = useRef<HTMLInputElement>(null)

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

  const importMutation = useMutation({
    mutationFn: importJawdaPatient,
    onSuccess: (patient) => {
      setSelectedPatient(patient)
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      focusField(floorInputRef)
    },
  })

  const insuranceCompaniesQuery = useQuery({
    queryKey: ['insurance-companies'],
    queryFn: getInsuranceCompanies,
    enabled: createPatientOpen,
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
    setEntryType('')
    setReferringHospitalName('')
    setCreatePatientOpen(false)
    setNewPatientName('')
    setNewPatientPhone('')
    setNewPatientGender('')
    setNewPatientAgeYear('')
    setNewPatientInsuranceCompanyId('')
    setNewPatientInsuranceCardNumber('')
    onClose()
  }

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
    setNewPatientInsuranceCompanyId('')
    setNewPatientInsuranceCardNumber('')
    setCreatePatientOpen(true)
  }

  function handleCreatePatientSubmit() {
    if (!newPatientName.trim()) return
    createPatientMutation.mutate({
      name: newPatientName.trim(),
      phone: newPatientPhone.trim() || undefined,
      gender: newPatientGender || undefined,
      age_year: newPatientAgeYear ? Number(newPatientAgeYear) : undefined,
      insurance_company_id: newPatientInsuranceCompanyId ? Number(newPatientInsuranceCompanyId) : undefined,
      insurance_card_number:
        newPatientInsuranceCompanyId && newPatientInsuranceCardNumber.trim()
          ? newPatientInsuranceCardNumber.trim()
          : undefined,
    })
  }

  const selectedBed = bedsQuery.data?.find((bed) => bed.id === bedId)

  const isHospitalTransfer = entryType === 'hospital_transfer'
  const isReferringHospitalMissing = isHospitalTransfer && !referringHospitalName.trim()

  function handleSubmit() {
    if (!selectedPatient || !bedId || isReferringHospitalMissing) return
    admitMutation.mutate({
      patient_id: selectedPatient.id,
      bed_id: Number(bedId),
      entry_type: entryType || null,
      referring_hospital_name: isHospitalTransfer ? referringHospitalName.trim() : null,
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
              }}
              renderInput={(params) => <TextField {...params} label="السرير" inputRef={bedInputRef} />}
            />
          </Box>

          <TextField
            select
            fullWidth
            size="small"
            label="نوع الدخول (اختياري)"
            value={entryType}
            onChange={(event) => {
              const value = event.target.value as AdmissionEntryType | ''
              setEntryType(value)
              if (value !== 'hospital_transfer') setReferringHospitalName('')
            }}
          >
            <MenuItem value="">غير محدد</MenuItem>
            {(Object.keys(ADMISSION_ENTRY_TYPE_LABELS) as AdmissionEntryType[]).map((key) => (
              <MenuItem key={key} value={key}>
                {ADMISSION_ENTRY_TYPE_LABELS[key]}
              </MenuItem>
            ))}
          </TextField>

          {isHospitalTransfer ? (
            <TextField
              fullWidth
              size="small"
              required
              label="اسم المستشفى المحوِّل"
              value={referringHospitalName}
              onChange={(event) => setReferringHospitalName(event.target.value)}
            />
          ) : null}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={resetAndClose}>إلغاء</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!selectedPatient || !bedId || isReferringHospitalMissing || admitMutation.isPending}
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
          <Autocomplete
            options={insuranceCompaniesQuery.data ?? []}
            getOptionLabel={(company) => company.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            loading={insuranceCompaniesQuery.isLoading}
            noOptionsText="لا توجد شركات تأمين"
            value={
              (insuranceCompaniesQuery.data ?? []).find((company) => String(company.id) === newPatientInsuranceCompanyId) ??
              null
            }
            onChange={(_, company) => {
              setNewPatientInsuranceCompanyId(company ? String(company.id) : '')
              if (!company) setNewPatientInsuranceCardNumber('')
            }}
            renderInput={(params) => <TextField {...params} label="شركة التأمين" size="small" />}
          />
          {newPatientInsuranceCompanyId && (
            <TextField
              label="رقم البطاقة"
              fullWidth
              size="small"
              value={newPatientInsuranceCardNumber}
              onChange={(e) => setNewPatientInsuranceCardNumber(e.target.value)}
            />
          )}
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
    </>
  )
}
