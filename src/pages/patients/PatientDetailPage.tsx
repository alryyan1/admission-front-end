import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ConfigProvider, Card, Typography, Row, Col, Space } from 'antd'
import { useAntTheme } from '@/lib/antdTheme'
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

  return (
    <ConfigProvider direction="rtl" theme={antTheme}>
      <Card style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          {patient.name}
        </Title>
        <Text type="secondary">
          رقم الملف: {patient.id} · {patient.phone ?? '—'}
        </Text>
      </Card>

      <Space direction="vertical" size={24} style={{ width: '100%' }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Title level={4} style={{ margin: 0 }}>
                نظرة عامة
              </Title>
              <OverviewTab patient={patient} editable={canEdit} />
            </Space>
          </Col>

          <Col xs={24} md={12}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Title level={4} style={{ margin: 0 }}>
                جهة الاتصال في الطوارئ
              </Title>
              <EmergencyContactTab patient={patient} editable={canEdit} />
            </Space>
          </Col>
        </Row>

        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Title level={4} style={{ margin: 0 }}>
            البيانات الطبية
          </Title>
          <MedicalInfoTab patient={patient} editable={canEdit} />
        </Space>

        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Title level={4} style={{ margin: 0 }}>
            سجل التنويمات
          </Title>
          <AdmissionHistoryTab admissions={admissionsQuery.data?.data} isLoading={admissionsQuery.isLoading} />
        </Space>
      </Space>
    </ConfigProvider>
  )
}
