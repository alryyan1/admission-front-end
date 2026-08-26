import { Document, Page, View, Text, StyleSheet, PDFViewer } from '@react-pdf/renderer'
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

const styles = StyleSheet.create({
  page: pdfPageStyle,
  tableHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 6,
    backgroundColor: '#f3f4f6',
  },
  row: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cellWide: { width: '70%', direction: 'rtl', textAlign: 'right' },
  cellNarrow: { width: '30%', direction: 'rtl', textAlign: 'right' },
  headerCell: { fontWeight: 'bold' },
  totalsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 6,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#d1d5db',
  },
})

const PLACEHOLDER_ROWS = [
  { name: ar('رسوم الإقامة (يوم واحد)'), total: '500.00' },
  { name: ar('خدمة فتح الملف'), total: '50.00' },
  { name: ar('استشارة طبية'), total: '150.00' },
]

export type FacilityPdfDocumentProps = PdfFacilityAssets

export function FacilityPdfDocument(assets: FacilityPdfDocumentProps) {
  ensurePdfFontRegistered()

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PdfWatermark assets={assets} />
        <PdfLetterheadHeader assets={assets} fallbackSubtitle="معاينة تصميم الفاتورة — نظام إدارة التنويم" />

        <Text style={pdfTitleStyle}>{ar('فاتورة تنويم (نموذج معاينة)')}</Text>

        <View style={styles.tableHeader}>
          <Text style={[styles.cellWide, styles.headerCell]}>{ar('الوصف')}</Text>
          <Text style={[styles.cellNarrow, styles.headerCell]}>{ar('الإجمالي')}</Text>
        </View>
        {PLACEHOLDER_ROWS.map((r) => (
          <View key={r.name} style={styles.row}>
            <Text style={styles.cellWide}>{r.name}</Text>
            <Text style={styles.cellNarrow}>{r.total}</Text>
          </View>
        ))}

        <View style={styles.totalsRow}>
          <Text style={[styles.cellWide, styles.headerCell]}>{ar('الإجمالي الكلي')}</Text>
          <Text style={[styles.cellNarrow, styles.headerCell]}>700.00</Text>
        </View>

        <PdfLetterheadFooter assets={assets} fallbackAddress="هذه معاينة تجريبية فقط" />
      </Page>
    </Document>
  )
}

export function FacilityPdfPreview(props: FacilityPdfDocumentProps) {
  return (
    <PDFViewer width="100%" height={640} showToolbar={false} style={{ border: 'none' }}>
      <FacilityPdfDocument {...props} />
    </PDFViewer>
  )
}
