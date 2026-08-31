import { View, Text, Image, StyleSheet, Font } from '@react-pdf/renderer'
import ArabicReshaper from 'arabic-reshaper'
import arialRegular from '@/assets/fonts/arial.ttf?url'

// react-pdf's font engine handles bidi reordering but not Arabic letter joining,
// so glyphs render disconnected unless pre-shaped into presentation forms first.
export function ar(text: string): string {
  return ArabicReshaper.convertArabic(text)
}

let fontRegistered = false
export function ensurePdfFontRegistered() {
  if (fontRegistered) return
  Font.register({
    family: 'Arial',
    // only a regular weight file is available; bold text renders at the same weight
    fonts: [
      { src: arialRegular, fontWeight: 'normal' },
      { src: arialRegular, fontWeight: 'bold' },
    ],
  })
  fontRegistered = true
}

export interface PdfFacilityAssets {
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

export const pdfPageStyle = { padding: 36, fontFamily: 'Arial', fontSize: 10, color: '#1f2937' } as const

export const pdfTitleStyle = {
  fontSize: 13,
  fontWeight: 'bold',
  textAlign: 'center',
  direction: 'rtl',
  marginBottom: 18,
} as const

const styles = StyleSheet.create({
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

export function PdfWatermark({ assets }: { assets: PdfFacilityAssets }) {
  if (!assets.useWatermark || !assets.watermarkSrc) return null
  return <Image src={assets.watermarkSrc} style={styles.watermark} fixed />
}

export function PdfLetterheadHeader({
  assets,
  fallbackSubtitle,
}: {
  assets: PdfFacilityAssets
  fallbackSubtitle?: string
}) {
  const showLogo = assets.useLogo && !!assets.logoSrc
  const contactLine = [assets.facilityPhone, assets.facilityEmail].filter(Boolean).join('  —  ')
  const subtitle = contactLine || fallbackSubtitle || ''

  return (
    <View style={styles.header}>
      <View style={styles.logoBox}>{showLogo && <Image src={assets.logoSrc!} style={styles.logoImg} />}</View>
      <View style={styles.nameBox}>
        <Text style={styles.facilityName}>{ar(assets.facilityName || 'اسم المنشأة الطبية')}</Text>
        {!!subtitle && <Text style={styles.facilitySub}>{ar(subtitle)}</Text>}
      </View>
      <View style={styles.headerSpacer} />
    </View>
  )
}

export function PdfLetterheadFooter({
  assets,
  fallbackAddress,
  showStamp: allowStamp = true,
}: {
  assets: PdfFacilityAssets
  fallbackAddress?: string
  showStamp?: boolean
}) {
  const showStamp = allowStamp && assets.useStamp && !!assets.stampSrc
  const address = assets.facilityAddress || fallbackAddress || ''

  return (
    <View style={styles.footer} fixed>
      <View style={styles.stampBox}>{showStamp && <Image src={assets.stampSrc!} style={styles.stampImg} />}</View>
      {!!address && <Text style={styles.footerAddress}>{ar(address)}</Text>}
    </View>
  )
}
