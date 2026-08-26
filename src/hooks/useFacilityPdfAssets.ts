import { useQuery } from '@tanstack/react-query'
import { getFacilitySettings } from '@/services/facilityService'
import { useAuthedImageUrl } from '@/hooks/useAuthedImageUrl'
import type { PdfFacilityAssets } from '@/lib/pdfLetterhead'

export function useFacilityPdfAssets(): { assets: PdfFacilityAssets; isLoading: boolean } {
  const settingsQuery = useQuery({ queryKey: ['facility-settings'], queryFn: getFacilitySettings })
  const settings = settingsQuery.data

  const logoSrc = useAuthedImageUrl('logo', settings?.logo_path ?? null)
  const stampSrc = useAuthedImageUrl('stamp', settings?.stamp_path ?? null)
  const watermarkSrc = useAuthedImageUrl('watermark', settings?.watermark_path ?? null)

  return {
    assets: {
      logoSrc,
      stampSrc,
      watermarkSrc,
      useLogo: settings?.use_logo ?? true,
      useStamp: settings?.use_stamp ?? true,
      useWatermark: settings?.use_watermark ?? false,
      facilityName: settings?.name,
      facilityPhone: settings?.phone,
      facilityEmail: settings?.email,
      facilityAddress: settings?.address,
    },
    isLoading: settingsQuery.isLoading,
  }
}
