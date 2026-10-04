import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  Box,
  Chip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography,
} from '@mui/material'
import { FileTextOutlined } from '@ant-design/icons'
import { ConfirmRemoveButton } from '@/components/common/ConfirmRemoveButton'
import { PdfPreviewModal } from '@/components/common/PdfPreviewModal'
import { usePdfPreview } from '@/hooks/usePdfPreview'
import { getDoctors } from '@/services/patientService'
import { getTeamRoles } from '@/services/teamRoleService'
import { getPaymentMethods } from '@/services/paymentMethodService'
import { addOperationTeamMember, admissionPdfPaths, removeOperationTeamMember } from '@/services/admissionService'
import { updateTeamMemberEntitlement } from '@/services/accountantService'
import type { OperationTeamMember, TeamRole } from '@/types/admission'
import type { Doctor } from '@/types/patient'
import type { PaymentMethod } from '@/types/paymentMethod'

/** Slugs of the core roles every operation needs, added in one click by the "الافتراضي" button. */
const DEFAULT_TEAM_ROLE_SLUGS = ['surgeon', 'anesthesiologist', 'assistant_surgeon', 'circulating_nurse']

interface OperationTeamModalProps {
  open: boolean
  onClose: () => void
  operationId: number
  existingMembers?: OperationTeamMember[]
  /** Operation price (decimal string); caps the sum of entitlement amounts when provided. */
  operationPrice?: string | null
  onAdded?: () => void
}

interface MemberForm {
  role_id?: number
  doctor_id?: number
}

function EntitlementAmountCell({
  member,
  maxAmount,
  onCommit,
}: {
  member: OperationTeamMember
  maxAmount: number | null
  onCommit: (value: number | null) => void
}) {
  const [draft, setDraft] = useState(member.entitlement_amount ?? '')

  useEffect(() => {
    setDraft(member.entitlement_amount ?? '')
  }, [member.entitlement_amount])

  function commit() {
    const current = member.entitlement_amount ?? ''
    if (draft === current) return
    const value = draft.trim() === '' ? null : Number(draft)
    if (maxAmount != null && value != null && value > maxAmount + 0.001) {
      toast.error(`قيمة الاستحقاق لا يمكن أن تتجاوز المتبقي من سعر العملية (${maxAmount})`)
      setDraft(current)
      return
    }
    onCommit(value)
  }

  return (
    <TextField
      type="number"
      size="small"
      sx={{ width: 180 }}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
    />
  )
}

function MemberDoctorCell({
  member,
  doctors,
  onCommit,
}: {
  member: OperationTeamMember
  doctors: Doctor[]
  onCommit: (doctorId: number | null) => void
}) {
  return (
    <Autocomplete<Doctor>
      size="small"
      sx={{ minWidth: 180 }}
      options={doctors}
      getOptionLabel={(d) => d.name}
      isOptionEqualToValue={(o, v) => o.id === v.id}
      value={member.doctor ?? null}
      onChange={(_, doctor) => onCommit(doctor?.id ?? null)}
      noOptionsText="لا يوجد أطباء بهذا الدور"
      renderInput={(params) => <TextField {...params} size="small" placeholder="اختر الطبيب" />}
    />
  )
}

const memberIdentity = (m: { doctor_id?: number | null }) => (m.doctor_id ? `doctor:${m.doctor_id}` : null)

export function OperationTeamModal({
  open,
  onClose,
  operationId,
  existingMembers = [],
  operationPrice,
  onAdded,
}: OperationTeamModalProps) {
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const teamPdf = usePdfPreview()
  const teamRolesQuery = useQuery({ queryKey: ['team-roles'], queryFn: getTeamRoles })
  const paymentMethodsQuery = useQuery({ queryKey: ['payment-methods'], queryFn: getPaymentMethods })
  const doctorsQuery = useQuery({ queryKey: ['doctors', ''], queryFn: () => getDoctors() })
  const teamRoleLabel = (roleId: number | undefined) =>
    teamRolesQuery.data?.find((r) => r.id === roleId)?.name ?? '—'

  const removeMutation = useMutation({
    mutationFn: (teamMemberId: number) => removeOperationTeamMember(operationId, teamMemberId),
    onSuccess: () => {
      toast.success('تمت إزالة العضو')
      onAdded?.()
    },
    onError: () => toast.error('تعذر إزالة العضو'),
  })

  const addDefaultTeamMutation = useMutation({
    mutationFn: async (rolesToAdd: TeamRole[]) => {
      for (const role of rolesToAdd) {
        await addOperationTeamMember(operationId, { role_id: role.id, name: role.name })
      }
    },
    onSuccess: () => {
      toast.success('تمت إضافة الأدوار الأساسية')
      onAdded?.()
    },
    onError: () => toast.error('تعذر إضافة بعض الأدوار الأساسية'),
  })

  function handleAddDefaultTeam() {
    const roles = teamRolesQuery.data ?? []
    const existingRoleIds = new Set(existingMembers.map((m) => m.role_id))
    const rolesToAdd = DEFAULT_TEAM_ROLE_SLUGS.map((slug) => roles.find((r) => r.slug === slug)).filter(
      (role): role is TeamRole => !!role && !existingRoleIds.has(role.id),
    )

    if (rolesToAdd.length === 0) {
      toast.info('الأدوار الأساسية مضافة بالفعل')
      return
    }

    addDefaultTeamMutation.mutate(rolesToAdd)
  }

  const entitlementMutation = useMutation({
    mutationFn: (payload: {
      teamMemberId: number
      entitlement_amount?: number | null
      payment_method_id?: number | null
      entitlement_paid_at?: string | null
      doctor_id?: number | null
    }) =>
      updateTeamMemberEntitlement(payload.teamMemberId, {
        entitlement_amount: payload.entitlement_amount,
        payment_method_id: payload.payment_method_id,
        entitlement_paid_at: payload.entitlement_paid_at,
        doctor_id: payload.doctor_id,
      }),
    onSuccess: () => {
      toast.success('تم تحديث الاستحقاق')
      onAdded?.()
    },
    onError: () => onAdded?.(),
  })

  const price = operationPrice != null ? Number(operationPrice) : null

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        الفريق الطبي
        <Button size="small" variant="contained" onClick={() => setAddMemberOpen(true)}>
          + إضافة عضو
        </Button>
      </DialogTitle>
      <DialogContent>
        <Table size="small" sx={{ mt: 0.5 }}>
          <TableHead>
            <TableRow>
              <TableCell>الدور</TableCell>
              <TableCell>العضو</TableCell>
              <TableCell>الاستحقاق</TableCell>
              <TableCell>طريقة الدفع</TableCell>
              <TableCell>تاريخ الدفع</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {existingMembers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography variant="body2" color="text.secondary">
                    لا يوجد أعضاء بعد
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {existingMembers.map((m) => {
              const othersTotal = existingMembers.reduce(
                (sum, other) => (other.id === m.id || other.entitlement_amount == null ? sum : sum + Number(other.entitlement_amount)),
                0,
              )
              const maxAmount = price == null ? null : Math.max(0, price - othersTotal)
              const otherDoctorIds = new Set(
                existingMembers
                  .filter((other) => other.id !== m.id && other.doctor_id != null)
                  .map((other) => other.doctor_id as number),
              )
              const roleDoctors = (doctorsQuery.data ?? []).filter(
                (d) => d.role_id === m.role_id && !otherDoctorIds.has(d.id),
              )

              return (
                <TableRow key={m.id}>
                  <TableCell>{m.role?.name ?? teamRoleLabel(m.role_id)}</TableCell>
                  <TableCell>
                    <MemberDoctorCell
                      member={m}
                      doctors={roleDoctors}
                      onCommit={(doctorId) => entitlementMutation.mutate({ teamMemberId: m.id, doctor_id: doctorId })}
                    />
                  </TableCell>
                  <TableCell>
                    <EntitlementAmountCell
                      member={m}
                      maxAmount={maxAmount}
                      onCommit={(value) => entitlementMutation.mutate({ teamMemberId: m.id, entitlement_amount: value })}
                    />
                  </TableCell>
                  <TableCell>
                    <Autocomplete<PaymentMethod>
                      size="small"
                      sx={{ minWidth: 150 }}
                      options={paymentMethodsQuery.data ?? []}
                      getOptionLabel={(pm) => pm.name}
                      isOptionEqualToValue={(o, v) => o.id === v.id}
                      loading={paymentMethodsQuery.isLoading}
                      value={paymentMethodsQuery.data?.find((pm) => pm.id === m.payment_method_id) ?? null}
                      onChange={(_, pm) =>
                        entitlementMutation.mutate({ teamMemberId: m.id, payment_method_id: pm?.id ?? null })
                      }
                      renderInput={(params) => <TextField {...params} size="small" placeholder="طريقة الدفع" />}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="date"
                      size="small"
                      value={m.entitlement_paid_at ?? ''}
                      onChange={(e) =>
                        entitlementMutation.mutate({
                          teamMemberId: m.id,
                          entitlement_paid_at: e.target.value || null,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell align="right">
                    <ConfirmRemoveButton
                      loading={removeMutation.isPending && removeMutation.variables === m.id}
                      onConfirm={() => removeMutation.mutate(m.id)}
                      description="إزالة هذا العضو؟"
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions>
        <Button
          variant="outlined"
          startIcon={<FileTextOutlined />}
          loading={teamPdf.isLoading()}
          onClick={() => teamPdf.open(admissionPdfPaths.operationTeam(operationId), 'معاينة فريق العملية')}
        >
          معاينة PDF
        </Button>
        <Button onClick={onClose}>إغلاق</Button>
      </DialogActions>
      <PdfPreviewModal url={teamPdf.url} title={teamPdf.title} onClose={teamPdf.close} />

      <AddTeamMemberDialog
        open={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
        operationId={operationId}
        existingMembers={existingMembers}
        onAdded={onAdded}
      />
    </Dialog>
  )
}

interface AddTeamMemberDialogProps {
  open: boolean
  onClose: () => void
  operationId: number
  existingMembers: OperationTeamMember[]
  onAdded?: () => void
}

function AddTeamMemberDialog({ open, onClose, operationId, existingMembers, onAdded }: AddTeamMemberDialogProps) {
  const [form, setForm] = useState<MemberForm>({})

  const doctorsQuery = useQuery({ queryKey: ['doctors', ''], queryFn: () => getDoctors() })
  const teamRolesQuery = useQuery({ queryKey: ['team-roles'], queryFn: getTeamRoles })
  const defaultTeamRoleId = teamRolesQuery.data?.find((r) => r.slug === 'assistant_surgeon')?.id
  const teamRoleLabel = (roleId: number | undefined) =>
    teamRolesQuery.data?.find((r) => r.id === roleId)?.name ?? '—'

  useEffect(() => {
    if (open) setForm({ role_id: defaultTeamRoleId })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultTeamRoleId])

  const existingMemberKeys = new Set(existingMembers.map(memberIdentity).filter(Boolean) as string[])
  const existingDoctorIds = new Set(existingMembers.map((m) => m.doctor_id).filter(Boolean) as number[])

  const addMutation = useMutation({
    mutationFn: (payload: Parameters<typeof addOperationTeamMember>[1]) => addOperationTeamMember(operationId, payload),
    onSuccess: () => {
      toast.success('تمت إضافة العضو')
      onAdded?.()
      onClose()
    },
    onError: () => toast.error('تعذر إضافة العضو'),
  })

  function updateForm(patch: Partial<MemberForm>) {
    setForm((prev) => ({ ...prev, ...patch }))
  }

  function handleAdd() {
    if (!form.role_id || !form.doctor_id) {
      return
    }
    const key = memberIdentity(form)
    if (!key || existingMemberKeys.has(key)) {
      toast.warning('هذا العضو مضاف بالفعل')
      return
    }
    addMutation.mutate({
      role_id: form.role_id,
      doctor_id: form.doctor_id,
    })
  }

  const roleDoctors = (doctorsQuery.data ?? []).filter(
    (d) => d.role_id === form.role_id && (!existingDoctorIds.has(d.id) || d.id === form.doctor_id),
  )
  const selectedDoctor = roleDoctors.find((d) => d.id === form.doctor_id) ?? null

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>إضافة عضو</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1 }}>
          <Autocomplete
            size="small"
            options={teamRolesQuery.data ?? []}
            getOptionLabel={(r) => r.name}
            isOptionEqualToValue={(o, v) => o.id === v.id}
            loading={teamRolesQuery.isLoading}
            value={teamRolesQuery.data?.find((r) => r.id === form.role_id) ?? null}
            onChange={(_, role) => updateForm({ role_id: role?.id, doctor_id: undefined })}
            renderInput={(params) => <TextField {...params} size="small" label="الدور" />}
          />
          <Autocomplete<Doctor>
            size="small"
            options={roleDoctors}
            getOptionLabel={(d) => d.name}
            isOptionEqualToValue={(o, v) => o.id === v.id}
            value={selectedDoctor}
            onChange={(_, doctor) => updateForm({ doctor_id: doctor?.id })}
            noOptionsText={`لا يوجد أطباء بدور "${teamRoleLabel(form.role_id)}"`}
            renderInput={(params) => <TextField {...params} size="small" label="الطبيب" />}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>إلغاء</Button>
        <Button variant="contained" onClick={handleAdd} loading={addMutation.isPending}>
          إضافة
        </Button>
      </DialogActions>
    </Dialog>
  )
}
