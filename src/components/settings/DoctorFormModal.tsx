import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Modal, Row, Col, Input, Select, Typography, Space, Button, Divider } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { toast } from 'sonner'
import type { Doctor } from '@/types/patient'
import type { Specialist } from '@/types/admission'
import { getTeamRoles } from '@/services/teamRoleService'
import { createSpecialist, getSpecialists } from '@/services/specialistService'

const { Text } = Typography

interface DoctorFormModalProps {
  open: boolean
  onClose: () => void
  doctor: Doctor | null
  onSubmit: (payload: { name: string; specialist_id?: number | null; role_id: number }) => void
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
  const [specialistId, setSpecialistId] = useState<number | undefined>(undefined)
  const [roleId, setRoleId] = useState<number | undefined>(undefined)
  const [newSpecialistName, setNewSpecialistName] = useState('')

  const queryClient = useQueryClient()
  const teamRolesQuery = useQuery({ queryKey: ['team-roles'], queryFn: getTeamRoles, enabled: open })
  const specialistsQuery = useQuery({ queryKey: ['specialists'], queryFn: getSpecialists, enabled: open })
  const surgeonRoleId = teamRolesQuery.data?.find((r) => r.slug === 'surgeon')?.id

  const createSpecialistMutation = useMutation({
    mutationFn: createSpecialist,
    onSuccess: (specialist: Specialist) => {
      queryClient.setQueryData<Specialist[]>(['specialists'], (prev) =>
        prev ? [...prev, specialist].sort((a, b) => a.name.localeCompare(b.name)) : [specialist],
      )
      setSpecialistId(specialist.id)
      setNewSpecialistName('')
    },
    onError: () => {
      toast.error('تعذر إضافة التخصص')
    },
  })

  useEffect(() => {
    if (!open) return
    setName(doctor?.name ?? '')
    setSpecialistId(doctor?.specialist_id ?? undefined)
    setRoleId(doctor?.role_id)
    setNewSpecialistName('')
  }, [open, doctor])

  useEffect(() => {
    if (!open || doctor || roleId !== undefined) return
    if (surgeonRoleId !== undefined) setRoleId(surgeonRoleId)
  }, [open, doctor, roleId, surgeonRoleId])

  function handleAddSpecialist() {
    const trimmed = newSpecialistName.trim()
    if (!trimmed || createSpecialistMutation.isPending) return
    createSpecialistMutation.mutate(trimmed)
  }

  function handleSubmit() {
    if (!name.trim() || !roleId) return
    onSubmit({
      name,
      specialist_id: specialistId ?? null,
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
            <Select
              style={{ width: '100%' }}
              allowClear
              placeholder="بدون تخصص"
              value={specialistId}
              onChange={(v) => setSpecialistId(v ?? undefined)}
              loading={specialistsQuery.isLoading}
              options={(specialistsQuery.data ?? []).map((s) => ({ label: s.name, value: s.id }))}
              popupRender={(menu) => (
                <>
                  {menu}
                  <Divider style={{ margin: '8px 0' }} />
                  <Space style={{ padding: '0 8px 4px' }}>
                    <Input
                      placeholder="تخصص جديد"
                      value={newSpecialistName}
                      onChange={(e) => setNewSpecialistName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddSpecialist()
                        }
                      }}
                    />
                    <Button
                      type="text"
                      icon={<PlusOutlined />}
                      loading={createSpecialistMutation.isPending}
                      onClick={handleAddSpecialist}
                      disabled={!newSpecialistName.trim()}
                    >
                      إضافة
                    </Button>
                  </Space>
                </>
              )}
            />
          </FieldLabel>
        </Col>
      </Row>
    </Modal>
  )
}
