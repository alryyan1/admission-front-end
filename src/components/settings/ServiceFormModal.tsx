import { useEffect, useState } from 'react'
import { Modal, Row, Col, Input, InputNumber, Select, Switch, Typography, Space } from 'antd'
import type { Service, ServiceCategory } from '@/types/service'

const { Text } = Typography

interface ServiceFormModalProps {
  open: boolean
  onClose: () => void
  service: Service | null
  categories: ServiceCategory[]
  onSubmit: (payload: {
    category_id?: number | null
    name_ar: string
    name_en?: string
    price: number
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

export function ServiceFormModal({ open, onClose, service, categories, onSubmit, isSubmitting }: ServiceFormModalProps) {
  const [nameAr, setNameAr] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined)
  const [price, setPrice] = useState<number | null>(0)
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (!open) return
    setNameAr(service?.name_ar ?? '')
    setNameEn(service?.name_en ?? '')
    setCategoryId(service?.category_id ?? undefined)
    setPrice(service ? Number(service.price) : 0)
    setIsActive(service?.is_active ?? true)
  }, [open, service])

  function handleSubmit() {
    if (!nameAr.trim()) return
    onSubmit({
      name_ar: nameAr,
      name_en: nameEn || undefined,
      category_id: categoryId ?? null,
      price: price ?? 0,
      is_active: isActive,
    })
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={service ? 'تعديل الخدمة' : 'خدمة جديدة'}
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
          <FieldLabel label="السعر">
            <InputNumber
              className="amount-input"
              style={{ width: '100%' }}
              min={0}
              value={price}
              onChange={(value) => setPrice(typeof value === 'number' ? value : null)}
            />
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
