import { useQuery } from '@tanstack/react-query'
import { Avatar, Card, CardContent, CardHeader, Divider, Autocomplete, TextField } from '@mui/material'
import { SolutionOutlined } from '@ant-design/icons'
import { DetailGrid } from '@/components/patients/DetailGrid'
import { InlineEditableField } from '@/components/patients/InlineEditableField'
import { useAdmissionFieldUpdate } from '@/hooks/useAdmissionFieldUpdate'
import { getDoctors } from '@/services/patientService'
import type { Admission } from '@/types/admission'
import type { Doctor } from '@/types/patient'

interface AdmissionDetailsTabProps {
  admission: Admission
  editable: boolean
}

function DoctorField({
  doctor,
  editable,
  onSave,
}: {
  doctor: Doctor | null | undefined
  editable: boolean
  onSave: (doctorId: number | null) => Promise<void>
}) {
  const doctorsQuery = useQuery({ queryKey: ['doctors', ''], queryFn: () => getDoctors() })

  if (!editable) {
    return <>{doctor?.name ?? '—'}</>
  }

  return (
    <Autocomplete
      size="small"
      fullWidth
      sx={{ minWidth: 200 }}
      options={doctorsQuery.data ?? []}
      getOptionLabel={(d) => d.name}
      isOptionEqualToValue={(o, v) => o.id === v.id}
      loading={doctorsQuery.isLoading}
      value={doctor ?? null}
      onChange={(_, value) => onSave(value ? value.id : null)}
      renderInput={(params) => <TextField {...params} />}
    />
  )
}

/** Admission-level editable fields (attending/referring doctor, diagnosis) shown alongside the patient tabs in {@link PatientEditDialog}. */
export function AdmissionDetailsTab({ admission, editable }: AdmissionDetailsTabProps) {
  const saveField = useAdmissionFieldUpdate(admission.id)

  return (
    <Card variant="outlined" >
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
            <SolutionOutlined style={{ fontSize: 16 }} />
          </Avatar>
        }
        title="بيانات التنويم"
        slotProps={{ title: { variant: 'subtitle1', sx: { fontWeight: 700 } } }}
      />
      <Divider />
      <CardContent>
        <DetailGrid
          items={[
            // { key: 'admission_number', label: 'رقم التنويم', value: admission.admission_number ?? '—' },
            {
              key: 'admitting_doctor',
              label: 'الطبيب المعالج',
              value: (
                <DoctorField
                  doctor={admission.admitting_doctor}
                  editable={editable}
                  onSave={(id) => saveField('admitting_doctor_id', id)}
                />
              ),
            },
            {
              key: 'referred_by_doctor',
              label: 'الطبيب المرجعي',
              value: (
                <DoctorField
                  doctor={admission.referred_by_doctor}
                  editable={editable}
                  onSave={(id) => saveField('referred_by_doctor_id', id)}
                />
              ),
            },
            {
              key: 'diagnosis',
              label: 'التشخيص',
              value: (
                <InlineEditableField
                  editable={editable}
                  value={admission.diagnosis}
                  onSave={(v) => saveField('diagnosis', v as string | null)}
                />
              ),
            },
            {
              key: 'admission_notes',
              label: 'ملاحظات الدخول',
              value: (
                <InlineEditableField
                  editable={editable}
                  type="textarea"
                  value={admission.admission_notes}
                  onSave={(v) => saveField('admission_notes', v as string | null)}
                />
              ),
            },
          ]}
        />
      </CardContent>
    </Card>
  )
}
