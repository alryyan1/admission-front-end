import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, Button, Flex, Form, Input, Typography } from 'antd'
import { Save } from 'lucide-react'
import { getFacilitySettings, updateFacilitySettings } from '@/services/facilityService'
import { useAuthedImageUrl } from '@/hooks/useAuthedImageUrl'
import { FacilityPdfPreview } from '@/components/settings/FacilityPdfPreview'

const { Text } = Typography

interface FacilityInfoFormValues {
  name: string | null
  phone: string | null
  email: string | null
  address: string | null
}

export function FacilityInfoSettingsTab() {
  const queryClient = useQueryClient()
  const [form] = Form.useForm<FacilityInfoFormValues>()

  const settingsQuery = useQuery({
    queryKey: ['facility-settings'],
    queryFn: getFacilitySettings,
  })

  const saveMutation = useMutation({
    mutationFn: updateFacilitySettings,
    onSuccess: () => {
      toast.success('تم الحفظ')
      queryClient.invalidateQueries({ queryKey: ['facility-settings'] })
    },
  })

  const settings = settingsQuery.data
  const logoBlobUrl = useAuthedImageUrl('logo', settings?.logo_path ?? null)
  const stampBlobUrl = useAuthedImageUrl('stamp', settings?.stamp_path ?? null)
  const watermarkBlobUrl = useAuthedImageUrl('watermark', settings?.watermark_path ?? null)

  useEffect(() => {
    if (!settings) return
    form.setFieldsValue({
      name: settings.name,
      phone: settings.phone,
      email: settings.email,
      address: settings.address,
    })
  }, [settings, form])

  return (
    <Card title="معلومات المنشأة" loading={settingsQuery.isLoading}>
      <Flex gap={24} wrap="wrap" align="flex-start">
        <div style={{ flex: '1 1 360px' }}>
          <Form form={form} layout="vertical" onFinish={(values) => saveMutation.mutate(values)}>
            <Form.Item name="name" label="اسم المنشأة">
              <Input placeholder="اسم المنشأة الطبية" />
            </Form.Item>
            <Form.Item name="phone" label="الهاتف">
              <Input placeholder="رقم الهاتف" />
            </Form.Item>
            <Form.Item name="email" label="البريد الإلكتروني">
              <Input placeholder="example@facility.com" />
            </Form.Item>
            <Form.Item name="address" label="العنوان">
              <Input placeholder="عنوان المنشأة" />
            </Form.Item>
            <Button type="primary" htmlType="submit" icon={<Save className="h-4 w-4" />} loading={saveMutation.isPending}>
              حفظ المعلومات
            </Button>
          </Form>
        </div>

        <div style={{ width: 420, maxWidth: '100%' }}>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
            معاينة شكل المستندات (A4)
          </Text>
          <div style={{ border: '1px solid var(--ant-color-border)', borderRadius: 8, overflow: 'hidden' }}>
            <FacilityPdfPreview
              logoSrc={logoBlobUrl}
              stampSrc={stampBlobUrl}
              watermarkSrc={watermarkBlobUrl}
              useLogo={settings?.use_logo ?? true}
              useStamp={settings?.use_stamp ?? true}
              useWatermark={settings?.use_watermark ?? false}
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
