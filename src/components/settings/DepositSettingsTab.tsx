import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, Checkbox, Button, Space, Typography } from 'antd'
import { getDepositSetting, updateDepositSetting } from '@/services/admissionService'

const { Text } = Typography

export function DepositSettingsTab() {
  const queryClient = useQueryClient()
  const settingQuery = useQuery({
    queryKey: ['deposit-setting'],
    queryFn: getDepositSetting,
  })

  const [requireBalance, setRequireBalance] = useState(false)

  useEffect(() => {
    if (!settingQuery.data) return
    setRequireBalance(settingQuery.data.require_balance_for_deposit)
  }, [settingQuery.data])

  const saveMutation = useMutation({
    mutationFn: updateDepositSetting,
    onSuccess: () => {
      toast.success('تم حفظ الإعدادات')
      queryClient.invalidateQueries({ queryKey: ['deposit-setting'] })
    },
  })

  function handleSave() {
    saveMutation.mutate({ require_balance_for_deposit: requireBalance })
  }

  return (
    <Card title="الدفعات" loading={settingQuery.isLoading}>
      <Space direction="vertical" size={16} style={{ width: '100%', maxWidth: 480 }}>
        <Checkbox checked={requireBalance} onChange={(e) => setRequireBalance(e.target.checked)}>
          منع إضافة دفعة إذا لم يكن على المريض رصيد مستحق
        </Checkbox>
        <Text style={{ fontSize: 12 }} type="secondary">
          عند التفعيل، لن يمكن تسجيل دفعة جديدة على التنويم إلا إذا كان إجمالي الخدمات والعمليات أكبر من الدفعات
          المسجلة.
        </Text>

        <Button type="primary" onClick={handleSave} loading={saveMutation.isPending}>
          حفظ
        </Button>
      </Space>
    </Card>
  )
}
