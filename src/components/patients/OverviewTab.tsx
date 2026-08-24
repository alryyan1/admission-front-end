import { Card, Descriptions } from 'antd'
import type { Patient } from '@/types/patient'
import { InlineEditableField } from '@/components/patients/InlineEditableField'
import { usePatientFieldUpdate } from '@/hooks/usePatientFieldUpdate'

interface OverviewTabProps {
  patient: Patient
  editable: boolean
}

const GENDER_LABEL: Record<string, string> = { male: 'ذكر', female: 'أنثى' }
const GENDER_OPTIONS = [
  { label: 'ذكر', value: 'male' },
  { label: 'أنثى', value: 'female' },
]

export function OverviewTab({ patient, editable }: OverviewTabProps) {
  const saveField = usePatientFieldUpdate(patient.id)

  const ageParts = [
    patient.age_year ? `${patient.age_year} سنة` : null,
    patient.age_month ? `${patient.age_month} شهر` : null,
    patient.age_day ? `${patient.age_day} يوم` : null,
  ].filter(Boolean)

  return (
    <Card size="small" title="البيانات الأساسية">
      <Descriptions
        column={2}
        size="small"
        items={[
          { key: 'id', label: 'رقم الملف', children: patient.id },
          {
            key: 'name',
            label: 'الاسم',
            children: (
              <InlineEditableField
                editable={editable}
                value={patient.name}
                onSave={(v) => saveField('name', String(v ?? ''))}
              />
            ),
          },
          {
            key: 'gender',
            label: 'الجنس',
            children: (
              <InlineEditableField
                editable={editable}
                type="select"
                options={GENDER_OPTIONS}
                value={patient.gender}
                displayValue={patient.gender ? GENDER_LABEL[patient.gender] ?? patient.gender : '—'}
                onSave={(v) => saveField('gender', v as string | null)}
              />
            ),
          },
          {
            key: 'age',
            label: 'العمر (سنوات)',
            children: (
              <InlineEditableField
                editable={editable}
                type="number"
                value={patient.age_year}
                displayValue={ageParts.length ? ageParts.join(' — ') : '—'}
                onSave={(v) => saveField('age_year', v as number | null)}
              />
            ),
          },
          {
            key: 'phone',
            label: 'الهاتف',
            children: (
              <InlineEditableField
                editable={editable}
                value={patient.phone}
                onSave={(v) => saveField('phone', v as string | null)}
              />
            ),
          },
          {
            key: 'address',
            label: 'العنوان',
            children: (
              <InlineEditableField
                editable={editable}
                value={patient.address}
                onSave={(v) => saveField('address', v as string | null)}
              />
            ),
          },
          {
            key: 'source',
            label: 'مصدر الملف',
            children: patient.is_local_only ? 'محلي' : 'مستورد من جودة الطبية',
          },
        ]}
      />
    </Card>
  )
}
