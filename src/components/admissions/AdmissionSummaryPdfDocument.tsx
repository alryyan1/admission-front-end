import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import dayjs from 'dayjs'
import {
  ar,
  ensurePdfFontRegistered,
  pdfPageStyle,
  pdfTitleStyle,
  PdfWatermark,
  PdfLetterheadHeader,
  PdfLetterheadFooter,
  type PdfFacilityAssets,
} from '@/lib/pdfLetterhead'
import { formatDate, formatDateTime, formatNumber } from '@/lib/utils'
import type {
  Admission,
  AdmissionStatus,
  AdmissionDeposit,
  DoctorOrder,
  Operation,
  RequestedService,
  VitalSign,
} from '@/types/admission'

const STATUS_LABEL: Record<AdmissionStatus, string> = {
  admitted: 'نشطة',
  discharged: 'مخرّجة',
  cancelled: 'ملغاة',
}

const GENDER_LABEL: Record<string, string> = { male: 'ذكر', female: 'أنثى' }

const ADMISSION_TYPE_LABEL: Record<string, string> = {
  inpatient: 'تنويم كامل',
  short_stay: 'إقامة قصيرة',
}

const ORDER_STATUS_LABEL: Record<string, string> = {
  active: 'نشط',
  discontinued: 'موقوف',
}

const styles = StyleSheet.create({
  page: { ...pdfPageStyle, paddingBottom: 150 },
  meta: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap' },
  metaText: { fontSize: 9, direction: 'rtl', textAlign: 'right' },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    direction: 'rtl',
    textAlign: 'right',
    backgroundColor: '#f3f4f6',
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginTop: 14,
    marginBottom: 8,
  },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', marginBottom: 4 },
  gridItem: { width: '33.33%', paddingVertical: 4, paddingHorizontal: 4 },
  gridLabel: { fontSize: 8, color: '#6b7280', direction: 'rtl', textAlign: 'right' },
  gridValue: { fontSize: 10, direction: 'rtl', textAlign: 'right', marginTop: 2 },
  noteBox: { padding: 8, backgroundColor: '#f9fafb', borderRadius: 3, marginBottom: 4 },
  noteLabel: { fontSize: 9, fontWeight: 'bold', direction: 'rtl', textAlign: 'right', marginBottom: 3 },
  noteText: { fontSize: 10, direction: 'rtl', textAlign: 'right', lineHeight: 1.4 },
  tableHeader: { flexDirection: 'row-reverse', paddingVertical: 5, paddingHorizontal: 5, backgroundColor: '#f3f4f6' },
  row: {
    flexDirection: 'row-reverse',
    paddingVertical: 5,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerCell: { fontWeight: 'bold', fontSize: 9 },
  cell: { fontSize: 9, direction: 'rtl', textAlign: 'right' },
  emptyText: { fontSize: 9, color: '#9ca3af', direction: 'rtl', textAlign: 'center', paddingVertical: 10 },
  totalsBlock: { marginTop: 8, alignItems: 'flex-end' },
  totalsRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', width: 260, paddingVertical: 3 },
  totalsLabel: { fontSize: 10, direction: 'rtl', textAlign: 'right', width: 190 },
  totalsValue: { fontSize: 10, direction: 'rtl', textAlign: 'left', width: 70 },
  balanceLabel: { fontSize: 12, fontWeight: 'bold', direction: 'rtl', textAlign: 'right', width: 190 },
  balanceValue: { fontSize: 12, fontWeight: 'bold', direction: 'rtl', textAlign: 'left', width: 70 },
})

interface Column<T> {
  header: string
  width: string
  render: (row: T) => string
}

function PdfTable<T extends { id: number | string }>({
  columns,
  rows,
  emptyText,
}: {
  columns: Column<T>[]
  rows: T[]
  emptyText: string
}) {
  return (
    <View>
      <View style={styles.tableHeader}>
        {columns.map((c) => (
          <Text key={c.header} style={[styles.cell, styles.headerCell, { width: c.width }]}>
            {ar(c.header)}
          </Text>
        ))}
      </View>
      {rows.length === 0 ? (
        <Text style={styles.emptyText}>{ar(emptyText)}</Text>
      ) : (
        rows.map((row) => (
          <View key={row.id} style={styles.row} wrap={false}>
            {columns.map((c) => (
              <Text key={c.header} style={[styles.cell, { width: c.width }]}>
                {ar(c.render(row))}
              </Text>
            ))}
          </View>
        ))
      )}
    </View>
  )
}

function GridItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.gridItem}>
      <Text style={styles.gridLabel}>{ar(label)}</Text>
      <Text style={styles.gridValue}>{ar(value)}</Text>
    </View>
  )
}

export interface AdmissionSummaryPdfDocumentProps {
  assets: PdfFacilityAssets
  admission: Admission
}

export function AdmissionSummaryPdfDocument({ assets, admission }: AdmissionSummaryPdfDocumentProps) {
  ensurePdfFontRegistered()

  const patient = admission.patient
  const ward = admission.bed?.room?.ward

  const stayDuration = Math.max(
    1,
    dayjs(admission.discharge_date ?? undefined).diff(dayjs(admission.admission_date), 'day') + 1,
  )

  const services = admission.requested_services ?? []
  const deposits = admission.deposits ?? []
  const vitals = admission.vital_signs ?? []
  const orders = admission.doctor_orders ?? []
  const operations = admission.operations ?? []

  const totalServices = services.reduce((sum, s) => sum + Number(s.total_price), 0)
  const totalOperations = operations.reduce((sum, op) => sum + (op.price != null ? Number(op.price) : 0), 0)
  const totalDeposits = deposits.reduce((sum, d) => sum + Number(d.amount), 0)
  const balanceDue = totalServices + totalOperations - totalDeposits

  const hasMedicalBackground = !!(
    patient?.allergies ||
    patient?.chronic_diseases ||
    patient?.current_medications ||
    patient?.past_surgeries ||
    patient?.medical_history ||
    patient?.medical_notes
  )

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <PdfWatermark assets={assets} />
        <PdfLetterheadHeader assets={assets} />

        <Text style={pdfTitleStyle}>{ar('ملخص تنويم شامل')}</Text>

        <View style={styles.meta}>
          <Text style={styles.metaText}>{ar(`المريض: ${patient?.name ?? '—'}`)}</Text>
          <Text style={styles.metaText}>{ar(`رقم التنويم: #${admission.id}`)}</Text>
          <Text style={styles.metaText}>{ar(`تاريخ الإصدار: ${formatDateTime(new Date().toISOString())}`)}</Text>
        </View>

        <Text style={styles.sectionTitle}>{ar('بيانات المريض')}</Text>
        <View style={styles.grid}>
          <GridItem label="الاسم" value={patient?.name ?? '—'} />
          <GridItem label="الجنس" value={patient?.gender ? (GENDER_LABEL[patient.gender] ?? patient.gender) : '—'} />
          <GridItem label="العمر" value={patient?.age_year != null ? `${patient.age_year} سنة` : '—'} />
          <GridItem label="فصيلة الدم" value={patient?.blood_type ?? '—'} />
          <GridItem label="الهاتف" value={patient?.phone ?? '—'} />
          <GridItem label="العنوان" value={patient?.address ?? '—'} />
          <GridItem label="جهة اتصال الطوارئ" value={patient?.emergency_contact_name ?? '—'} />
          <GridItem label="هاتف الطوارئ" value={patient?.emergency_contact_phone ?? '—'} />
          <GridItem label="صلة القرابة" value={patient?.emergency_contact_relationship ?? '—'} />
        </View>

        {hasMedicalBackground && (
          <>
            <Text style={styles.sectionTitle}>{ar('الخلفية الطبية')}</Text>
            {patient?.allergies && (
              <View style={styles.noteBox}>
                <Text style={styles.noteLabel}>{ar('الحساسية')}</Text>
                <Text style={styles.noteText}>{ar(patient.allergies)}</Text>
              </View>
            )}
            {patient?.chronic_diseases && (
              <View style={styles.noteBox}>
                <Text style={styles.noteLabel}>{ar('الأمراض المزمنة')}</Text>
                <Text style={styles.noteText}>{ar(patient.chronic_diseases)}</Text>
              </View>
            )}
            {patient?.current_medications && (
              <View style={styles.noteBox}>
                <Text style={styles.noteLabel}>{ar('الأدوية الحالية')}</Text>
                <Text style={styles.noteText}>{ar(patient.current_medications)}</Text>
              </View>
            )}
            {patient?.past_surgeries && (
              <View style={styles.noteBox}>
                <Text style={styles.noteLabel}>{ar('عمليات جراحية سابقة')}</Text>
                <Text style={styles.noteText}>{ar(patient.past_surgeries)}</Text>
              </View>
            )}
            {patient?.medical_history && (
              <View style={styles.noteBox}>
                <Text style={styles.noteLabel}>{ar('التاريخ المرضي')}</Text>
                <Text style={styles.noteText}>{ar(patient.medical_history)}</Text>
              </View>
            )}
            {patient?.medical_notes && (
              <View style={styles.noteBox}>
                <Text style={styles.noteLabel}>{ar('ملاحظات طبية')}</Text>
                <Text style={styles.noteText}>{ar(patient.medical_notes)}</Text>
              </View>
            )}
          </>
        )}

        <Text style={styles.sectionTitle}>{ar('بيانات التنويم')}</Text>
        <View style={styles.grid}>
          <GridItem label="رقم التنويم" value={admission.admission_number ?? '—'} />
          <GridItem label="الحالة" value={STATUS_LABEL[admission.status] ?? admission.status} />
          <GridItem
            label="نوع التنويم"
            value={admission.admission_type ? (ADMISSION_TYPE_LABEL[admission.admission_type] ?? admission.admission_type) : '—'}
          />
          <GridItem label="تاريخ الدخول" value={formatDateTime(admission.admission_date)} />
          <GridItem label="تاريخ الخروج" value={admission.discharge_date ? formatDateTime(admission.discharge_date) : '—'} />
          <GridItem label="مدة الإقامة" value={`${stayDuration} ${stayDuration === 1 ? 'يوم' : 'أيام'}`} />
          <GridItem label="الطابق" value={ward?.floor?.name ?? '—'} />
          <GridItem label="القسم" value={ward?.name ?? '—'} />
          <GridItem
            label="الغرفة / السرير"
            value={`${admission.bed?.room?.room_number ?? '—'} / ${admission.bed?.bed_number ?? '—'}`}
          />
          <GridItem label="الطبيب المعالج" value={admission.admitting_doctor?.name ?? '—'} />
          <GridItem label="التشخيص" value={admission.diagnosis ?? '—'} />
        </View>

        {admission.admission_notes && (
          <View style={styles.noteBox}>
            <Text style={styles.noteLabel}>{ar('ملاحظات الدخول')}</Text>
            <Text style={styles.noteText}>{ar(admission.admission_notes)}</Text>
          </View>
        )}
        {admission.status === 'discharged' && admission.discharge_summary && (
          <View style={styles.noteBox}>
            <Text style={styles.noteLabel}>{ar('ملخص الخروج')}</Text>
            <Text style={styles.noteText}>{ar(admission.discharge_summary)}</Text>
          </View>
        )}
        {admission.status === 'cancelled' && admission.cancellation_reason && (
          <View style={styles.noteBox}>
            <Text style={styles.noteLabel}>{ar('سبب الإلغاء')}</Text>
            <Text style={styles.noteText}>{ar(admission.cancellation_reason)}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>{ar('العلامات الحيوية')}</Text>
        <PdfTable<VitalSign>
          columns={[
            { header: 'الوقت', width: '18%', render: (v) => formatDateTime(v.recorded_at) },
            { header: 'الحرارة', width: '12%', render: (v) => v.temperature ?? '—' },
            { header: 'النبض', width: '12%', render: (v) => (v.pulse != null ? String(v.pulse) : '—') },
            { header: 'التنفس', width: '12%', render: (v) => (v.respiration_rate != null ? String(v.respiration_rate) : '—') },
            { header: 'ضغط الدم', width: '14%', render: (v) => v.blood_pressure ?? '—' },
            { header: 'الأكسجين', width: '12%', render: (v) => (v.oxygen_saturation != null ? `${v.oxygen_saturation}%` : '—') },
            { header: 'ملاحظات', width: '20%', render: (v) => v.notes ?? '—' },
          ]}
          rows={vitals}
          emptyText="لا توجد تسجيلات علامات حيوية"
        />

        <Text style={styles.sectionTitle}>{ar('أوامر الأطباء')}</Text>
        <PdfTable<DoctorOrder>
          columns={[
            { header: 'الأمر / الدواء', width: '36%', render: (o) => o.order_text },
            { header: 'التكرار', width: '16%', render: (o) => o.frequency ?? '—' },
            { header: 'طريقة الإعطاء', width: '16%', render: (o) => o.route ?? '—' },
            { header: 'الحالة', width: '14%', render: (o) => ORDER_STATUS_LABEL[o.status] ?? o.status },
            { header: 'الجرعات المسجلة', width: '18%', render: (o) => String(o.doses?.length ?? 0) },
          ]}
          rows={orders}
          emptyText="لا توجد أوامر طبية"
        />

        <Text style={styles.sectionTitle}>{ar('العمليات الجراحية')}</Text>
        <PdfTable<Operation>
          columns={[
            { header: 'رقم العملية', width: '14%', render: (o) => o.operation_number ?? '—' },
            { header: 'الإجراء', width: '34%', render: (o) => o.procedure?.name_ar ?? '—' },
            { header: 'الجراح', width: '20%', render: (o) => o.surgeon?.name ?? '—' },
            { header: 'السعر', width: '14%', render: (o) => (o.price != null ? formatNumber(Number(o.price)) : '—') },
            { header: 'تاريخ العملية', width: '18%', render: (o) => formatDateTime(o.scheduled_at) },
          ]}
          rows={operations}
          emptyText="لا توجد عمليات مجدولة"
        />

        <Text style={styles.sectionTitle} break>
          {ar('الخدمات المطلوبة')}
        </Text>
        <PdfTable<RequestedService>
          columns={[
            { header: 'الخدمة', width: '40%', render: (s) => s.name },
            { header: 'الكمية', width: '12%', render: (s) => String(s.quantity) },
            { header: 'سعر الوحدة', width: '20%', render: (s) => formatNumber(s.unit_price) },
            { header: 'الإجمالي', width: '18%', render: (s) => formatNumber(s.total_price) },
            { header: 'النوع', width: '10%', render: (s) => (s.is_auto_added ? 'تلقائي' : 'يدوي') },
          ]}
          rows={services}
          emptyText="لا توجد خدمات مطلوبة"
        />

        <Text style={styles.sectionTitle}>{ar('الدفعات')}</Text>
        <PdfTable<AdmissionDeposit>
          columns={[
            { header: 'التاريخ', width: '22%', render: (d) => formatDate(d.paid_at) },
            { header: 'طريقة الدفع', width: '38%', render: (d) => d.payment_method?.name ?? '—' },
            { header: 'المبلغ', width: '40%', render: (d) => formatNumber(d.amount) },
          ]}
          rows={deposits}
          emptyText="لا توجد دفعات مسجلة"
        />

        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>{ar('إجمالي الخدمات')}</Text>
            <Text style={styles.totalsValue}>{formatNumber(totalServices)}</Text>
          </View>
          {totalOperations > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>{ar('إجمالي العمليات')}</Text>
              <Text style={styles.totalsValue}>{formatNumber(totalOperations)}</Text>
            </View>
          )}
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>{ar('إجمالي الدفعات')}</Text>
            <Text style={styles.totalsValue}>{formatNumber(totalDeposits)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.balanceLabel}>{ar('الرصيد المستحق')}</Text>
            <Text style={styles.balanceValue}>{formatNumber(balanceDue)}</Text>
          </View>
        </View>

        <PdfLetterheadFooter assets={assets} showStamp={false} />
      </Page>
    </Document>
  )
}
