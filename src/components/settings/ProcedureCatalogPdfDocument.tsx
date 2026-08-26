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
import type { Procedure, ProcedureCategory } from '@/types/admission'

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

const COLUMNS: { header: string; width: string; render: (p: Procedure) => string }[] = [
  { header: 'الاسم بالعربية', width: '32%', render: (p) => p.name_ar },
  { header: 'الاسم بالإنجليزية', width: '28%', render: (p) => p.name_en ?? '—' },
  { header: 'النوع', width: '20%', render: (p) => p.type ?? '—' },
  { header: 'الحالة', width: '20%', render: (p) => (p.is_active ? 'مفعّل' : 'غير مفعّل') },
]

function ProcedureTable({ procedures }: { procedures: Procedure[] }) {
  return (
    <View>
      <View style={styles.tableHeader}>
        {COLUMNS.map((c) => (
          <Text key={c.header} style={[styles.cell, styles.headerCell, { width: c.width }]}>
            {ar(c.header)}
          </Text>
        ))}
      </View>
      {procedures.length === 0 ? (
        <Text style={styles.emptyText}>{ar('لا توجد عمليات في هذا التصنيف')}</Text>
      ) : (
        procedures.map((p) => (
          <View key={p.id} style={styles.row} wrap={false}>
            {COLUMNS.map((c) => (
              <Text key={c.header} style={[styles.cell, { width: c.width }]}>
                {ar(c.render(p))}
              </Text>
            ))}
          </View>
        ))
      )}
    </View>
  )
}

export interface ProcedureCatalogPdfDocumentProps {
  assets: PdfFacilityAssets
  categories: ProcedureCategory[]
  procedures: Procedure[]
}

export function ProcedureCatalogPdfDocument({ assets, categories, procedures }: ProcedureCatalogPdfDocumentProps) {
  ensurePdfFontRegistered()

  const uncategorized = procedures.filter((p) => !p.category_id)

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <PdfWatermark assets={assets} />
        <PdfLetterheadHeader assets={assets} />

        <Text style={pdfTitleStyle}>{ar('كتالوج العمليات')}</Text>

        <View style={styles.meta}>
          <Text style={styles.metaText}>{ar(`إجمالي العمليات: ${procedures.length}`)}</Text>
          <Text style={styles.metaText}>{ar(`عدد التصنيفات: ${categories.length}`)}</Text>
          <Text style={styles.metaText}>{ar(`تاريخ الإصدار: ${formatDateTime(new Date().toISOString())}`)}</Text>
        </View>

        {categories.map((category) => (
          <View key={category.id}>
            <Text style={styles.sectionTitle}>{ar(category.name)}</Text>
            <ProcedureTable procedures={procedures.filter((p) => p.category_id === category.id)} />
          </View>
        ))}

        {uncategorized.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>{ar('بدون تصنيف')}</Text>
            <ProcedureTable procedures={uncategorized} />
          </View>
        )}

        <PdfLetterheadFooter assets={assets} />
      </Page>
    </Document>
  )
}
