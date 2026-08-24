import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
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
} from '@mui/material'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { getAvailableBeds, getFloors, getRooms, getWards } from '@/services/facilityService'
import {
  searchLocalPatients,
  searchJawdaPatients,
  importJawdaPatient,
  createLocalPatient,
  getDoctors,
} from '@/services/patientService'
import { getTeamRoles } from '@/services/teamRoleService'
import { createAdmission } from '@/services/admissionService'
import type { Patient, JawdaPatientResult, Doctor } from '@/types/patient'

const DURATION_OPTIONS = [
  { value: 12 as const, label: '12 ساعة' },
  { value: 24 as const, label: '24 ساعة' },
]

type PatientSearchOption =
  | { kind: 'local'; patient: Patient }
  | { kind: 'jawda'; patient: JawdaPatientResult }
  | { kind: 'create'; name: string }

export function NewAdmissionDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

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
  const [durationHours, setDurationHours] = useState<12 | 24 | ''>('')
  const [diagnosis, setDiagnosis] = useState('')
  const [notes, setNotes] = useState('')

  const floorInputRef = useRef<HTMLInputElement>(null)
  const wardInputRef = useRef<HTMLInputElement>(null)
  const roomInputRef = useRef<HTMLInputElement>(null)
  const bedInputRef = useRef<HTMLInputElement>(null)
  const durationInputRef = useRef<HTMLInputElement>(null)
  const doctorInputRef = useRef<HTMLInputElement>(null)
  const diagnosisInputRef = useRef<HTMLInputElement>(null)
  const notesInputRef = useRef<HTMLTextAreaElement>(null)

  function focusField(ref: React.RefObject<HTMLElement | null>) {
    setTimeout(() => ref.current?.focus(), 50)
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
  const bedsQuery = useQuery({
    queryKey: ['beds', 'available', roomId],
    queryFn: () => getAvailableBeds(roomId as number),
    enabled: open && roomId !== '',
  })
  const teamRolesQuery = useQuery({ queryKey: ['team-roles'], queryFn: getTeamRoles, enabled: open })
  const surgeonRoleId = teamRolesQuery.data?.find((r) => r.slug === 'surgeon')?.id
  const doctorsQuery = useQuery({
    queryKey: ['doctors', debouncedDoctorSearch, surgeonRoleId],
    queryFn: () => getDoctors(debouncedDoctorSearch, surgeonRoleId),
    enabled: open && surgeonRoleId !== undefined,
  })

  const importMutation = useMutation({
    mutationFn: importJawdaPatient,
    onSuccess: (patient) => {
      setSelectedPatient(patient)
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      focusField(floorInputRef)
    },
  })

  const admitMutation = useMutation({
    mutationFn: createAdmission,
    onSuccess: (admission) => {
      toast.success('تم تنويم المريض بنجاح')
      queryClient.invalidateQueries({ queryKey: ['admissions'] })
      queryClient.invalidateQueries({ queryKey: ['floors'] })
      resetAndClose()
      navigate(`/admissions/${admission.id}`)
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
    setDurationHours('')
    setDiagnosis('')
    setNotes('')
    onClose()
  }

  function handleCreateWalkIn() {
    if (!search.trim()) return
    createLocalPatient({ name: search.trim() }).then((patient) => {
      setSelectedPatient(patient)
      focusField(floorInputRef)
    })
  }

  const selectedBed = bedsQuery.data?.find((bed) => bed.id === bedId)
  const isShortStayBed = selectedBed?.room?.is_short_stay ?? false

  function handleSubmit() {
    if (!selectedPatient || !bedId) return
    if (isShortStayBed && !durationHours) return
    admitMutation.mutate({
      patient_id: selectedPatient.id,
      bed_id: Number(bedId),
      admitting_doctor_id: selectedDoctor ? selectedDoctor.id : null,
      admission_duration_hours: isShortStayBed ? (durationHours as 12 | 24) : undefined,
      diagnosis: diagnosis || undefined,
      admission_notes: notes || undefined,
    })
  }

  const isSearchingPatients = localResultsQuery.isLoading || jawdaResultsQuery.isLoading
  const hasNoPatientMatches =
    debouncedSearch.length >= 2 && !isSearchingPatients && !localResultsQuery.data?.length && !jawdaResultsQuery.data?.length
  const patientSearchOptions: PatientSearchOption[] = [
    ...(localResultsQuery.data ?? []).map((patient) => ({ kind: 'local' as const, patient })),
    ...(jawdaResultsQuery.data ?? []).map((patient) => ({ kind: 'jawda' as const, patient })),
    ...(hasNoPatientMatches ? [{ kind: 'create' as const, name: search }] : []),
  ]

  const selectedFloor = floorsQuery.data?.find((floor) => floor.id === floorId) ?? null
  const selectedWard = wardsQuery.data?.find((ward) => ward.id === wardId) ?? null
  const selectedRoom = roomsQuery.data?.find((room) => room.id === roomId) ?? null
  const selectedDuration = DURATION_OPTIONS.find((option) => option.value === durationHours) ?? null

  return (
    <Dialog open={open} onClose={resetAndClose} fullWidth maxWidth="sm">
      <DialogTitle>تنويم مريض جديد</DialogTitle>

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
                else handleCreateWalkIn()
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
                  label="ابحث بالاسم أو رقم الهاتف"
                  autoFocus
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
              options={floorsQuery.data ?? []}
              getOptionLabel={(floor) => floor.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={selectedFloor}
              onChange={(_, floor) => {
                setFloorId(floor ? floor.id : '')
                setWardId('')
                setRoomId('')
                setBedId('')
                setDurationHours('')
                if (floor) focusField(wardInputRef)
              }}
              renderInput={(params) => <TextField {...params} label="الطابق" inputRef={floorInputRef} />}
            />

            <Autocomplete
              sx={{ flex: 1 }}
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
                setDurationHours('')
                if (ward) focusField(roomInputRef)
              }}
              renderInput={(params) => <TextField {...params} label="القسم" inputRef={wardInputRef} />}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Autocomplete
              sx={{ flex: 1 }}
              size="small"
              disabled={wardId === ''}
              options={roomsQuery.data ?? []}
              getOptionLabel={(room) => `غرفة ${room.room_number}${room.is_short_stay ? ' (إقامة قصيرة)' : ''}`}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={selectedRoom}
              onChange={(_, room) => {
                setRoomId(room ? room.id : '')
                setBedId('')
                setDurationHours('')
                if (room) focusField(bedInputRef)
              }}
              renderInput={(params) => <TextField {...params} label="الغرفة" inputRef={roomInputRef} />}
            />

            <Autocomplete
              sx={{ flex: 1 }}
              size="small"
              disabled={roomId === ''}
              options={bedsQuery.data ?? []}
              getOptionLabel={(bed) => `سرير ${bed.bed_number}`}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={selectedBed ?? null}
              onChange={(_, bed) => {
                setBedId(bed ? bed.id : '')
                setDurationHours('')
                if (bed) focusField(bed.room?.is_short_stay ? durationInputRef : doctorInputRef)
              }}
              renderInput={(params) => <TextField {...params} label="السرير" inputRef={bedInputRef} />}
            />
          </Box>

          {isShortStayBed && (
            <Autocomplete
              fullWidth
              size="small"
              options={DURATION_OPTIONS}
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(option, value) => option.value === value.value}
              value={selectedDuration}
              onChange={(_, option) => {
                setDurationHours(option ? option.value : '')
                if (option) focusField(doctorInputRef)
              }}
              renderInput={(params) => <TextField {...params} label="مدة الإقامة القصيرة" inputRef={durationInputRef} />}
            />
          )}

          <Autocomplete
            fullWidth
            size="small"
            options={doctorsQuery.data ?? []}
            filterOptions={(options) => options}
            loading={doctorsQuery.isFetching}
            getOptionLabel={(doctor) => doctor.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            value={selectedDoctor}
            inputValue={doctorSearch}
            onInputChange={(_, value) => setDoctorSearch(value)}
            onChange={(_, doctor) => {
              setSelectedDoctor(doctor)
              if (doctor) focusField(diagnosisInputRef)
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="ابحث عن الطبيب المعالج"
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

          <TextField
            id="diagnosis"
            label="التشخيص"
            fullWidth
            size="small"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            inputRef={diagnosisInputRef}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                notesInputRef.current?.focus()
              }
            }}
          />
          <TextField
            id="admission-notes"
            label="ملاحظات الدخول"
            fullWidth
            multiline
            rows={2}
            size="small"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            inputRef={notesInputRef}
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={resetAndClose}>إلغاء</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!selectedPatient || !bedId || (isShortStayBed && !durationHours) || admitMutation.isPending}
        >
          تنويم
        </Button>
      </DialogActions>
    </Dialog>
  )
}
