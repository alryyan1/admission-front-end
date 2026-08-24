import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ConfigProvider, Card, Typography, Row, Col, Space, theme as antdThemeApi } from 'antd'
import { useAntTheme } from '@/lib/antdTheme'
import { useTheme } from '@/contexts/ThemeContext'
import { PageLoader } from '@/components/common/PageLoader'
import { getPatient } from '@/services/patientService'
import { getAdmissions } from '@/services/admissionService'
import { useAuth } from '@/contexts/AuthContext'
import { OverviewTab } from '@/components/patients/OverviewTab'
import { EmergencyContactTab } from '@/components/patients/EmergencyContactTab'
import { MedicalInfoTab } from '@/components/patients/MedicalInfoTab'
import { AdmissionHistoryTab } from '@/components/patients/AdmissionHistoryTab'

const { Title, Text } = Typography

export function PatientDetailPage() {
  const antTheme = useAntTheme()
  const { token } = antdThemeApi.useToken()
  const { admissionHeaderBg } = useTheme()
  const { patientId } = useParams<{ patientId: string }>()
  const id = Number(patientId)
  const { user } = useAuth()
  const canEdit = user?.role === 'admin' || user?.role === 'admission_clerk'

  const patientQuery = useQuery({
    queryKey: ['patient', id],
    queryFn: () => getPatient(id),
    enabled: !!id,
  })

  const admissionsQuery = useQuery({
    queryKey: ['patient', id, 'admissions'],
    queryFn: () => getAdmissions({ patient_id: id }),
    enabled: !!id,
  })

  const patient = patientQuery.data

  if (!patient) {
    return <PageLoader />
  }

  const headerBgColor = (() => {
    switch (admissionHeaderBg) {
      case 'fillAlter':
      case 'statusReactive':
        return token.colorFillAlter
      case 'primaryBg':
        return token.colorPrimaryBg
      case 'infoBg':
        return token.colorInfoBg
      default:
        return undefined
    }
  })()

  return (
    <ConfigProvider direction="rtl" theme={antTheme}>
      <Card size="small" style={{ marginBottom: 12, backgroundColor: headerBgColor }}>
        <Title level={4} style={{ margin: 0 }}>
          {patient.name}
        </Title>
        <Text type="secondary">
          رقم الملف: {patient.id} · {patient.phone ?? '—'}
        </Text>
      </Card>

      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} md={12}>
            <OverviewTab patient={patient} editable={canEdit} />
          </Col>

          <Col xs={24} md={12}>
            <EmergencyContactTab patient={patient} editable={canEdit} />
          </Col>
        </Row>

        <MedicalInfoTab patient={patient} editable={canEdit} />

        <AdmissionHistoryTab admissions={admissionsQuery.data?.data} isLoading={admissionsQuery.isLoading} />
      </Space>
    </ConfigProvider>
  )
}
