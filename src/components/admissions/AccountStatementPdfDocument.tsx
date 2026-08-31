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
import { formatDate, formatNumber } from '@/lib/utils'

const styles = StyleSheet.create({
  page: pdfPageStyle,
  meta: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 14 },
  metaText: { fontSize: 10, direction: 'rtl', textAlign: 'right' },
  tableHeader: {
    flexDirection: 'row-reverse',
    paddingVertical: 6,
    paddingHorizontal: 6,
    backgroundColor: '#f3f4f6',
  },
  row: {
    flexDirection: 'row-reverse',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cellDate: { width: '16%', direction: 'rtl', textAlign: 'right' },
  cellDesc: { width: '38%', direction: 'rtl', textAlign: 'right' },
  cellNum: { width: '15.33%', direction: 'rtl', textAlign: 'right' },
  headerCell: { fontWeight: 'bold' },
  totalsBlock: { marginTop: 12, alignItems: 'flex-end' },
  totalsRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', width: 260, paddingVertical: 3 },
  totalsLabel: { fontSize: 10, direction: 'rtl', textAlign: 'right', width: 190 },
  totalsValue: { fontSize: 10, direction: 'rtl', textAlign: 'left', width: 70 },
  balanceLabel: { fontSize: 12, fontWeight: 'bold', direction: 'rtl', textAlign: 'right', width: 190 },
  balanceValue: { fontSize: 12, fontWeight: 'bold', direction: 'rtl', textAlign: 'left', width: 70 },
})

export interface AccountStatementPdfRow {
  key: string
  date: string
  description: string
  debit: number
  credit: number
  balance: number
}

export interface AccountStatementPdfDocumentProps {
  assets: PdfFacilityAssets
  patientName: string
  admissionId: number
  rows: AccountStatementPdfRow[]
  totalDebit: number
  totalCredit: number
  balanceDue: number
}

export function AccountStatementPdfDocument({
  assets,
  patientName,
  admissionId,
  rows,
  totalDebit,
  totalCredit,
  balanceDue,
}: AccountStatementPdfDocumentProps) {
  ensurePdfFontRegistered()

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PdfWatermark assets={assets} />
        <PdfLetterheadHeader assets={assets} />

        <Text style={pdfTitleStyle}>{ar('كشف حساب تنويم')}</Text>

        <View style={styles.meta}>
          <Text style={styles.metaText}>{ar(`المريض: ${patientName}`)}</Text>
          <Text style={styles.metaText}>{ar(`رقم التنويم: #${admissionId}`)}</Text>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.cellDate, styles.headerCell]}>{ar('التاريخ')}</Text>
          <Text style={[styles.cellDesc, styles.headerCell]}>{ar('البيان')}</Text>
          <Text style={[styles.cellNum, styles.headerCell]}>{ar('مدين')}</Text>
          <Text style={[styles.cellNum, styles.headerCell]}>{ar('دائن')}</Text>
          <Text style={[styles.cellNum, styles.headerCell]}>{ar('الرصيد')}</Text>
        </View>
        {rows.map((r) => (
          <View key={r.key} style={styles.row}>
            <Text style={styles.cellDate}>{formatDate(r.date)}</Text>
            <Text style={styles.cellDesc}>{ar(r.description)}</Text>
            <Text style={styles.cellNum}>{r.debit ? formatNumber(r.debit) : '—'}</Text>
            <Text style={styles.cellNum}>{r.credit ? formatNumber(r.credit) : '—'}</Text>
            <Text style={styles.cellNum}>{formatNumber(r.balance)}</Text>
          </View>
        ))}

        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>{ar('إجمالي المدين (الخدمات والعمليات)')}</Text>
            <Text style={styles.totalsValue}>{formatNumber(totalDebit)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>{ar('إجمالي الدائن (الدفعات)')}</Text>
            <Text style={styles.totalsValue}>{formatNumber(totalCredit)}</Text>
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
