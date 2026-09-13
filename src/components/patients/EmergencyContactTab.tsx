import { Avatar, Card, CardContent, CardHeader, Divider } from '@mui/material'
import { ContactsOutlined } from '@ant-design/icons'
import type { Patient } from '@/types/patient'
import { DetailGrid } from '@/components/patients/DetailGrid'
import { InlineEditableField } from '@/components/patients/InlineEditableField'
import { usePatientFieldUpdate } from '@/hooks/usePatientFieldUpdate'

interface EmergencyContactTabProps {
  patient: Patient
  editable: boolean
}

export function EmergencyContactTab({ patient, editable }: EmergencyContactTabProps) {
  const saveField = usePatientFieldUpdate(patient.id)

  return (
    <Card variant="outlined">
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
            <ContactsOutlined style={{ fontSize: 16 }} />
          </Avatar>
        }
        title="جهة الاتصال في حالة الطوارئ"
        slotProps={{ title: { variant: 'subtitle1', sx: { fontWeight: 700 } } }}
      />
      <Divider />
      <CardContent>
        <DetailGrid
          items={[
            {
              key: 'name',
              label: 'اسم الشخص المسؤول',
              value: (
                <InlineEditableField
                  editable={editable}
                  value={patient.emergency_contact_name}
                  onSave={(v) => saveField('emergency_contact_name', v as string | null)}
                />
              ),
            },
            {
              key: 'relationship',
              label: 'صلة القرابة',
              value: (
                <InlineEditableField
                  editable={editable}
                  value={patient.emergency_contact_relationship}
                  onSave={(v) => saveField('emergency_contact_relationship', v as string | null)}
                />
              ),
            },
            {
              key: 'phone',
              label: 'رقم الهاتف',
              value: (
                <InlineEditableField
                  editable={editable}
                  value={patient.emergency_contact_phone}
                  onSave={(v) => saveField('emergency_contact_phone', v as string | null)}
                />
              ),
            },
            {
              key: 'address',
              label: 'العنوان',
              value: (
                <InlineEditableField
                  editable={editable}
                  value={patient.emergency_contact_address}
                  onSave={(v) => saveField('emergency_contact_address', v as string | null)}
                />
              ),
            },
          ]}
        />
      </CardContent>
    </Card>
  )
}
