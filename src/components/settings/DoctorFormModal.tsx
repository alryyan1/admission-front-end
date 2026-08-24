import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Modal, Row, Col, Input, Select, Typography, Space } from 'antd'
import type { Doctor } from '@/types/patient'
import { getTeamRoles } from '@/services/teamRoleService'

const { Text } = Typography

interface DoctorFormModalProps {
  open: boolean
  onClose: () => void
  doctor: Doctor | null
  onSubmit: (payload: { name: string; specialist?: string; role_id: number }) => void
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

export function DoctorFormModal({ open, onClose, doctor, onSubmit, isSubmitting }: DoctorFormModalProps) {
  const [name, setName] = useState('')
  const [specialist, setSpecialist] = useState('')
  const [roleId, setRoleId] = useState<number | undefined>(undefined)

  const teamRolesQuery = useQuery({ queryKey: ['team-roles'], queryFn: getTeamRoles, enabled: open })
  const surgeonRoleId = teamRolesQuery.data?.find((r) => r.slug === 'surgeon')?.id

  useEffect(() => {
    if (!open) return
    setName(doctor?.name ?? '')
    setSpecialist(doctor?.specialist ?? '')
    setRoleId(doctor?.role_id)
  }, [open, doctor])

  useEffect(() => {
    if (!open || doctor || roleId !== undefined) return
    if (surgeonRoleId !== undefined) setRoleId(surgeonRoleId)
  }, [open, doctor, roleId, surgeonRoleId])

  function handleSubmit() {
    if (!name.trim() || !roleId) return
    onSubmit({
      name,
      specialist: specialist || undefined,
      role_id: roleId,
    })
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={doctor ? 'تعديل الطبيب' : 'طبيب جديد'}
      okText="حفظ"
      cancelText="إلغاء"
      onOk={handleSubmit}
      confirmLoading={isSubmitting}
      okButtonProps={{ disabled: !name.trim() || !roleId }}
    >
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <FieldLabel label="الاسم">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </FieldLabel>
        </Col>
        <Col span={24}>
          <FieldLabel label="الدور">
            <Select
              style={{ width: '100%' }}
              value={roleId}
              onChange={setRoleId}
              loading={teamRolesQuery.isLoading}
              options={(teamRolesQuery.data ?? []).map((r) => ({ label: r.name, value: r.id }))}
            />
          </FieldLabel>
        </Col>
        <Col span={24}>
          <FieldLabel label="التخصص">
            <Input value={specialist} onChange={(e) => setSpecialist(e.target.value)} />
          </FieldLabel>
        </Col>
      </Row>
    </Modal>
  )
}
