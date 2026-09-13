import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import apiClient from '@/services/api'

async function extractErrorMessage(error: unknown): Promise<string> {
  const blob = (error as { response?: { data?: unknown } })?.response?.data
  if (blob instanceof Blob) {
    try {
      const parsed = JSON.parse(await blob.text())
      if (typeof parsed?.message === 'string') return parsed.message
    } catch {
      /* not JSON */
    }
  }
  return 'تعذر إنشاء ملف PDF'
}

/**
 * Fetches a server-rendered PDF as a blob and drives an inline preview modal.
 * `loadingKey` identifies which trigger is currently generating (for per-row spinners).
 */
export function usePdfPreview() {
  const [url, setUrl] = useState<string | null>(null)
  const [title, setTitle] = useState('معاينة')
  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const urlRef = useRef<string | null>(null)

  const revoke = useCallback(() => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    urlRef.current = null
  }, [])

  useEffect(() => revoke, [revoke])

  const open = useCallback(
    async (path: string, previewTitle: string, key = path) => {
      setLoadingKey(key)
      try {
        const { data } = await apiClient.get<Blob>(path, { responseType: 'blob', suppressToast: true })
        revoke()
        const objectUrl = URL.createObjectURL(data)
        urlRef.current = objectUrl
        setUrl(objectUrl)
        setTitle(previewTitle)
      } catch (error) {
        toast.error(await extractErrorMessage(error))
      } finally {
        setLoadingKey(null)
      }
    },
    [revoke],
  )

  const close = useCallback(() => {
    revoke()
    setUrl(null)
  }, [revoke])

  const isLoading = useCallback((key?: string) => loadingKey !== null && (key === undefined || loadingKey === key), [loadingKey])

  return { url, title, open, close, isLoading }
}
