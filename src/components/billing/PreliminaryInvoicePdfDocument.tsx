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
import { amountToArabicWords } from '@/lib/numberToArabicWords'

export interface PreliminaryInvoiceLineItem {
  key: string
  name: string
  unitPrice: number
  quantity: number
}

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
  cellName: { width: '46%', direction: 'rtl', textAlign: 'right' },
  cellPrice: { width: '18%', direction: 'rtl', textAlign: 'right' },
  cellQty: { width: '18%', direction: 'rtl', textAlign: 'right' },
  cellTotal: { width: '18%', direction: 'rtl', textAlign: 'right' },
  headerCell: { fontWeight: 'bold' },
  totalsBlock: { marginTop: 12, alignItems: 'flex-end' },
  totalsRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', width: 260, paddingVertical: 3 },
  balanceLabel: { fontSize: 12, fontWeight: 'bold', direction: 'rtl', textAlign: 'right', width: 190 },
  balanceValue: { fontSize: 12, fontWeight: 'bold', direction: 'rtl', textAlign: 'left', width: 70 },
  wordsBlock: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 3,
  },
  wordsLabel: { fontSize: 9, fontWeight: 'bold', direction: 'rtl', textAlign: 'right', marginBottom: 3 },
  wordsText: { fontSize: 10, direction: 'rtl', textAlign: 'right', lineHeight: 1.4 },
})

export interface PreliminaryInvoicePdfDocumentProps {
  assets: PdfFacilityAssets
  patientName: string
  notes?: string
  items: PreliminaryInvoiceLineItem[]
  total: number
}

export function PreliminaryInvoicePdfDocument({
  assets,
  patientName,
  notes,
  items,
  total,
}: PreliminaryInvoicePdfDocumentProps) {
  ensurePdfFontRegistered()

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PdfWatermark assets={assets} />
        <PdfLetterheadHeader assets={assets} />

        <Text style={pdfTitleStyle}>{ar('فاتورة مبدئية')}</Text>

        <View style={styles.meta}>
          <Text style={styles.metaText}>{ar(`المريض: ${patientName || '—'}`)}</Text>
          <Text style={styles.metaText}>{ar(`التاريخ: ${formatDate(new Date().toISOString())}`)}</Text>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.cellName, styles.headerCell]}>{ar('البند')}</Text>
          <Text style={[styles.cellPrice, styles.headerCell]}>{ar('السعر')}</Text>
          <Text style={[styles.cellQty, styles.headerCell]}>{ar('الكمية')}</Text>
          <Text style={[styles.cellTotal, styles.headerCell]}>{ar('الإجمالي')}</Text>
        </View>
        {items.map((item) => (
          <View key={item.key} style={styles.row}>
            <Text style={styles.cellName}>{ar(item.name)}</Text>
            <Text style={styles.cellPrice}>{formatNumber(item.unitPrice)}</Text>
            <Text style={styles.cellQty}>{formatNumber(item.quantity)}</Text>
            <Text style={styles.cellTotal}>{formatNumber(item.unitPrice * item.quantity)}</Text>
          </View>
        ))}

        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text style={styles.balanceLabel}>{ar('الإجمالي الكلي')}</Text>
            <Text style={styles.balanceValue}>{formatNumber(total)}</Text>
          </View>
        </View>

        <View style={styles.wordsBlock}>
          <Text style={styles.wordsLabel}>{ar('المبلغ كتابة')}</Text>
          <Text style={styles.wordsText}>{ar(amountToArabicWords(total))}</Text>
        </View>

        {!!notes && (
          <View style={styles.wordsBlock}>
            <Text style={styles.wordsLabel}>{ar('ملاحظات')}</Text>
            <Text style={styles.wordsText}>{ar(notes)}</Text>
          </View>
        )}

        <PdfLetterheadFooter assets={assets} />
      </Page>
    </Document>
  )
}
