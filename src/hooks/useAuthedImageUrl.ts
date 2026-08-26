import { useEffect, useState } from 'react'
import { getFacilityLogoBlob, getFacilityStampBlob, getFacilityWatermarkBlob } from '@/services/facilityService'

export function useAuthedImageUrl(kind: 'logo' | 'stamp' | 'watermark', cacheKey: string | null) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!cacheKey) {
      setUrl(null)
      return
    }
    let cancelled = false
    let objectUrl: string | null = null

    ;(async () => {
      try {
        const blob =
          kind === 'logo' ? await getFacilityLogoBlob() : kind === 'stamp' ? await getFacilityStampBlob() : await getFacilityWatermarkBlob()
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      } catch {
        if (!cancelled) setUrl(null)
      }
    })()

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [kind, cacheKey])

  return url
}
