import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ConfigProvider, Card, Typography, Button, Input, Space, Tag, Descriptions, Table, Popconfirm } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { MessageCircle, Send, Users } from 'lucide-react'
import { toast } from 'sonner'
import { useAntTheme } from '@/lib/antdTheme'
import {
  getWhatsAppSettings,
  sendWhatsAppTestMessage,
  getWhatsAppRecipients,
  addWhatsAppRecipient,
  removeWhatsAppRecipient,
  type WhatsAppRecipient,
} from '@/services/whatsappService'

const { Title, Text } = Typography

export function WhatsAppSettingsPage() {
  const antTheme = useAntTheme()
  const queryClient = useQueryClient()
  const [testPhone, setTestPhone] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [recipientLabel, setRecipientLabel] = useState('')

  const settingsQuery = useQuery({ queryKey: ['whatsapp-settings'], queryFn: getWhatsAppSettings })
  const recipientsQuery = useQuery({ queryKey: ['whatsapp-recipients'], queryFn: getWhatsAppRecipients })

  const sendTestMutation = useMutation({
    mutationFn: () => sendWhatsAppTestMessage(testPhone),
    onSuccess: () => {
      toast.success('تم إرسال رسالة Hello World الاختبارية بنجاح')
    },
  })

  const addRecipientMutation = useMutation({
    mutationFn: () => addWhatsAppRecipient({ phone: recipientPhone, label: recipientLabel || undefined }),
    onSuccess: () => {
      toast.success('تمت إضافة الرقم')
      setRecipientPhone('')
      setRecipientLabel('')
      queryClient.invalidateQueries({ queryKey: ['whatsapp-recipients'] })
    },
  })

  const removeRecipientMutation = useMutation({
    mutationFn: (id: number) => removeWhatsAppRecipient(id),
    onSuccess: () => {
      toast.success('تم حذف الرقم')
      queryClient.invalidateQueries({ queryKey: ['whatsapp-recipients'] })
    },
  })

  const recipientColumns: ColumnsType<WhatsAppRecipient> = [
    { title: 'الاسم', dataIndex: 'label', key: 'label', render: (v) => v ?? '—' },
    {
      title: 'رقم الهاتف',
      dataIndex: 'phone',
      key: 'phone',
      render: (v: string) => (
        <span dir="ltr" style={{ display: 'inline-block' }}>
          {v}
        </span>
      ),
    },
    {
      title: '',
      key: 'actions',
      render: (_, recipient) => (
        <Popconfirm title="حذف هذا الرقم؟" onConfirm={() => removeRecipientMutation.mutate(recipient.id)}>
          <Button size="small" danger loading={removeRecipientMutation.isPending && removeRecipientMutation.variables === recipient.id}>
            حذف
          </Button>
        </Popconfirm>
      ),
    },
  ]

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

      <Card
        title={
          <Space>
            <Users size={18} />
            أرقام استلام ملفات الفريق الطبي (PDF)
          </Space>
        }
        style={{ marginTop: 16 }}
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Text type="secondary">
            كل رقم مُضاف هنا سيستلم نسخة PDF من فريق العملية عند إرسالها عبر واتساب.
          </Text>
          <Space.Compact style={{ width: '100%', maxWidth: 480 }}>
            <Input
              placeholder="اسم (اختياري)"
              style={{ maxWidth: 160 }}
              value={recipientLabel}
              onChange={(e) => setRecipientLabel(e.target.value)}
            />
            <Input
              placeholder="رقم الهاتف"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              onPressEnter={() => recipientPhone.trim() && addRecipientMutation.mutate()}
            />
            <Button
              type="primary"
              loading={addRecipientMutation.isPending}
              disabled={!recipientPhone.trim()}
              onClick={() => addRecipientMutation.mutate()}
            >
              إضافة
            </Button>
          </Space.Compact>

          <Table
            rowKey="id"
            size="small"
            loading={recipientsQuery.isLoading}
            columns={recipientColumns}
            dataSource={recipientsQuery.data ?? []}
            pagination={false}
            locale={{ emptyText: 'لا توجد أرقام مضافة' }}
          />
        </Space>
      </Card>
    </ConfigProvider>
  )
}
