import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ConfigProvider, Card, Input, Button, Table, Tag, Switch, Popconfirm, Typography, Row, Col, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useAntTheme } from '@/lib/antdTheme'
import {
  getServiceCategories,
  createServiceCategory,
  updateServiceCategory,
  deleteServiceCategory,
  getServices,
  createService,
  updateService,
  deleteService,
} from '@/services/serviceService'
import { InlineEditableField } from '@/components/patients/InlineEditableField'
import { ServiceFormModal } from '@/components/settings/ServiceFormModal'
import type { Service } from '@/types/service'
import { formatNumber } from '@/lib/utils'

const { Title, Text } = Typography

export function ServiceCatalogSettingsPage() {
  const antTheme = useAntTheme()
  const queryClient = useQueryClient()
  const [newCategoryName, setNewCategoryName] = useState('')
  const [serviceModal, setServiceModal] = useState<{ open: boolean; service: Service | null }>({
    open: false,
    service: null,
  })

  const categoriesQuery = useQuery({ queryKey: ['service-categories'], queryFn: getServiceCategories })
  const servicesQuery = useQuery({ queryKey: ['services'], queryFn: () => getServices() })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['service-categories'] })
    queryClient.invalidateQueries({ queryKey: ['services'] })
  }

  const addCategoryMutation = useMutation({
    mutationFn: createServiceCategory,
    onSuccess: () => {
      toast.success('تمت إضافة التصنيف')
      setNewCategoryName('')
      invalidate()
    },
  })

  const renameCategoryMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => updateServiceCategory(id, name),
    onSuccess: invalidate,
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteServiceCategory,
    onSuccess: () => {
      toast.success('تم حذف التصنيف')
      invalidate()
    },
  })

  const saveServiceMutation = useMutation({
    mutationFn: (payload: Parameters<typeof createService>[0] & { id?: number }) => {
      const { id, ...data } = payload
      return id ? updateService(id, data) : createService(data)
    },
    onSuccess: () => {
      toast.success('تم حفظ الخدمة')
      invalidate()
      setServiceModal({ open: false, service: null })
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) => updateService(id, { is_active }),
    onSuccess: invalidate,
  })

  const deleteServiceMutation = useMutation({
    mutationFn: deleteService,
    onSuccess: () => {
      toast.success('تم حذف الخدمة')
      invalidate()
    },
  })

  const columns: ColumnsType<Service> = [
    { title: 'الاسم بالعربية', dataIndex: 'name_ar', key: 'name_ar' },
    { title: 'الاسم بالإنجليزية', dataIndex: 'name_en', key: 'name_en', render: (v) => v ?? '—' },
    {
      title: 'التصنيف',
      key: 'category',
      render: (_, s) => (s.category ? <Tag>{s.category.name}</Tag> : '—'),
    },
    {
      title: 'السعر',
      dataIndex: 'price',
      key: 'price',
      render: (v: string) => formatNumber(v),
    },
    {
      title: 'الحالة',
      key: 'is_active',
      render: (_, s) => (
        <Switch
          checked={s.is_active}
          size="small"
          onChange={(checked) => toggleActiveMutation.mutate({ id: s.id, is_active: checked })}
        />
      ),
    },
    {
      title: '',
      key: 'actions',
      render: (_, s) => (
        <Space size={4}>
          <Button size="small" onClick={() => setServiceModal({ open: true, service: s })}>
            تعديل
          </Button>
          <Popconfirm
            title="حذف الخدمة؟"
            description="لا يمكن التراجع عن هذا الإجراء."
            onConfirm={() => deleteServiceMutation.mutate(s.id)}
          >
            <Button size="small" danger>
              حذف
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <ConfigProvider direction="rtl" theme={antTheme}>
      <Title level={3} style={{ margin: '0 0 16px' }}>
        كتالوج الخدمات
      </Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={7}>
          <Card title="التصنيفات">
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              {(categoriesQuery.data ?? []).map((category) => (
                <Row key={category.id} justify="space-between" align="middle">
                  <Col>
                    <InlineEditableField
                      editable
                      value={category.name}
                      onSave={async (v) => {
                        await renameCategoryMutation.mutateAsync({ id: category.id, name: String(v ?? '') })
                      }}
                    />
                  </Col>
                  <Col>
                    <Popconfirm
                      title="حذف التصنيف؟"
                      description="ستصبح الخدمات التابعة له بدون تصنيف."
                      onConfirm={() => deleteCategoryMutation.mutate(category.id)}
                    >
                      <Button size="small" type="text" danger>
                        حذف
                      </Button>
                    </Popconfirm>
                  </Col>
                </Row>
              ))}
              {(categoriesQuery.data ?? []).length === 0 && <Text type="secondary">لا توجد تصنيفات بعد</Text>}
            </Space>

            <Space.Compact style={{ width: '100%', marginTop: 16 }}>
              <Input
                placeholder="تصنيف جديد"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onPressEnter={() => newCategoryName.trim() && addCategoryMutation.mutate(newCategoryName)}
              />
              <Button
                type="primary"
                loading={addCategoryMutation.isPending}
                disabled={!newCategoryName.trim()}
                onClick={() => addCategoryMutation.mutate(newCategoryName)}
              >
                إضافة
              </Button>
            </Space.Compact>
          </Card>
        </Col>

        <Col xs={24} md={17}>
          <Card
            title="الخدمات"
            extra={
              <Button type="primary" onClick={() => setServiceModal({ open: true, service: null })}>
                + خدمة جديدة
              </Button>
            }
          >
            <Table
              rowKey="id"
              loading={servicesQuery.isLoading}
              columns={columns}
              dataSource={servicesQuery.data ?? []}
              pagination={false}
            />
          </Card>
        </Col>
      </Row>

      <ServiceFormModal
        open={serviceModal.open}
        onClose={() => setServiceModal({ open: false, service: null })}
        service={serviceModal.service}
        categories={categoriesQuery.data ?? []}
        onSubmit={(payload) => saveServiceMutation.mutate({ ...payload, id: serviceModal.service?.id })}
        isSubmitting={saveServiceMutation.isPending}
      />
    </ConfigProvider>
  )
}
