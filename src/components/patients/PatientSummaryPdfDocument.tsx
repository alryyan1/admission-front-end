import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
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
import { formatDateTime } from '@/lib/utils'
import type { Admission } from '@/types/admission'
import type { Patient } from '@/types/patient'

const STATUS_LABEL: Record<string, string> = {
  admitted: 'نشطة',
  discharged: 'مخرّجة',
  cancelled: 'ملغاة',
}

const GENDER_LABEL: Record<string, string> = { male: 'ذكر', female: 'أنثى' }

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

export interface PatientSummaryPdfDocumentProps {
  assets: PdfFacilityAssets
  patient: Patient
  admissions: Admission[]
}

export function PatientSummaryPdfDocument({ assets, patient, admissions }: PatientSummaryPdfDocumentProps) {
  ensurePdfFontRegistered()

  const ageValue =
    patient.age_year != null
      ? `${patient.age_year} سنة${patient.age_month ? ` و${patient.age_month} شهر` : ''}`
      : '—'

  const hasMedicalBackground = !!(
    patient.allergies ||
    patient.chronic_diseases ||
    patient.current_medications ||
    patient.past_surgeries ||
    patient.medical_history ||
    patient.medical_notes
  )

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <PdfWatermark assets={assets} />
        <PdfLetterheadHeader assets={assets} />

        <Text style={pdfTitleStyle}>{ar('ملف المريض')}</Text>

        <View style={styles.meta}>
          <Text style={styles.metaText}>{ar(`المريض: ${patient.name}`)}</Text>
          <Text style={styles.metaText}>{ar(`رقم الملف: #${patient.id}`)}</Text>
          <Text style={styles.metaText}>{ar(`تاريخ الإصدار: ${formatDateTime(new Date().toISOString())}`)}</Text>
        </View>

        <Text style={styles.sectionTitle}>{ar('بيانات المريض')}</Text>
        <View style={styles.grid}>
          <GridItem label="الاسم" value={patient.name} />
          <GridItem label="الجنس" value={patient.gender ? (GENDER_LABEL[patient.gender] ?? patient.gender) : '—'} />
          <GridItem label="العمر" value={ageValue} />
          <GridItem label="فصيلة الدم" value={patient.blood_type ?? '—'} />
          <GridItem label="الهاتف" value={patient.phone ?? '—'} />
          <GridItem label="العنوان" value={patient.address ?? '—'} />
        </View>

        <Text style={styles.sectionTitle}>{ar('جهة اتصال الطوارئ')}</Text>
        <View style={styles.grid}>
          <GridItem label="الاسم" value={patient.emergency_contact_name ?? '—'} />
          <GridItem label="صلة القرابة" value={patient.emergency_contact_relationship ?? '—'} />
          <GridItem label="الهاتف" value={patient.emergency_contact_phone ?? '—'} />
          <GridItem label="العنوان" value={patient.emergency_contact_address ?? '—'} />
        </View>

        {hasMedicalBackground && (
          <>
            <Text style={styles.sectionTitle}>{ar('الخلفية الطبية')}</Text>
            {patient.allergies && (
              <View style={styles.noteBox}>
                <Text style={styles.noteLabel}>{ar('الحساسية')}</Text>
                <Text style={styles.noteText}>{ar(patient.allergies)}</Text>
              </View>
            )}
            {patient.chronic_diseases && (
              <View style={styles.noteBox}>
                <Text style={styles.noteLabel}>{ar('الأمراض المزمنة')}</Text>
                <Text style={styles.noteText}>{ar(patient.chronic_diseases)}</Text>
              </View>
            )}
            {patient.current_medications && (
              <View style={styles.noteBox}>
                <Text style={styles.noteLabel}>{ar('الأدوية الحالية')}</Text>
                <Text style={styles.noteText}>{ar(patient.current_medications)}</Text>
              </View>
            )}
            {patient.past_surgeries && (
              <View style={styles.noteBox}>
                <Text style={styles.noteLabel}>{ar('عمليات جراحية سابقة')}</Text>
                <Text style={styles.noteText}>{ar(patient.past_surgeries)}</Text>
              </View>
            )}
            {patient.medical_history && (
              <View style={styles.noteBox}>
                <Text style={styles.noteLabel}>{ar('التاريخ المرضي')}</Text>
                <Text style={styles.noteText}>{ar(patient.medical_history)}</Text>
              </View>
            )}
            {patient.medical_notes && (
              <View style={styles.noteBox}>
                <Text style={styles.noteLabel}>{ar('ملاحظات طبية')}</Text>
                <Text style={styles.noteText}>{ar(patient.medical_notes)}</Text>
              </View>
            )}
          </>
        )}

        <Text style={styles.sectionTitle}>{ar('سجل التنويمات')}</Text>
        <PdfTable<Admission>
          columns={[
            { header: 'رقم التنويم', width: '16%', render: (a) => a.admission_number ?? '—' },
            {
              header: 'السرير',
              width: '30%',
              render: (a) =>
                `${a.bed?.room?.ward?.name ?? ''} — غرفة ${a.bed?.room?.room_number ?? ''} — سرير ${a.bed?.bed_number ?? ''}`,
            },
            { header: 'الطبيب المعالج', width: '20%', render: (a) => a.admitting_doctor?.name ?? '—' },
            { header: 'تاريخ الدخول', width: '20%', render: (a) => formatDateTime(a.admission_date) },
            { header: 'الحالة', width: '14%', render: (a) => STATUS_LABEL[a.status] ?? a.status },
          ]}
          rows={admissions}
          emptyText="لا يوجد سجل تنويمات"
        />

        <PdfLetterheadFooter assets={assets} />
      </Page>
    </Document>
  )
}
