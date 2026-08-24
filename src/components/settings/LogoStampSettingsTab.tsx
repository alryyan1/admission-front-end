import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, Button, Space, Typography, Flex, Switch } from 'antd'
import { Upload, Trash2 } from 'lucide-react'
import {
  getFacilitySettings,
  updateFacilitySettings,
  getFacilityLogoBlob,
  getFacilityStampBlob,
} from '@/services/facilityService'
import { FacilityPdfPreview } from '@/components/settings/FacilityPdfPreview'

const { Text } = Typography

export function useAuthedImageUrl(kind: 'logo' | 'stamp', cacheKey: string | null) {
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
        const blob = kind === 'logo' ? await getFacilityLogoBlob() : await getFacilityStampBlob()
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

function ImageSlot({
  title,
  imageUrl,
  uploading,
  useEnabled,
  onUpload,
  onRemove,
  onToggleUse,
}: {
  title: string
  imageUrl: string | null
  uploading: boolean
  useEnabled: boolean
  onUpload: (file: File) => void
  onRemove: () => void
  onToggleUse: (checked: boolean) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <Card size="small" style={{ width: 260 }}>
      <Text strong style={{ display: 'block', marginBottom: 8 }}>
        {title}
      </Text>

      <Flex
        align="center"
        justify="center"
        style={{
          height: 140,
          border: '1px dashed var(--ant-color-border)',
          borderRadius: 8,
          marginBottom: 12,
          overflow: 'hidden',
          background: 'var(--ant-color-fill-alter)',
        }}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={title} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            لا توجد صورة
          </Text>
        )}
      </Flex>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onUpload(file)
          e.target.value = ''
        }}
      />

      <Space style={{ marginBottom: 12 }}>
        <Button icon={<Upload className="h-4 w-4" />} loading={uploading} onClick={() => inputRef.current?.click()}>
          {imageUrl ? 'تغيير' : 'رفع صورة'}
        </Button>
        {imageUrl && (
          <Button danger icon={<Trash2 className="h-4 w-4" />} onClick={onRemove} disabled={uploading}>
            حذف
          </Button>
        )}
      </Space>

      <Flex align="center" justify="space-between">
        <Text style={{ fontSize: 13 }}>استخدام في المستندات</Text>
        <Switch checked={useEnabled} onChange={onToggleUse} disabled={!imageUrl || uploading} size="small" />
      </Flex>
    </Card>
  )
}

export function LogoStampSettingsTab() {
  const queryClient = useQueryClient()

  const settingsQuery = useQuery({
    queryKey: ['facility-settings'],
    queryFn: getFacilitySettings,
  })

  const saveMutation = useMutation({
    mutationFn: updateFacilitySettings,
    onSuccess: (_, variables) => {
      if (!('useLogo' in variables) && !('useStamp' in variables)) {
        toast.success('تم الحفظ')
      }
      queryClient.invalidateQueries({ queryKey: ['facility-settings'] })
    },
  })

  const settings = settingsQuery.data
  const logoBlobUrl = useAuthedImageUrl('logo', settings?.logo_path ?? null)
  const stampBlobUrl = useAuthedImageUrl('stamp', settings?.stamp_path ?? null)

  return (
    <Card title="الشعار والختم" loading={settingsQuery.isLoading}>
      <Flex gap={24} wrap="wrap" align="flex-start">
        <Flex gap={16} wrap="wrap">
          <ImageSlot
            title="شعار المنشأة"
            imageUrl={settings?.logo_url ?? null}
            uploading={saveMutation.isPending}
            useEnabled={settings?.use_logo ?? true}
            onUpload={(file) => saveMutation.mutate({ logo: file })}
            onRemove={() => saveMutation.mutate({ removeLogo: true })}
            onToggleUse={(checked) => saveMutation.mutate({ useLogo: checked })}
          />
          <ImageSlot
            title="ختم المنشأة"
            imageUrl={settings?.stamp_url ?? null}
            uploading={saveMutation.isPending}
            useEnabled={settings?.use_stamp ?? true}
            onUpload={(file) => saveMutation.mutate({ stamp: file })}
            onRemove={() => saveMutation.mutate({ removeStamp: true })}
            onToggleUse={(checked) => saveMutation.mutate({ useStamp: checked })}
          />
        </Flex>

        <div style={{ width: 420, maxWidth: '100%' }}>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
            معاينة شكل المستندات (A4)
          </Text>
          <div style={{ border: '1px solid var(--ant-color-border)', borderRadius: 8, overflow: 'hidden' }}>
            <FacilityPdfPreview
              logoSrc={logoBlobUrl}
              stampSrc={stampBlobUrl}
              useLogo={settings?.use_logo ?? true}
              useStamp={settings?.use_stamp ?? true}
              facilityName={settings?.name}
              facilityPhone={settings?.phone}
              facilityEmail={settings?.email}
              facilityAddress={settings?.address}
            />
          </div>
        </div>
      </Flex>
    </Card>
  )
}
