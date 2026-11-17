import { useQuery } from '@tanstack/react-query'
import { Avatar, Card, CardContent, CardHeader, Divider } from '@mui/material'
import { SafetyCertificateOutlined } from '@ant-design/icons'
import type { Patient } from '@/types/patient'
import { DetailGrid } from '@/components/patients/DetailGrid'
import { InlineEditableField } from '@/components/patients/InlineEditableField'
import { usePatientFieldUpdate } from '@/hooks/usePatientFieldUpdate'
import { getInsuranceCompanies } from '@/services/insuranceCompanyService'
import { getCompanies } from '@/services/companyService'
import { getGuardianRelationships } from '@/services/guardianRelationshipService'

interface InsuranceInfoTabProps {
  patient: Patient
  editable: boolean
}

export function InsuranceInfoTab({ patient, editable }: InsuranceInfoTabProps) {
  const saveField = usePatientFieldUpdate(patient.id)

  const insuranceCompaniesQuery = useQuery({
    queryKey: ['insurance-companies'],
    queryFn: getInsuranceCompanies,
    staleTime: Infinity,
  })
  const companiesQuery = useQuery({ queryKey: ['companies'], queryFn: getCompanies, staleTime: Infinity })
  const guardianRelationshipsQuery = useQuery({
    queryKey: ['guardian-relationships'],
    queryFn: getGuardianRelationships,
    staleTime: Infinity,
  })

  const insuranceOptions = [
    { label: 'بدون تأمين', value: '' },
    ...(insuranceCompaniesQuery.data ?? []).map((company) => ({ label: company.name, value: String(company.id) })),
  ]
  const companyOptions = [
    { label: 'بدون', value: '' },
    ...(companiesQuery.data ?? []).map((company) => ({ label: company.name, value: String(company.id) })),
  ]
  const guardianRelationshipOptions = [
    { label: 'بدون', value: '' },
    ...(guardianRelationshipsQuery.data ?? []).map((relationship) => ({
      label: relationship.name,
      value: String(relationship.id),
    })),
  ]

  return (
    <Card variant="outlined">
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
            <SafetyCertificateOutlined style={{ fontSize: 16 }} />
          </Avatar>
        }
        title="بيانات التأمين"
        slotProps={{ title: { variant: 'subtitle1', sx: { fontWeight: 700 } } }}
      />
      <Divider />
      <CardContent>
        <DetailGrid
          items={[
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
              key: 'company',
              label: 'الشركة الفرعية',
              value: (
                <InlineEditableField
                  editable={editable}
                  type="select"
                  options={companyOptions}
                  value={patient.company_id ? String(patient.company_id) : null}
                  displayValue={patient.company?.name ?? 'بدون'}
                  onSave={(v) => saveField('company_id', v ? Number(v) : null)}
                />
              ),
            },
            {
              key: 'guardian_relationship',
              label: 'صلة القرابة بالعائل',
              value: (
                <InlineEditableField
                  editable={editable}
                  type="select"
                  options={guardianRelationshipOptions}
                  value={patient.guardian_relationship_id ? String(patient.guardian_relationship_id) : null}
                  displayValue={patient.guardian_relationship?.name ?? 'بدون'}
                  onSave={(v) => saveField('guardian_relationship_id', v ? Number(v) : null)}
                />
              ),
            },
          ]}
        />
      </CardContent>
    </Card>
  )
}
