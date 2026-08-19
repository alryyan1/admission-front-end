import { useEffect, useState } from 'react'
import { Modal, Row, Col, Input, Select, Switch, Typography, Space } from 'antd'
import type { Procedure, ProcedureCategory } from '@/types/admission'

const { Text } = Typography
const { TextArea } = Input

interface ProcedureFormModalProps {
  open: boolean
  onClose: () => void
  procedure: Procedure | null
  categories: ProcedureCategory[]
  onSubmit: (payload: {
    category_id?: number | null
    name_ar: string
    name_en?: string
    type?: string
    description?: string
    is_active?: boolean
  }) => void
  isSubmitting: boolean
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Space direction="vertical" size={4} style={{ width: '100%' }}>
      <Text style={{ fontSize: 12 }} type="secondary">
        {label}
      </Text>
      {children}
    </Space>
  )
}

export function ProcedureFormModal({
  open,
  onClose,
  procedure,
  categories,
  onSubmit,
  isSubmitting,
}: ProcedureFormModalProps) {
  const [nameAr, setNameAr] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined)
  const [type, setType] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (!open) return
    setNameAr(procedure?.name_ar ?? '')
    setNameEn(procedure?.name_en ?? '')
    setCategoryId(procedure?.category_id ?? undefined)
    setType(procedure?.type ?? '')
    setDescription(procedure?.description ?? '')
    setIsActive(procedure?.is_active ?? true)
  }, [open, procedure])

  function handleSubmit() {
    if (!nameAr.trim()) return
    onSubmit({
      name_ar: nameAr,
      name_en: nameEn || undefined,
      category_id: categoryId ?? null,
      type: type || undefined,
      description: description || undefined,
      is_active: isActive,
    })
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={procedure ? 'تعديل العملية' : 'عملية جديدة'}
      okText="حفظ"
      cancelText="إلغاء"
      onOk={handleSubmit}
      confirmLoading={isSubmitting}
      okButtonProps={{ disabled: !nameAr.trim() }}
    >
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <FieldLabel label="الاسم بالعربية">
            <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
          </FieldLabel>
        </Col>
        <Col span={24}>
          <FieldLabel label="الاسم بالإنجليزية">
            <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
          </FieldLabel>
        </Col>
        <Col xs={24} md={12}>
          <FieldLabel label="التصنيف">
            <Select
              style={{ width: '100%' }}
              allowClear
              placeholder="بدون تصنيف"
              value={categoryId}
              onChange={(v) => setCategoryId(v ?? undefined)}
              options={categories.map((c) => ({ label: c.name, value: c.id }))}
            />
          </FieldLabel>
        </Col>
        <Col xs={24} md={12}>
          <FieldLabel label="النوع (اختياري)">
            <Input value={type} onChange={(e) => setType(e.target.value)} placeholder="جراحية / تشخيصية" />
          </FieldLabel>
        </Col>
        <Col span={24}>
          <FieldLabel label="الوصف">
            <TextArea value={description} onChange={(e) => setDescription(e.target.value)} autoSize={{ minRows: 2 }} />
          </FieldLabel>
        </Col>
        <Col span={24}>
          <Space>
            <Switch checked={isActive} onChange={setIsActive} />
            <Text>فعّالة</Text>
          </Space>
        </Col>
      </Row>
    </Modal>
  )
}
