import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ConfigProvider, Card, Typography, Button, Input, Space, Tag, Descriptions } from 'antd'
import { MessageCircle, Send } from 'lucide-react'
import { toast } from 'sonner'
import { useAntTheme } from '@/lib/antdTheme'
import { getWhatsAppSettings, sendWhatsAppTestMessage } from '@/services/whatsappService'

const { Title, Text } = Typography

export function WhatsAppSettingsPage() {
  const antTheme = useAntTheme()
  const [testPhone, setTestPhone] = useState('')

  const settingsQuery = useQuery({ queryKey: ['whatsapp-settings'], queryFn: getWhatsAppSettings })

  const sendTestMutation = useMutation({
    mutationFn: () => sendWhatsAppTestMessage(testPhone),
    onSuccess: () => {
      toast.success('تم إرسال رسالة Hello World الاختبارية بنجاح')
    },
  })

  const settings = settingsQuery.data

  return (
    <ConfigProvider direction="rtl" theme={antTheme}>
      <Title level={3} style={{ margin: '0 0 16px' }}>
        واتساب
      </Title>

      <Card
        title={
          <Space>
            <MessageCircle size={18} />
            رقم الواتساب المستخدم حالياً
          </Space>
        }
        loading={settingsQuery.isLoading}
        style={{ marginBottom: 16 }}
      >
        {settings?.configured ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="الحالة">
              <Tag color="success">مفعّل</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="رقم الواتساب">
              <span dir="ltr" style={{ display: 'inline-block' }}>
                {settings.display_phone_number ?? '—'}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="اسم الحساب الموثّق">
              <span dir="ltr" style={{ display: 'inline-block' }}>
                {settings.verified_name ?? '—'}
              </span>
            </Descriptions.Item>
            {settings.quality_rating && (
              <Descriptions.Item label="تقييم جودة الحساب">
                <span dir="ltr" style={{ display: 'inline-block' }}>
                  {settings.quality_rating}
                </span>
              </Descriptions.Item>
            )}
            {settings.error && (
              <Descriptions.Item label="تنبيه">
                <Text type="warning">تعذر جلب تفاصيل الرقم من Meta: {settings.error}</Text>
              </Descriptions.Item>
            )}
          </Descriptions>
        ) : (
          <Tag color="error">غير مفعّل — لم يتم ضبط بيانات واتساب في إعدادات الخادم</Tag>
        )}
      </Card>

      <Card
        title={
          <Space>
            <Send size={18} />
            إرسال رسالة اختبارية (قالب Hello World)
          </Space>
        }
      >
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Text>
            يرسل هذا الإجراء قالب <code>hello_world</code> الجاهز من Meta للتأكد من عمل الربط مع واتساب.
          </Text>
          <Space.Compact style={{ width: '100%', maxWidth: 360 }}>
            <Input
              placeholder="رقم الهاتف (مثال: 01012345678)"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              onPressEnter={() => testPhone.trim() && sendTestMutation.mutate()}
            />
            <Button
              type="primary"
              icon={<Send size={14} />}
              loading={sendTestMutation.isPending}
              disabled={!testPhone.trim() || !settings?.configured}
              onClick={() => sendTestMutation.mutate()}
            >
              إرسال
            </Button>
          </Space.Compact>
        </Space>
      </Card>
    </ConfigProvider>
  )
}
