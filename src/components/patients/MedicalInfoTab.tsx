import { Card, Descriptions, Row, Col } from 'antd'
import type { BloodType, Patient } from '@/types/patient'
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
    <Row gutter={[16, 16]}>
      <Col xs={24} md={12}>
        <Card title="فصيلة الدم">
          <Descriptions
            column={1}
            size="small"
            items={[
              {
                key: 'blood_type',
                label: 'فصيلة الدم',
                children: (
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
        </Card>
      </Col>

      <Col xs={24} md={12}>
        <Card title="الحساسية والأمراض">
          <Descriptions
            column={1}
            size="small"
            items={[
              {
                key: 'allergies',
                label: 'الحساسية للأدوية أو الأطعمة',
                children: (
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
                children: (
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
        </Card>
      </Col>

      <Col xs={24} md={12}>
        <Card title="الأدوية والعمليات السابقة">
          <Descriptions
            column={1}
            size="small"
            items={[
              {
                key: 'medications',
                label: 'الأدوية المستخدمة حالياً',
                children: (
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
                children: (
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
        </Card>
      </Col>

      <Col xs={24} md={12}>
        <Card title="التاريخ المرضي والملاحظات">
          <Descriptions
            column={1}
            size="small"
            items={[
              {
                key: 'history',
                label: 'التاريخ المرضي',
                children: (
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
                children: (
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
        </Card>
      </Col>
    </Row>
  )
}
