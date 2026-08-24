import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, Select, Checkbox, Button, Space, Typography, Row, Col } from 'antd'
import { getServices, getShortStayServiceSetting, updateShortStayServiceSetting } from '@/services/serviceService'

const { Text } = Typography

export function ShortStayServiceSettingsTab() {
  const queryClient = useQueryClient()
  const servicesQuery = useQuery({
    queryKey: ['services', 'active'],
    queryFn: () => getServices({ active_only: true }),
  })
  const settingQuery = useQuery({
    queryKey: ['short-stay-service-setting'],
    queryFn: getShortStayServiceSetting,
  })

  const [enabled, setEnabled] = useState(false)
  const [service12hId, setService12hId] = useState<number | undefined>(undefined)
  const [service24hId, setService24hId] = useState<number | undefined>(undefined)

  useEffect(() => {
    if (!settingQuery.data) return
    setEnabled(settingQuery.data.enabled)
    setService12hId(settingQuery.data.service_12h_id ?? undefined)
    setService24hId(settingQuery.data.service_24h_id ?? undefined)
  }, [settingQuery.data])

  const saveMutation = useMutation({
    mutationFn: updateShortStayServiceSetting,
    onSuccess: () => {
      toast.success('تم حفظ الإعدادات')
      queryClient.invalidateQueries({ queryKey: ['short-stay-service-setting'] })
    },
  })

  function handleSave() {
    saveMutation.mutate({
      enabled,
      service_12h_id: service12hId ?? null,
      service_24h_id: service24hId ?? null,
    })
  }

  const serviceOptions = (servicesQuery.data ?? []).map((s) => ({ label: s.name_ar, value: s.id }))

  return (
    <Card title="خدمات الإقامة القصيرة" loading={settingQuery.isLoading}>
      <Space direction="vertical" size={16} style={{ width: '100%', maxWidth: 560 }}>
        <Checkbox checked={enabled} onChange={(e) => setEnabled(e.target.checked)}>
          إضافة خدمة الإقامة القصيرة تلقائياً حسب المدة المحددة (تفعيل)
        </Checkbox>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Text style={{ fontSize: 13, display: 'block', marginBottom: 4 }} type="secondary">
              خدمة إقامة قصيرة 12 ساعة
            </Text>
            <Select
              style={{ width: '100%' }}
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="اختر الخدمة"
              loading={servicesQuery.isLoading}
              value={service12hId}
              onChange={(v) => setService12hId(v ?? undefined)}
              options={serviceOptions}
            />
          </Col>
          <Col xs={24} md={12}>
            <Text style={{ fontSize: 13, display: 'block', marginBottom: 4 }} type="secondary">
              خدمة إقامة قصيرة 24 ساعة
            </Text>
            <Select
              style={{ width: '100%' }}
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="اختر الخدمة"
              loading={servicesQuery.isLoading}
              value={service24hId}
              onChange={(v) => setService24hId(v ?? undefined)}
              options={serviceOptions}
            />
          </Col>
        </Row>

        <Button
          type="primary"
          onClick={handleSave}
          loading={saveMutation.isPending}
          disabled={enabled && !service12hId && !service24hId}
        >
          حفظ
        </Button>
      </Space>
    </Card>
  )
}
