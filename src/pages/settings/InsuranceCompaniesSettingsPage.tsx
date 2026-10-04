import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ConfigProvider, Card, Input, Button, Row, Col, Space, Typography, Popconfirm } from 'antd'
import { useAntTheme } from '@/lib/antdTheme'
import {
  getInsuranceCompanies,
  createInsuranceCompany,
  updateInsuranceCompany,
  deleteInsuranceCompany,
} from '@/services/insuranceCompanyService'
import { InlineEditableField } from '@/components/patients/InlineEditableField'

const { Title, Text } = Typography

export function InsuranceCompaniesSettingsPage() {
  const antTheme = useAntTheme()
  const queryClient = useQueryClient()
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')

  const companiesQuery = useQuery({ queryKey: ['insurance-companies'], queryFn: getInsuranceCompanies })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['insurance-companies'] })
  }

  const addCompanyMutation = useMutation({
    mutationFn: createInsuranceCompany,
    onSuccess: () => {
      toast.success('تمت إضافة شركة التأمين')
      setNewName('')
      setNewPhone('')
      invalidate()
    },
  })

  const updateCompanyMutation = useMutation({
    mutationFn: ({ id, ...payload }: { id: number; name?: string; phone?: string | null }) =>
      updateInsuranceCompany(id, payload),
    onSuccess: invalidate,
  })

  const deleteCompanyMutation = useMutation({
    mutationFn: deleteInsuranceCompany,
    onSuccess: () => {
      toast.success('تم حذف شركة التأمين')
      invalidate()
    },
  })

  function submitNewCompany() {
    if (!newName.trim()) return
    addCompanyMutation.mutate({ name: newName.trim(), phone: newPhone.trim() || null })
  }

  return (
    <ConfigProvider direction="rtl" theme={antTheme}>
      <Title level={3} style={{ margin: '0 0 16px' }}>
        شركات التأمين
      </Title>

      <Card title="الشركات">
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          {(companiesQuery.data ?? []).map((company) => (
            <Row key={company.id} justify="space-between" align="middle" gutter={16}>
              <Col flex="auto">
                <Space size={16} wrap>
                  <InlineEditableField
                    editable
                    value={company.name}
                    onSave={async (v) => {
                      await updateCompanyMutation.mutateAsync({ id: company.id, name: String(v ?? '') })
                    }}
                  />
                  <InlineEditableField
                    editable
                    value={company.phone}
                    onSave={async (v) => {
                      await updateCompanyMutation.mutateAsync({ id: company.id, phone: v ? String(v) : null })
                    }}
                  />
                </Space>
              </Col>
              <Col>
                <Popconfirm
                  title="حذف شركة التأمين؟"
                  onConfirm={() => deleteCompanyMutation.mutate(company.id)}
                >
                  <Button size="small" type="text" danger>
                    حذف
                  </Button>
                </Popconfirm>
              </Col>
            </Row>
          ))}
          {(companiesQuery.data ?? []).length === 0 && <Text type="secondary">لا توجد شركات تأمين بعد</Text>}
        </Space>

        <Space.Compact style={{ width: '100%', marginTop: 16 }}>
          <Input
            placeholder="اسم شركة التأمين"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onPressEnter={submitNewCompany}
          />
          <Input
            placeholder="رقم الهاتف (اختياري)"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            onPressEnter={submitNewCompany}
          />
          <Button type="primary" loading={addCompanyMutation.isPending} disabled={!newName.trim()} onClick={submitNewCompany}>
            إضافة
          </Button>
        </Space.Compact>
      </Card>
    </ConfigProvider>
  )
}
