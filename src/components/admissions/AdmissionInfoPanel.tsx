import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, Button, Tag, Flex, Typography, Descriptions, Divider, Input, Statistic, Tooltip, theme as antdThemeApi } from 'antd'
import {
  CloseOutlined,
  EditOutlined,
  LogoutOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  FileDoneOutlined,
  AccountBookOutlined,
  ProfileOutlined,
} from '@ant-design/icons'
import { formatNumber } from '@/lib/utils'
import { usePdfPreview } from '@/hooks/usePdfPreview'
import { PdfPreviewModal } from '@/components/common/PdfPreviewModal'
import { PatientLocationButton } from '@/components/admissions/PatientLocationButton'
import { PatientEditDialog } from '@/components/patients/PatientEditDialog'
import { admissionPdfPaths, cancelAdmission, dischargeAdmission, getInvoice } from '@/services/admissionService'
import type { Admission, AdmissionStatus } from '@/types/admission'
import dayjs from 'dayjs'

const { Text } = Typography

const STATUS_LABEL: Record<AdmissionStatus, string> = {
  admitted: 'نشطة',
  discharged: 'مخرّجة',
  cancelled: 'ملغاة',
}

const STATUS_COLOR: Record<AdmissionStatus, string> = {
  admitted: 'green',
  discharged: 'blue',
  cancelled: 'red',
}

type Mode = 'menu' | 'discharge' | 'cancel'

interface AdmissionInfoPanelProps {
  admission: Admission
  onClear: () => void
}

/** Left-column read-only summary and discharge/cancel actions for the active admission on {@link AdmissionsPage}. */
export function AdmissionInfoPanel({ admission, onClear }: AdmissionInfoPanelProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { token } = antdThemeApi.useToken()
  const summaryPdf = usePdfPreview()

  const [mode, setMode] = useState<Mode>('menu')
  const [dischargeSummary, setDischargeSummary] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [editPatientOpen, setEditPatientOpen] = useState(false)

  useEffect(() => {
    setMode('menu')
    setDischargeSummary('')
    setCancelReason('')
  }, [admission.id])

  const invoiceQuery = useQuery({
    queryKey: ['admissions', admission.id, 'invoice'],
    queryFn: () => getInvoice(admission.id),
  })

  const dueBalance = invoiceQuery.data?.balance_due ?? 0

  function invalidateAfterChange() {
    queryClient.invalidateQueries({ queryKey: ['admissions'] })
    queryClient.invalidateQueries({ queryKey: ['admissions', admission.id] })
    queryClient.invalidateQueries({ queryKey: ['admissions', admission.id, 'invoice'] })
    queryClient.invalidateQueries({ queryKey: ['floors'] })
  }

  const dischargeMutation = useMutation({
    mutationFn: (summary: string) => dischargeAdmission(admission.id, { discharge_summary: summary }),
    onSuccess: () => {
      toast.success('تم إخراج المريض')
      invalidateAfterChange()
      onClear()
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => cancelAdmission(admission.id, { cancellation_reason: reason }),
    onSuccess: () => {
      toast.success('تم إلغاء التنويم')
      invalidateAfterChange()
      onClear()
    },
  })

  function handleDischarge() {
    if (dueBalance > 0) {
      toast.error(`لا يمكن إخراج المريض، يوجد مبلغ مستحق قدره ${formatNumber(dueBalance)}`)
      return
    }
    dischargeMutation.mutate(dischargeSummary)
  }

  return (
    <>
      <Card style={{ position: 'sticky', top: 16 }} className="animate-in fade-in slide-in-from-left-4 duration-300">
        <Flex justify="space-between" align="start" style={{ marginBottom: 12 }}>
          <Flex vertical gap={4} style={{ flex: 1, minWidth: 0 }}>
            <Text strong style={{ fontSize: 18 }}>
              {admission.patient?.name}
            </Text>
            <Flex align="center" gap={8}>
              <Tag color={STATUS_COLOR[admission.status]}>{STATUS_LABEL[admission.status]}</Tag>
              <Button
                size="small"
                type="text"
                icon={<EditOutlined />}
                onClick={() => setEditPatientOpen(true)}
                title="تعديل بيانات المريض"
              />
            </Flex>
            <Text type="secondary">
               رقم الملف: {admission.id ?? '—'} — دخول {dayjs(admission.admission_date).format('YYYY-MM-DD')}
            </Text>
          </Flex>
          <Button type="text" icon={<CloseOutlined />} onClick={onClear} />
        </Flex>

        <Descriptions size="small" column={1} bordered={false}>
          <Descriptions.Item label="معرف التنويم">{admission.id}</Descriptions.Item>
          <Descriptions.Item label="الغرفة">
            <PatientLocationButton bed={admission.bed} variant="compact" />
          </Descriptions.Item>
          <Descriptions.Item label="الطبيب المعالج">{admission.admitting_doctor?.name ?? '—'}</Descriptions.Item>
          {admission.referred_by_doctor && (
            <Descriptions.Item label="محول من">{admission.referred_by_doctor.name}</Descriptions.Item>
          )}
          <Descriptions.Item label="مدة الإقامة">
            {(() => {
              const end = admission.discharge_date ? dayjs(admission.discharge_date) : dayjs()
              const hoursElapsed = Math.max(0, end.diff(dayjs(admission.admission_date), 'hour'))
              return `${Math.floor(hoursElapsed / 24)} يوم و ${hoursElapsed % 24} ساعة`
            })()}
          </Descriptions.Item>
          {admission.diagnosis && <Descriptions.Item label="التشخيص">{admission.diagnosis}</Descriptions.Item>}
        </Descriptions>

        {(admission.patient?.phone || admission.patient?.age_year != null || admission.patient?.gender || admission.patient?.blood_type) && (
          <>
            <Divider style={{ margin: '8px 0' }} titlePlacement="right" plain>
              <Text type="secondary" style={{ fontSize: 12 }}>
                بيانات المريض
              </Text>
            </Divider>
            <Descriptions size="small" column={1} bordered={false}>
              {admission.patient?.phone && (
                <Descriptions.Item label="هاتف المريض">{admission.patient.phone}</Descriptions.Item>
              )}
              {(admission.patient?.age_year != null || admission.patient?.gender) && (
                <Descriptions.Item label="العمر / النوع">
                  {[
                    admission.patient?.age_year != null ? `${admission.patient.age_year} سنة` : null,
                    admission.patient?.gender,
                  ]
                    .filter(Boolean)
                    .join(' — ') || '—'}
                </Descriptions.Item>
              )}
              {admission.patient?.blood_type && (
                <Descriptions.Item label="فصيلة الدم">
                  <Tag color="red">{admission.patient.blood_type}</Tag>
                </Descriptions.Item>
              )}
            </Descriptions>
          </>
        )}

        <Flex gap={8} style={{ margin: '12px 0' }}>
          <Card size="small" style={{ flex: 1, textAlign: 'center' }} styles={{ body: { padding: 8 } }}>
            <Statistic
              title="الإجمالي"
              loading={invoiceQuery.isLoading}
              value={invoiceQuery.data?.total ?? 0}
              precision={0}
              valueStyle={{ fontSize: 16, color: token.colorText }}
            />
          </Card>
          <Card size="small" style={{ flex: 1, textAlign: 'center' }} styles={{ body: { padding: 8 } }}>
            <Statistic
              title="المدفوع"
              loading={invoiceQuery.isLoading}
              value={invoiceQuery.data?.deposits_total ?? 0}
              precision={0}
              valueStyle={{ fontSize: 16, color: token.colorSuccess }}
            />
          </Card>
          <Card size="small" style={{ flex: 1, textAlign: 'center' }} styles={{ body: { padding: 8 } }}>
            <Statistic
              title="الرصيد "
              loading={invoiceQuery.isLoading}
              value={dueBalance}
              precision={0}
              valueStyle={{ fontSize: 16, color: dueBalance > 0 ? token.colorError : token.colorSuccess }}
            />
          </Card>
        </Flex>

        {admission.status === 'admitted' && (
          <>
            <Divider style={{ margin: '12px 0' }} />

            {mode === 'menu' && (
              <Flex gap={8}>
                <Button danger icon={<LogoutOutlined />} onClick={() => setMode('discharge')} block>
                  إخراج المريض
                </Button>
                <Button icon={<CloseCircleOutlined />} onClick={() => setMode('cancel')} block>
                  إلغاء التنويم
                </Button>
              </Flex>
            )}

            {mode === 'discharge' && (
              <Flex vertical gap={8}>
                <Text type="secondary">سيتم إنهاء التنويم وإخلاء السرير.</Text>
                <Input.TextArea
                  rows={3}
                  placeholder="ملخص الخروج (اختياري)"
                  value={dischargeSummary}
                  onChange={(e) => setDischargeSummary(e.target.value)}
                />
                <Flex gap={8}>
                  <Button onClick={() => setMode('menu')}>رجوع</Button>
                  <Button danger type="primary" loading={dischargeMutation.isPending} onClick={handleDischarge}>
                    تأكيد الإخراج
                  </Button>
                </Flex>
              </Flex>
            )}

            {mode === 'cancel' && (
              <Flex vertical gap={8}>
                <Text type="secondary">هل أنت متأكد من إلغاء هذا التنويم؟ لا يمكن التراجع عن هذا الإجراء.</Text>
                <Input.TextArea
                  rows={3}
                  placeholder="سبب الإلغاء (اختياري)"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
                <Flex gap={8}>
                  <Button onClick={() => setMode('menu')}>رجوع</Button>
                  <Button
                    danger
                    type="primary"
                    loading={cancelMutation.isPending}
                    onClick={() => cancelMutation.mutate(cancelReason)}
                  >
                    تأكيد الإلغاء
                  </Button>
                </Flex>
              </Flex>
            )}
          </>
        )}

        <Divider style={{ margin: '12px 0' }} />

        <Flex gap={8} wrap="wrap">
          <Tooltip title="عرض التفاصيل الكاملة">
            <Button
              type="primary"
              icon={<FileTextOutlined />}
              onClick={() => navigate(`/admissions/${admission.id}`)}
            />
          </Tooltip>
          <Tooltip title="طباعة الفاتورة المبدئية">
            <Button
              icon={<FileDoneOutlined />}
              loading={summaryPdf.isLoading('preliminary')}
              onClick={() =>
                summaryPdf.open(admissionPdfPaths.preliminaryInvoice(admission.id), 'معاينة الفاتورة المبدئية', 'preliminary')
              }
            />
          </Tooltip>
          <Tooltip title="طباعة كشف الحساب">
            <Button
              icon={<AccountBookOutlined />}
              loading={summaryPdf.isLoading('statement')}
              onClick={() =>
                summaryPdf.open(admissionPdfPaths.accountStatement(admission.id), 'معاينة كشف الحساب', 'statement')
              }
            />
          </Tooltip>
          <Tooltip title="طباعة ملخص التنويم">
            <Button
              icon={<ProfileOutlined />}
              loading={summaryPdf.isLoading('summary')}
              onClick={() =>
                summaryPdf.open(admissionPdfPaths.admissionSummary(admission.id), 'معاينة ملخص التنويم', 'summary')
              }
            />
          </Tooltip>
        </Flex>
      </Card>

      <PatientEditDialog
        patientId={editPatientOpen ? admission.patient_id : null}
        onClose={() => setEditPatientOpen(false)}
        admission={admission}
      />
      <PdfPreviewModal url={summaryPdf.url} title={summaryPdf.title} onClose={summaryPdf.close} />
    </>
  )
}
