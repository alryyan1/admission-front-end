import { useEffect, useState } from 'react'
import { Modal, Row, Col, Input, Select, Switch, Typography, Space, Checkbox, Divider } from 'antd'
import { ROLE_OPTIONS } from '@/lib/roles'
import { filterNavItemsByRole, navSections } from '@/lib/navigation'
import { permissionOptions } from '@/lib/permissions'
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
  const [restrictPages, setRestrictPages] = useState(false)
  const [allowedPages, setAllowedPages] = useState<string[]>([])
  const [permissions, setPermissions] = useState<string[]>([])

  useEffect(() => {
    if (!open) return
    setName(user?.name ?? '')
    setUsername(user?.username ?? '')
    setPassword('')
    setRole(user?.role ?? 'nurse')
    setIsActive(user?.is_active ?? true)
    setRestrictPages(user?.allowed_pages !== null && user?.allowed_pages !== undefined)
    setAllowedPages(user?.allowed_pages ?? [])
    setPermissions(user?.permissions ?? [])
  }, [open, user])

  function handleSubmit() {
    if (!name.trim() || !username.trim() || !role) return
    if (!user && !password.trim()) return
    onSubmit({
      name,
      username,
      role,
      is_active: isActive,
      ...(isSelf ? {} : { allowed_pages: restrictPages ? allowedPages : null }),
      permissions,
      ...(password.trim() ? { password } : {}),
    })
  }

  function togglePermission(key: string, checked: boolean) {
    setPermissions((current) => (checked ? [...current, key] : current.filter((entry) => entry !== key)))
  }

  function toggleAllowedPage(path: string, checked: boolean) {
    setAllowedPages((current) =>
      checked ? [...current, path] : current.filter((entry) => entry !== path),
    )
  }

  // Drop selections that the chosen role no longer has access to (e.g. switching
  // away from admin hides the settings pages, so a stale selection there is pruned).
  useEffect(() => {
    const validPaths = new Set(
      navSections.flatMap((section) => filterNavItemsByRole(section.items, role)).map((item) => item.to),
    )
    setAllowedPages((current) => current.filter((path) => validPaths.has(path)))
  }, [role])

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
        <Col span={24}>
          <Divider style={{ margin: '4px 0' }} />
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Space>
              <Switch checked={restrictPages} onChange={setRestrictPages} disabled={isSelf} />
              <Text>تقييد الصفحات المرئية في القائمة الجانبية</Text>
            </Space>
            {isSelf && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                لا يمكنك تقييد صفحاتك الخاصة.
              </Text>
            )}
            {restrictPages && !isSelf && (
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                {navSections.map((section) => {
                  const items = filterNavItemsByRole(section.items, role)
                  if (items.length === 0) return null
                  return (
                    <div key={section.key}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {section.label}
                      </Text>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', marginTop: 4 }}>
                        {items.map((item) => (
                          <Checkbox
                            key={item.to}
                            checked={allowedPages.includes(item.to)}
                            onChange={(e) => toggleAllowedPage(item.to, e.target.checked)}
                          >
                            {item.label}
                          </Checkbox>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </Space>
            )}
          </Space>
        </Col>
        <Col span={24}>
          <Divider style={{ margin: '4px 0' }} />
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              صلاحيات إضافية
            </Text>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
              {permissionOptions.map((permission) => (
                <Checkbox
                  key={permission.key}
                  checked={permissions.includes(permission.key)}
                  onChange={(e) => togglePermission(permission.key, e.target.checked)}
                >
                  {permission.label}
                </Checkbox>
              ))}
            </div>
          </Space>
        </Col>
      </Row>
    </Modal>
  )
}
