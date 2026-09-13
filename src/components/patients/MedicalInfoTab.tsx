import { Avatar, Box, Card, CardContent, CardHeader, Divider } from '@mui/material'
import { AlertOutlined, FileTextOutlined, HeartOutlined, ScissorOutlined } from '@ant-design/icons'
import type { BloodType, Patient } from '@/types/patient'
import { DetailGrid } from '@/components/patients/DetailGrid'
import { InlineEditableField } from '@/components/patients/InlineEditableField'
import { usePatientFieldUpdate } from '@/hooks/usePatientFieldUpdate'

interface MedicalInfoTabProps {
  patient: Patient
  editable: boolean
}

const BLOOD_TYPE_OPTIONS: { label: string; value: BloodType }[] = [
  { label: 'A+', value: 'A+' },
  { label: 'A-', value: 'A-' },
  { label: 'B+', value: 'B+' },
  { label: 'B-', value: 'B-' },
  { label: 'AB+', value: 'AB+' },
  { label: 'AB-', value: 'AB-' },
  { label: 'O+', value: 'O+' },
  { label: 'O-', value: 'O-' },
]

export function MedicalInfoTab({ patient, editable }: MedicalInfoTabProps) {
  const saveField = usePatientFieldUpdate(patient.id)

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 }}>
      <Card variant="outlined">
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
              <HeartOutlined style={{ fontSize: 16 }} />
            </Avatar>
          }
          title="فصيلة الدم"
          slotProps={{ title: { variant: 'subtitle1', sx: { fontWeight: 700 } } }}
        />
        <Divider />
        <CardContent>
          <DetailGrid
            columns={1}
            items={[
              {
                key: 'blood_type',
                label: 'فصيلة الدم',
                value: (
                  <InlineEditableField
                    editable={editable}
                    type="select"
                    options={BLOOD_TYPE_OPTIONS}
                    value={patient.blood_type}
                    onSave={(v) => saveField('blood_type', v as BloodType | null)}
                  />
                ),
              },
            ]}
          />
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
              <AlertOutlined style={{ fontSize: 16 }} />
            </Avatar>
          }
          title="الحساسية والأمراض"
          slotProps={{ title: { variant: 'subtitle1', sx: { fontWeight: 700 } } }}
        />
        <Divider />
        <CardContent>
          <DetailGrid
            columns={1}
            items={[
              {
                key: 'allergies',
                label: 'الحساسية للأدوية أو الأطعمة',
                value: (
                  <InlineEditableField
                    editable={editable}
                    type="textarea"
                    value={patient.allergies}
                    onSave={(v) => saveField('allergies', v as string | null)}
                  />
                ),
              },
              {
                key: 'chronic',
                label: 'الأمراض المزمنة',
                value: (
                  <InlineEditableField
                    editable={editable}
                    type="textarea"
                    value={patient.chronic_diseases}
                    onSave={(v) => saveField('chronic_diseases', v as string | null)}
                  />
                ),
              },
            ]}
          />
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
              <ScissorOutlined style={{ fontSize: 16 }} />
            </Avatar>
          }
          title="الأدوية والعمليات السابقة"
          slotProps={{ title: { variant: 'subtitle1', sx: { fontWeight: 700 } } }}
        />
        <Divider />
        <CardContent>
          <DetailGrid
            columns={1}
            items={[
              {
                key: 'medications',
                label: 'الأدوية المستخدمة حالياً',
                value: (
                  <InlineEditableField
                    editable={editable}
                    type="textarea"
                    value={patient.current_medications}
                    onSave={(v) => saveField('current_medications', v as string | null)}
                  />
                ),
              },
              {
                key: 'surgeries',
                label: 'العمليات السابقة',
                value: (
                  <InlineEditableField
                    editable={editable}
                    type="textarea"
                    value={patient.past_surgeries}
                    onSave={(v) => saveField('past_surgeries', v as string | null)}
                  />
                ),
              },
            ]}
          />
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
              <FileTextOutlined style={{ fontSize: 16 }} />
            </Avatar>
          }
          title="التاريخ المرضي والملاحظات"
          slotProps={{ title: { variant: 'subtitle1', sx: { fontWeight: 700 } } }}
        />
        <Divider />
        <CardContent>
          <DetailGrid
            columns={1}
            items={[
              {
                key: 'history',
                label: 'التاريخ المرضي',
                value: (
                  <InlineEditableField
                    editable={editable}
                    type="textarea"
                    value={patient.medical_history}
                    onSave={(v) => saveField('medical_history', v as string | null)}
                  />
                ),
              },
              {
                key: 'notes',
                label: 'ملاحظات طبية مهمة',
                value: (
                  <InlineEditableField
                    editable={editable}
                    type="textarea"
                    value={patient.medical_notes}
                    onSave={(v) => saveField('medical_notes', v as string | null)}
                  />
                ),
              },
            ]}
          />
        </CardContent>
      </Card>
    </Box>
  )
}
