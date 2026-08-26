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
import type { RequestedService } from '@/types/admission'

const styles = StyleSheet.create({
  page: pdfPageStyle,
  draftBanner: {
    alignSelf: 'center',
    marginBottom: 10,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#d97706',
    borderRadius: 3,
  },
  draftBannerText: { fontSize: 9, color: '#d97706', direction: 'rtl', textAlign: 'center' },
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
  cellName: { width: '70%', direction: 'rtl', textAlign: 'right' },
  cellNum: { width: '30%', direction: 'rtl', textAlign: 'right' },
  headerCell: { fontWeight: 'bold' },
  totalsBlock: { marginTop: 12, alignItems: 'flex-end' },
  totalsRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', width: '46%', paddingVertical: 3 },
  totalsLabel: { fontSize: 10, direction: 'rtl' },
  totalsValue: { fontSize: 10, direction: 'rtl' },
  balanceLabel: { fontSize: 12, fontWeight: 'bold', direction: 'rtl' },
  balanceValue: { fontSize: 12, fontWeight: 'bold', direction: 'rtl' },
})

export interface InvoicePdfDocumentProps {
  assets: PdfFacilityAssets
  patientName: string
  admissionId: number
  services: RequestedService[]
  servicesTotal: number
  depositsTotal: number
  balanceDue: number
  total: number
}

export function InvoicePdfDocument({
  assets,
  patientName,
  admissionId,
  services,
  servicesTotal,
  depositsTotal,
  balanceDue,
  total,
}: InvoicePdfDocumentProps) {
  ensurePdfFontRegistered()

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PdfWatermark assets={assets} />
        <PdfLetterheadHeader assets={assets} />

        <Text style={pdfTitleStyle}>{ar('فاتورة مبدئية')}</Text>
        <View style={styles.draftBanner}>
          <Text style={styles.draftBannerText}>{ar('مبدئية — غير نهائية، قابلة للتغيير')}</Text>
        </View>

        <View style={styles.meta}>
          <Text style={styles.metaText}>{ar(`المريض: ${patientName}`)}</Text>
          <Text style={styles.metaText}>{ar(`رقم التنويم: #${admissionId}`)}</Text>
          <Text style={styles.metaText}>{ar(`التاريخ: ${formatDate(new Date().toISOString())}`)}</Text>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.cellName, styles.headerCell]}>{ar('الخدمة')}</Text>
          <Text style={[styles.cellNum, styles.headerCell]}>{ar('الإجمالي')}</Text>
        </View>
        {services.map((s) => (
          <View key={s.id} style={styles.row}>
            <Text style={styles.cellName}>{ar(`${s.name} × ${s.quantity}`)}</Text>
            <Text style={styles.cellNum}>{formatNumber(s.total_price)}</Text>
          </View>
        ))}

        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>{ar('إجمالي الخدمات')}</Text>
            <Text style={styles.totalsValue}>{formatNumber(servicesTotal)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>{ar('الإجمالي الكلي')}</Text>
            <Text style={styles.totalsValue}>{formatNumber(total)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>{ar('الدفعات المسددة')}</Text>
            <Text style={styles.totalsValue}>{formatNumber(depositsTotal)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.balanceLabel}>{ar('المبلغ المتبقي')}</Text>
            <Text style={styles.balanceValue}>{formatNumber(balanceDue)}</Text>
          </View>
        </View>

        <PdfLetterheadFooter assets={assets} />
      </Page>
    </Document>
  )
}
