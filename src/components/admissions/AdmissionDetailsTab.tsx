import { Avatar, Card, CardContent, CardHeader, Divider } from '@mui/material'
import { SolutionOutlined } from '@ant-design/icons'
import { DetailGrid } from '@/components/patients/DetailGrid'
import { InlineEditableField } from '@/components/patients/InlineEditableField'
import { useAdmissionFieldUpdate } from '@/hooks/useAdmissionFieldUpdate'
import type { Admission } from '@/types/admission'

interface AdmissionDetailsTabProps {
  admission: Admission
  editable: boolean
}

/** Admission-level editable fields (diagnosis, admission notes) shown alongside the patient tabs in {@link PatientEditDialog}. */
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
