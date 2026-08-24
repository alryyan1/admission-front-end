import { Document, Page, View, Text, Image, StyleSheet, Font, PDFViewer } from '@react-pdf/renderer'
import ArabicReshaper from 'arabic-reshaper'
import tajawalRegular from '@fontsource/amiri/files/amiri-arabic-400-normal.woff?url'
import tajawalBold from '@fontsource/amiri/files/amiri-arabic-700-normal.woff?url'

// react-pdf's font engine handles bidi reordering but not Arabic letter joining,
// so glyphs render disconnected unless pre-shaped into presentation forms first.
function ar(text: string): string {
  return ArabicReshaper.convertArabic(text)
}

let fontRegistered = false
function ensureFontRegistered() {
  if (fontRegistered) return
  Font.register({
    family: 'Tajawal',
    fonts: [
      { src: tajawalRegular, fontWeight: 'normal' },
      { src: tajawalBold, fontWeight: 'bold' },
    ],
  })
  fontRegistered = true
}

const styles = StyleSheet.create({
  page: { padding: 36, fontFamily: 'Tajawal', fontSize: 10, color: '#1f2937' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
  },
  logoBox: { width: 110, height: 64, alignItems: 'flex-start', justifyContent: 'center' },
  logoImg: { maxWidth: 110, maxHeight: 64, objectFit: 'contain' },
  headerSpacer: { width: 110 },
  nameBox: { flex: 1, alignItems: 'center' },
  facilityName: { fontSize: 15, fontWeight: 'bold', direction: 'rtl', textAlign: 'center' },
  facilitySub: { fontSize: 9, color: '#6b7280', direction: 'rtl', textAlign: 'center', marginTop: 3 },
  title: { fontSize: 13, fontWeight: 'bold', textAlign: 'center', direction: 'rtl', marginBottom: 18 },
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
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 36,
    right: 36,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  stampBox: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center' },
  stampImg: { width: 100, height: 100, objectFit: 'contain' },
  footerAddress: { fontSize: 8, color: '#9ca3af', direction: 'rtl', textAlign: 'right', maxWidth: 320 },
  watermark: {
    position: 'absolute',
    top: '30%',
    left: '20%',
    width: '60%',
    height: '40%',
    objectFit: 'contain',
    opacity: 0.08,
  },
})

const PLACEHOLDER_ROWS = [
  { name: ar('رسوم الإقامة (يوم واحد)'), total: '500.00' },
  { name: ar('خدمة فتح الملف'), total: '50.00' },
  { name: ar('استشارة طبية'), total: '150.00' },
]

export interface FacilityPdfDocumentProps {
  logoSrc: string | null
  stampSrc: string | null
  watermarkSrc?: string | null
  useLogo: boolean
  useStamp: boolean
  useWatermark?: boolean
  facilityName?: string | null
  facilityPhone?: string | null
  facilityEmail?: string | null
  facilityAddress?: string | null
}

export function FacilityPdfDocument({
  logoSrc,
  stampSrc,
  watermarkSrc,
  useLogo,
  useStamp,
  useWatermark,
  facilityName,
  facilityPhone,
  facilityEmail,
  facilityAddress,
}: FacilityPdfDocumentProps) {
  ensureFontRegistered()
  const showLogo = useLogo && !!logoSrc
  const showStamp = useStamp && !!stampSrc
  const showWatermark = !!useWatermark && !!watermarkSrc

  const contactLine = [facilityPhone, facilityEmail].filter(Boolean).join('  —  ')

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {showWatermark && <Image src={watermarkSrc!} style={styles.watermark} fixed />}

        <View style={styles.header}>
          <View style={styles.logoBox}>{showLogo && <Image src={logoSrc!} style={styles.logoImg} />}</View>
          <View style={styles.nameBox}>
            <Text style={styles.facilityName}>{ar(facilityName || 'اسم المنشأة الطبية')}</Text>
            <Text style={styles.facilitySub}>
              {contactLine ? ar(contactLine) : ar('معاينة تصميم الفاتورة — نظام إدارة التنويم')}
            </Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <Text style={styles.title}>{ar('فاتورة تنويم (نموذج معاينة)')}</Text>

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

        <View style={styles.footer} fixed>
          <View style={styles.stampBox}>{showStamp && <Image src={stampSrc!} style={styles.stampImg} />}</View>
          <Text style={styles.footerAddress}>
            {facilityAddress ? ar(facilityAddress) : ar('هذه معاينة تجريبية فقط')}
          </Text>
        </View>
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
