import { useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { pdf } from '@react-pdf/renderer'
import { ConfigProvider, Card, Typography, Row, Col, Space, Button, Modal, Flex, theme as antdThemeApi } from 'antd'
import { PrinterOutlined } from '@ant-design/icons'
import { useAntTheme } from '@/lib/antdTheme'
import { useTheme } from '@/contexts/ThemeContext'
import { PageLoader } from '@/components/common/PageLoader'
import { getPatient } from '@/services/patientService'
import { getAdmissions } from '@/services/admissionService'
import { useAuth } from '@/contexts/AuthContext'
import { useFacilityPdfAssets } from '@/hooks/useFacilityPdfAssets'
import { PatientSummaryPdfDocument } from '@/components/patients/PatientSummaryPdfDocument'
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

  const { assets: pdfAssets } = useFacilityPdfAssets()
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [summaryPreviewUrl, setSummaryPreviewUrl] = useState<string | null>(null)
  const summaryIframeRef = useRef<HTMLIFrameElement>(null)

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

  async function handleOpenSummaryPdf() {
    if (!patient) return
    setIsGeneratingSummary(true)
    try {
      const blob = await pdf(
        <PatientSummaryPdfDocument assets={pdfAssets} patient={patient} admissions={admissionsQuery.data?.data ?? []} />,
      ).toBlob()
      setSummaryPreviewUrl(URL.createObjectURL(blob))
    } catch {
      toast.error('تعذر إنشاء ملف PDF')
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  function handleCloseSummaryPreview() {
    if (summaryPreviewUrl) URL.revokeObjectURL(summaryPreviewUrl)
    setSummaryPreviewUrl(null)
  }

  function handlePrintSummary() {
    summaryIframeRef.current?.contentWindow?.print()
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
        <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              {patient.name}
            </Title>
            <Text type="secondary">
              رقم الملف: {patient.id} · {patient.phone ?? '—'}
            </Text>
          </div>
          <Button size="small" icon={<PrinterOutlined />} loading={isGeneratingSummary} onClick={handleOpenSummaryPdf}>
            طباعة ملف المريض
          </Button>
        </Flex>
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

      <Modal
        open={!!summaryPreviewUrl}
        onCancel={handleCloseSummaryPreview}
        width={860}
        title="معاينة ملف المريض"
        destroyOnHidden
        footer={[
          <Button key="close" onClick={handleCloseSummaryPreview}>
            إغلاق
          </Button>,
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrintSummary}>
            طباعة
          </Button>,
        ]}
      >
        {summaryPreviewUrl && (
          <iframe
            ref={summaryIframeRef}
            src={summaryPreviewUrl}
            title="معاينة ملف المريض"
            style={{ width: '100%', height: 640, border: 'none' }}
          />
        )}
      </Modal>
    </ConfigProvider>
  )
}
