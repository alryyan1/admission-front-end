import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, Flex, Switch, Typography } from 'antd'
import { getFacilitySettings, updateFacilitySettings } from '@/services/facilityService'

const { Text } = Typography

/** Toggle for the optional relative-contact section on the patient registration form. */
export function PatientFormSettingsTab() {
  const queryClient = useQueryClient()

  const settingsQuery = useQuery({
    queryKey: ['facility-settings'],
    queryFn: getFacilitySettings,
  })

  const saveMutation = useMutation({
    mutationFn: updateFacilitySettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-settings'] })
    },
  })

  const settings = settingsQuery.data

  return (
    <Card title="حقول نموذج تسجيل المريض" loading={settingsQuery.isLoading}>
      <Flex vertical gap={16} style={{ maxWidth: 480 }}>
        <Flex align="center" justify="space-between">
          <div>
            <Text style={{ display: 'block' }}>بيانات شخص التواصل (قريب المريض)</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              إظهار حقول اسم وصلة ورقم هاتف وعنوان شخص التواصل عند تسجيل مريض جديد
            </Text>
          </div>
          <Switch
            checked={settings?.show_patient_relative_fields ?? false}
            loading={saveMutation.isPending}
            onChange={(checked) => saveMutation.mutate({ showPatientRelativeFields: checked })}
          />
        </Flex>
        <Flex align="center" justify="space-between">
          <div>
            <Text style={{ display: 'block' }}>بيانات التأمين</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              إظهار حقول شركة التأمين ورقم البطاقة والشركة الفرعية وصلة القرابة بالعائل عند تسجيل مريض جديد
            </Text>
          </div>
          <Switch
            checked={settings?.show_insurance_fields ?? true}
            loading={saveMutation.isPending}
            onChange={(checked) => saveMutation.mutate({ showInsuranceFields: checked })}
          />
        </Flex>
      </Flex>
    </Card>
  )
}
