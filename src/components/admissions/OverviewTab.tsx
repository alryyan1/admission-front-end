import type { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import type { Admission } from '@/types/admission'

interface OverviewTabProps {
  admission: Admission
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value ?? '—'}</p>
    </div>
  )
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
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">موقع المريض</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <Field label="الطابق" value={ward?.floor?.name} />
            <Field label="القسم" value={ward?.name} />
            <Field label="الغرفة" value={admission.bed?.room?.room_number} />
            <Field label="السرير" value={admission.bed?.bed_number} />
            <Field label="الطبيب المعالج" value={admission.admitting_doctor?.name} />
          </div>
        </Card>
      </div>

      <div className="col-span-12 md:col-span-6">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">بيانات التنويم</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="رقم التنويم" value={admission.admission_number} />
            <Field label="نوع التنويم" value={admissionTypeLabel} />
            <Field label="تاريخ الدخول" value={formatDateTime(admission.admission_date)} />
            <Field
              label="تاريخ الخروج"
              value={admission.discharge_date ? formatDateTime(admission.discharge_date) : null}
            />
            <Field
              label="مدة الإقامة (ساعات)"
              value={admission.admission_duration_hours}
            />
          </div>
        </Card>
      </div>

      <div className="col-span-12 md:col-span-6">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">التشخيص والملاحظات</h2>
          <div className="flex flex-col gap-3">
            <Field label="التشخيص" value={admission.diagnosis} />
            <Field label="ملاحظات الدخول" value={admission.admission_notes} />
          </div>
        </Card>
      </div>

      {admission.status === 'discharged' && (
        <div className="col-span-12">
          <Card className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <h2 className="text-sm font-semibold">ملخص الخروج</h2>
              <Badge variant="success">مخرّجة</Badge>
            </div>
            <p className="text-sm">{admission.discharge_summary ?? '—'}</p>
          </Card>
        </div>
      )}

      {admission.status === 'cancelled' && (
        <div className="col-span-12">
          <Card className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <h2 className="text-sm font-semibold">سبب الإلغاء</h2>
              <Badge variant="secondary">ملغاة</Badge>
            </div>
            <p className="text-sm">{admission.cancellation_reason ?? '—'}</p>
            {admission.cancelled_at && (
              <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(admission.cancelled_at)}</p>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
