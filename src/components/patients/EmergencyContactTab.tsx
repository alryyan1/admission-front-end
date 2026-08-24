import { Card, Descriptions } from 'antd'
import type { Patient } from '@/types/patient'
import { InlineEditableField } from '@/components/patients/InlineEditableField'
import { usePatientFieldUpdate } from '@/hooks/usePatientFieldUpdate'

interface EmergencyContactTabProps {
  patient: Patient
  editable: boolean
}

export function EmergencyContactTab({ patient, editable }: EmergencyContactTabProps) {
  const saveField = usePatientFieldUpdate(patient.id)

  return (
    <Card size="small" title="جهة الاتصال في حالة الطوارئ">
      <Descriptions
        column={2}
        size="small"
        items={[
          {
            key: 'name',
            label: 'اسم الشخص المسؤول',
            children: (
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
            children: (
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
            children: (
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
            children: (
              <InlineEditableField
                editable={editable}
                value={patient.emergency_contact_address}
                onSave={(v) => saveField('emergency_contact_address', v as string | null)}
              />
            ),
          },
        ]}
      />
    </Card>
  )
}
