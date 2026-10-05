import { useQuery } from '@tanstack/react-query'
import { Avatar, Card, CardContent, CardHeader, Divider } from '@mui/material'
import { UserOutlined } from '@ant-design/icons'
import type { Patient } from '@/types/patient'
import { DetailGrid } from '@/components/patients/DetailGrid'
import { InlineEditableField } from '@/components/patients/InlineEditableField'
import { usePatientFieldUpdate } from '@/hooks/usePatientFieldUpdate'
import { getInsuranceCompanies } from '@/services/insuranceCompanyService'

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
  const insuranceCompaniesQuery = useQuery({ queryKey: ['insurance-companies'], queryFn: getInsuranceCompanies })
  const insuranceOptions = [
    { label: 'بدون تأمين', value: '' },
    ...(insuranceCompaniesQuery.data ?? []).map((company) => ({ label: company.name, value: String(company.id) })),
  ]

  const ageParts = [
    patient.age_year ? `${patient.age_year} سنة` : null,
    patient.age_month ? `${patient.age_month} شهر` : null,
    patient.age_day ? `${patient.age_day} يوم` : null,
  ].filter(Boolean)

  return (
    <Card variant="outlined">
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
            <UserOutlined style={{ fontSize: 16 }} />
          </Avatar>
        }
        title="البيانات الأساسية"
        slotProps={{ title: { variant: 'subtitle1', sx: { fontWeight: 700 } } }}
      />
      <Divider />
      <CardContent>
        <DetailGrid
          items={[
            { key: 'id', label: 'رقم الملف', value: patient.id },
            {
              key: 'name',
              label: 'الاسم',
              value: (
                <InlineEditableField
                  editable={editable}
                  value={patient.name}
                  onSave={(v) => saveField('name', String(v ?? ''))}
                />
              ),
            },
            {
              key: 'gender',
              label: 'النوع',
              value: (
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
              value: (
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
              value: (
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
              value: (
                <InlineEditableField
                  editable={editable}
                  value={patient.address}
                  onSave={(v) => saveField('address', v as string | null)}
                />
              ),
            },
            {
              key: 'insurance',
              label: 'شركة التأمين',
              value: (
                <InlineEditableField
                  editable={editable}
                  type="select"
                  options={insuranceOptions}
                  value={patient.insurance_company_id ? String(patient.insurance_company_id) : null}
                  displayValue={patient.insurance_company?.name ?? 'بدون تأمين'}
                  onSave={(v) => saveField('insurance_company_id', v ? Number(v) : null)}
                />
              ),
            },
            ...(patient.insurance_company_id
              ? [
                  {
                    key: 'insurance_card_number',
                    label: 'رقم البطاقة',
                    value: (
                      <InlineEditableField
                        editable={editable}
                        value={patient.insurance_card_number}
                        onSave={(v) => saveField('insurance_card_number', v as string | null)}
                      />
                    ),
                  },
                ]
              : []),
            {
              key: 'source',
              label: 'مصدر الملف',
              value: patient.is_local_only ? 'محلي' : 'مستورد من جودة الطبية',
            },
          ]}
        />
      </CardContent>
    </Card>
  )
}
