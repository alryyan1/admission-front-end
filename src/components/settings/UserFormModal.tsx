import { useEffect, useState } from 'react'
import { Modal, Row, Col, Input, Select, Switch, Typography, Space } from 'antd'
import { ROLE_OPTIONS } from '@/lib/roles'
import type { User, UserRole } from '@/types/auth'
import type { UserPayload } from '@/services/userService'

const { Text } = Typography

interface UserFormModalProps {
  open: boolean
  onClose: () => void
  user: User | null
  isSelf: boolean
  onSubmit: (payload: UserPayload) => void
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

export function UserFormModal({ open, onClose, user, isSelf, onSubmit, isSubmitting }: UserFormModalProps) {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole | undefined>(undefined)
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (!open) return
    setName(user?.name ?? '')
    setUsername(user?.username ?? '')
    setPassword('')
    setRole(user?.role ?? 'nurse')
    setIsActive(user?.is_active ?? true)
  }, [open, user])

  function handleSubmit() {
    if (!name.trim() || !username.trim() || !role) return
    if (!user && !password.trim()) return
    onSubmit({
      name,
      username,
      role,
      is_active: isActive,
      ...(password.trim() ? { password } : {}),
    })
  }

  const canSubmit = name.trim() && username.trim() && role && (user || password.trim())

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={user ? 'تعديل المستخدم' : 'مستخدم جديد'}
      okText="حفظ"
      cancelText="إلغاء"
      onOk={handleSubmit}
      confirmLoading={isSubmitting}
      okButtonProps={{ disabled: !canSubmit }}
    >
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <FieldLabel label="الاسم">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </FieldLabel>
        </Col>
        <Col span={24}>
          <FieldLabel label="اسم المستخدم">
            <Input value={username} onChange={(e) => setUsername(e.target.value)} />
          </FieldLabel>
        </Col>
        <Col span={24}>
          <FieldLabel label={user ? 'كلمة المرور (اتركها فارغة للإبقاء عليها)' : 'كلمة المرور'}>
            <Input.Password value={password} onChange={(e) => setPassword(e.target.value)} />
          </FieldLabel>
        </Col>
        <Col span={24}>
          <FieldLabel label="الدور">
            <Select
              style={{ width: '100%' }}
              value={role}
              onChange={setRole}
              disabled={isSelf}
              options={ROLE_OPTIONS}
            />
          </FieldLabel>
        </Col>
        <Col span={24}>
          <Space>
            <Switch checked={isActive} onChange={setIsActive} disabled={isSelf} />
            <Text>مفعّل</Text>
          </Space>
        </Col>
      </Row>
    </Modal>
  )
}
