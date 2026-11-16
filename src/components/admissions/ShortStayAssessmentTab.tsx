import { useEffect, useState } from 'react'
import { Card, Input, InputNumber, Button, Typography, Flex, Space } from 'antd'
import { FileDown } from 'lucide-react'
import { usePdfPreview } from '@/hooks/usePdfPreview'
import { PdfPreviewModal } from '@/components/common/PdfPreviewModal'
import { admissionPdfPaths } from '@/services/admissionService'
import type { ShortStayAssessment } from '@/types/admission'

const { Text } = Typography
const { TextArea } = Input

interface ShortStayAssessmentTabProps {
  admissionId: number
  assessment: ShortStayAssessment | null
  onSave: (payload: Partial<ShortStayAssessment>) => void
  isSubmitting: boolean
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Space direction="vertical" size={4} style={{ width: '100%' }}>
      <Text style={{ fontSize: 12 }} type="secondary">
        {label}
      </Text>
      {children}
    </Space>
  )
}

export function ShortStayAssessmentTab({ admissionId, assessment, onSave, isSubmitting }: ShortStayAssessmentTabProps) {
  const pdf = usePdfPreview()

  const [bloodPressure, setBloodPressure] = useState('')
  const [oxygenSaturation, setOxygenSaturation] = useState<number | null>(null)
  const [pulse, setPulse] = useState<number | null>(null)
  const [respirationRate, setRespirationRate] = useState<number | null>(null)
  const [pmh, setPmh] = useState('')
  const [chiefComplaint, setChiefComplaint] = useState('')
  const [plan, setPlan] = useState('')

  useEffect(() => {
    setBloodPressure(assessment?.blood_pressure ?? '')
    setOxygenSaturation(assessment?.oxygen_saturation ?? null)
    setPulse(assessment?.pulse ?? null)
    setRespirationRate(assessment?.respiration_rate ?? null)
    setPmh(assessment?.pmh ?? '')
    setChiefComplaint(assessment?.chief_complaint ?? '')
    setPlan(assessment?.plan ?? '')
  }, [assessment])

  function handleSave() {
    onSave({
      blood_pressure: bloodPressure || undefined,
      oxygen_saturation: oxygenSaturation ?? undefined,
      pulse: pulse ?? undefined,
      respiration_rate: respirationRate ?? undefined,
      pmh: pmh || undefined,
      chief_complaint: chiefComplaint || undefined,
      plan: plan || undefined,
    })
  }

  return (
    <>
      <Card
        title="ملف الإقامة القصيرة"
        style={{ maxWidth: 768 }}
        extra={
          <Button
            icon={<FileDown className="h-4 w-4" />}
            loading={pdf.isLoading()}
            onClick={() => pdf.open(admissionPdfPaths.shortStayChart(admissionId), 'معاينة ملف الإقامة القصيرة')}
          >
            تصدير PDF
          </Button>
        }
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Flex wrap="wrap" gap={12}>
            <FieldLabel label="ضغط الدم">
              <Input style={{ width: 112 }} placeholder="120/80" value={bloodPressure} onChange={(e) => setBloodPressure(e.target.value)} />
            </FieldLabel>
            <FieldLabel label="تشبع الأكسجين %">
              <InputNumber style={{ width: 112 }} value={oxygenSaturation} onChange={(v) => setOxygenSaturation(v)} />
            </FieldLabel>
            <FieldLabel label="النبض">
              <InputNumber style={{ width: 96 }} value={pulse} onChange={(v) => setPulse(v)} />
            </FieldLabel>
            <FieldLabel label="معدل التنفس">
              <InputNumber style={{ width: 96 }} value={respirationRate} onChange={(v) => setRespirationRate(v)} />
            </FieldLabel>
          </Flex>

          <FieldLabel label="التاريخ المرضي (PMH)">
            <TextArea rows={3} value={pmh} onChange={(e) => setPmh(e.target.value)} />
          </FieldLabel>

          <FieldLabel label="الشكوى الرئيسية (C/O)">
            <TextArea rows={3} value={chiefComplaint} onChange={(e) => setChiefComplaint(e.target.value)} />
          </FieldLabel>

          <FieldLabel label="الخطة العلاجية (Plan)">
            <TextArea rows={3} value={plan} onChange={(e) => setPlan(e.target.value)} />
          </FieldLabel>

          <Flex justify="end">
            <Button type="primary" onClick={handleSave} loading={isSubmitting}>
              حفظ
            </Button>
          </Flex>
        </Space>
      </Card>

      <PdfPreviewModal url={pdf.url} title={pdf.title} onClose={pdf.close} />
    </>
  )
}
