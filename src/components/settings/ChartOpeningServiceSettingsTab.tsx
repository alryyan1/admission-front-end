import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, Select, Checkbox, Button, Space, Typography } from 'antd'
import { getServices, getChartOpeningServiceSetting, updateChartOpeningServiceSetting } from '@/services/serviceService'

const { Text } = Typography

export function ChartOpeningServiceSettingsTab() {
  const queryClient = useQueryClient()
  const servicesQuery = useQuery({
    queryKey: ['services', 'active'],
    queryFn: () => getServices({ active_only: true }),
  })
  const settingQuery = useQuery({
    queryKey: ['chart-opening-service-setting'],
    queryFn: getChartOpeningServiceSetting,
  })

  const [serviceId, setServiceId] = useState<number | undefined>(undefined)
  const [autoAdd, setAutoAdd] = useState(false)
  const [applyToShortStay, setApplyToShortStay] = useState(false)

  useEffect(() => {
    if (!settingQuery.data) return
    setServiceId(settingQuery.data.service_id ?? undefined)
    setAutoAdd(settingQuery.data.auto_add)
    setApplyToShortStay(settingQuery.data.apply_to_short_stay)
  }, [settingQuery.data])

  const saveMutation = useMutation({
    mutationFn: updateChartOpeningServiceSetting,
    onSuccess: () => {
      toast.success('تم حفظ الإعدادات')
      queryClient.invalidateQueries({ queryKey: ['chart-opening-service-setting'] })
    },
  })

  function handleSave() {
    saveMutation.mutate({
      service_id: serviceId ?? null,
      auto_add: autoAdd,
      apply_to_short_stay: applyToShortStay,
    })
  }

  return (
    <Card title="خدمة فتح الملف" loading={settingQuery.isLoading}>
      <Space direction="vertical" size={16} style={{ width: '100%', maxWidth: 480 }}>
        <div>
          <Text style={{ fontSize: 13, display: 'block', marginBottom: 4 }} type="secondary">
            الخدمة
          </Text>
          <Select
            style={{ width: '100%' }}
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="اختر الخدمة التي تمثل فتح الملف"
            loading={servicesQuery.isLoading}
            value={serviceId}
            onChange={(v) => setServiceId(v ?? undefined)}
            options={(servicesQuery.data ?? []).map((s) => ({ label: s.name_ar, value: s.id }))}
          />
        </div>

        <Checkbox checked={autoAdd} onChange={(e) => setAutoAdd(e.target.checked)}>
          إضافة خدمة فتح الملف تلقائياً (تفعيل)
        </Checkbox>

        {autoAdd && (
          <Checkbox
            checked={applyToShortStay}
            onChange={(e) => setApplyToShortStay(e.target.checked)}
            style={{ marginInlineStart: 24 }}
          >
            إضافة لمرضى الإقامة القصيرة
          </Checkbox>
        )}

        <Button
          type="primary"
          onClick={handleSave}
          loading={saveMutation.isPending}
          disabled={autoAdd && !serviceId}
        >
          حفظ
        </Button>
      </Space>
    </Card>
  )
}
