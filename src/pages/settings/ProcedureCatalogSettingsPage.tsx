import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ConfigProvider, Card, Input, Button, Table, Tag, Switch, Popconfirm, Typography, Row, Col, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { antTheme } from '@/lib/antdTheme'
import {
  getProcedureCategories,
  createProcedureCategory,
  updateProcedureCategory,
  deleteProcedureCategory,
  getProcedures,
  createProcedure,
  updateProcedure,
  deleteProcedure,
} from '@/services/procedureService'
import { InlineEditableField } from '@/components/patients/InlineEditableField'
import { ProcedureFormModal } from '@/components/settings/ProcedureFormModal'
import type { Procedure } from '@/types/admission'

const { Title, Text } = Typography

export function ProcedureCatalogSettingsPage() {
  const queryClient = useQueryClient()
  const [newCategoryName, setNewCategoryName] = useState('')
  const [procedureModal, setProcedureModal] = useState<{ open: boolean; procedure: Procedure | null }>({
    open: false,
    procedure: null,
  })

  const categoriesQuery = useQuery({ queryKey: ['procedure-categories'], queryFn: getProcedureCategories })
  const proceduresQuery = useQuery({ queryKey: ['procedures'], queryFn: () => getProcedures() })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['procedure-categories'] })
    queryClient.invalidateQueries({ queryKey: ['procedures'] })
  }

  const addCategoryMutation = useMutation({
    mutationFn: createProcedureCategory,
    onSuccess: () => {
      toast.success('تمت إضافة التصنيف')
      setNewCategoryName('')
      invalidate()
    },
  })

  const renameCategoryMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => updateProcedureCategory(id, name),
    onSuccess: invalidate,
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteProcedureCategory,
    onSuccess: () => {
      toast.success('تم حذف التصنيف')
      invalidate()
    },
  })

  const saveProcedureMutation = useMutation({
    mutationFn: (payload: Parameters<typeof createProcedure>[0] & { id?: number }) => {
      const { id, ...data } = payload
      return id ? updateProcedure(id, data) : createProcedure(data)
    },
    onSuccess: () => {
      toast.success('تم حفظ العملية')
      invalidate()
      setProcedureModal({ open: false, procedure: null })
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) => updateProcedure(id, { is_active }),
    onSuccess: invalidate,
  })

  const deleteProcedureMutation = useMutation({
    mutationFn: deleteProcedure,
    onSuccess: () => {
      toast.success('تم حذف العملية')
      invalidate()
    },
  })

  const columns: ColumnsType<Procedure> = [
    { title: 'الاسم بالعربية', dataIndex: 'name_ar', key: 'name_ar' },
    { title: 'الاسم بالإنجليزية', dataIndex: 'name_en', key: 'name_en', render: (v) => v ?? '—' },
    {
      title: 'التصنيف',
      key: 'category',
      render: (_, p) => (p.category ? <Tag>{p.category.name}</Tag> : '—'),
    },
    {
      title: 'الحالة',
      key: 'is_active',
      render: (_, p) => (
        <Switch
          checked={p.is_active}
          size="small"
          onChange={(checked) => toggleActiveMutation.mutate({ id: p.id, is_active: checked })}
        />
      ),
    },
    {
      title: '',
      key: 'actions',
      render: (_, p) => (
        <Space size={4}>
          <Button size="small" onClick={() => setProcedureModal({ open: true, procedure: p })}>
            تعديل
          </Button>
          <Popconfirm
            title="حذف العملية؟"
            description="لا يمكن التراجع عن هذا الإجراء."
            onConfirm={() => deleteProcedureMutation.mutate(p.id)}
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
        كتالوج العمليات
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
                      description="ستصبح العمليات التابعة له بدون تصنيف."
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
            title="العمليات"
            extra={
              <Button type="primary" onClick={() => setProcedureModal({ open: true, procedure: null })}>
                + عملية جديدة
              </Button>
            }
          >
            <Table
              rowKey="id"
              loading={proceduresQuery.isLoading}
              columns={columns}
              dataSource={proceduresQuery.data ?? []}
              pagination={false}
            />
          </Card>
        </Col>
      </Row>

      <ProcedureFormModal
        open={procedureModal.open}
        onClose={() => setProcedureModal({ open: false, procedure: null })}
        procedure={procedureModal.procedure}
        categories={categoriesQuery.data ?? []}
        onSubmit={(payload) =>
          saveProcedureMutation.mutate({ ...payload, id: procedureModal.procedure?.id })
        }
        isSubmitting={saveProcedureMutation.isPending}
      />
    </ConfigProvider>
  )
}
