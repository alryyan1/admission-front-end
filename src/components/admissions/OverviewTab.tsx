import { Card, Descriptions, Row, Col, Tag, Typography } from 'antd'
import { formatDateTime } from '@/lib/utils'
import type { Admission } from '@/types/admission'

const { Text } = Typography

interface OverviewTabProps {
  admission: Admission
}

export function OverviewTab({ admission }: OverviewTabProps) {
  const admissionTypeLabel =
    admission.admission_type === 'inpatient'
      ? 'تنويم كامل'
      : admission.admission_type === 'short_stay'
        ? 'إقامة قصيرة'
        : '—'

  const ward = admission.bed?.room?.ward

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Card title="موقع المريض">
          <Descriptions
            column={{ xs: 2, md: 5 }}
            size="small"
            items={[
              { key: 'floor', label: 'الطابق', children: ward?.floor?.name ?? '—' },
              { key: 'ward', label: 'القسم', children: ward?.name ?? '—' },
              { key: 'room', label: 'الغرفة', children: admission.bed?.room?.room_number ?? '—' },
              { key: 'bed', label: 'السرير', children: admission.bed?.bed_number ?? '—' },
              { key: 'doctor', label: 'الطبيب المعالج', children: admission.admitting_doctor?.name ?? '—' },
            ]}
          />
        </Card>
      </Col>

      <Col xs={24} md={12}>
        <Card title="بيانات التنويم">
          <Descriptions
            column={2}
            size="small"
            items={[
              { key: 'number', label: 'رقم التنويم', children: admission.admission_number ?? '—' },
              { key: 'type', label: 'نوع التنويم', children: admissionTypeLabel },
              { key: 'admitted_at', label: 'تاريخ الدخول', children: formatDateTime(admission.admission_date) },
              {
                key: 'discharged_at',
                label: 'تاريخ الخروج',
                children: admission.discharge_date ? formatDateTime(admission.discharge_date) : '—',
              },
              {
                key: 'duration',
                label: 'مدة الإقامة (ساعات)',
                children: admission.admission_duration_hours ?? '—',
              },
            ]}
          />
        </Card>
      </Col>

      <Col xs={24} md={12}>
        <Card title="التشخيص والملاحظات">
          <Descriptions
            column={1}
            size="small"
            items={[
              { key: 'diagnosis', label: 'التشخيص', children: admission.diagnosis ?? '—' },
              { key: 'notes', label: 'ملاحظات الدخول', children: admission.admission_notes ?? '—' },
            ]}
          />
        </Card>
      </Col>

      {admission.status === 'discharged' && (
        <Col span={24}>
          <Card
            title={
              <span>
                ملخص الخروج <Tag color="success">مخرّجة</Tag>
              </span>
            }
          >
            <Text>{admission.discharge_summary ?? '—'}</Text>
          </Card>
        </Col>
      )}

      {admission.status === 'cancelled' && (
        <Col span={24}>
          <Card
            title={
              <span>
                سبب الإلغاء <Tag>ملغاة</Tag>
              </span>
            }
          >
            <Text>{admission.cancellation_reason ?? '—'}</Text>
            {admission.cancelled_at && (
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {formatDateTime(admission.cancelled_at)}
                </Text>
              </div>
            )}
          </Card>
        </Col>
      )}
    </Row>
  )
}
