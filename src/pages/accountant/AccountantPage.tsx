import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ConfigProvider, Card, Typography, Flex, Table, InputNumber, Select, Space, DatePicker, Checkbox } from 'antd'
import { Autocomplete, TextField, CircularProgress } from '@mui/material'
import type { ColumnsType } from 'antd/es/table'
import type { GetRef } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useAntTheme } from '@/lib/antdTheme'
import { formatDate, formatNumber } from '@/lib/utils'
import {
  getAccountantTeamMembers,
  getOperationPatients,
  updateTeamMemberEntitlement,
  type OperationPatient,
} from '@/services/accountantService'
import { getPaymentMethods } from '@/services/paymentMethodService'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { StatTile } from '@/components/statistics/StatTile'
import type { OperationTeamMember } from '@/types/admission'

const { Title, Text } = Typography

type InputNumberInstance = GetRef<typeof InputNumber>

const PAYMENT_METHOD_ORDER = ['بنكك', 'نقدي', 'كاش', 'فوري', 'اوكاش']
const paymentMethodRank = (name: string) => {
  const i = PAYMENT_METHOD_ORDER.indexOf(name.trim())
  return i === -1 ? PAYMENT_METHOD_ORDER.length : i
}

function EntitlementAmountCell({
  member,
  maxAmount,
  onCommit,
  onEnter,
  inputRef,
}: {
  member: OperationTeamMember
  /** Highest value this member may take: operation price minus the other members' entitlements. */
  maxAmount?: number | null
  onCommit: (value: number | null) => void
  onEnter?: () => void
  inputRef?: (instance: InputNumberInstance | null) => void
}) {
  const [draft, setDraft] = useState<number | null>(member.entitlement_amount === null ? null : Number(member.entitlement_amount))

  useEffect(() => {
    setDraft(member.entitlement_amount === null ? null : Number(member.entitlement_amount))
  }, [member.entitlement_amount])

  function commit() {
    const current = member.entitlement_amount === null ? null : Number(member.entitlement_amount)
    if (draft === current) return
    if (maxAmount != null && draft != null && draft > maxAmount + 0.001) {
      toast.error(`قيمة الاستحقاق لا يمكن أن تتجاوز المتبقي من سعر العملية (${formatNumber(maxAmount)})`)
      setDraft(current)
      return
    }
    onCommit(draft)
  }

  return (
    <InputNumber
      ref={inputRef}
      className="amount-input"
      size="small"
      style={{ width: 130 }}
      min={0}
      max={maxAmount ?? undefined}
      placeholder="المبلغ"
      value={draft}
      onChange={(v) => setDraft(v === null ? null : Number(v))}
      onBlur={commit}
      onPressEnter={() => {
        commit()
        onEnter?.()
      }}
    />
  )
}

type OperationGroup = {
  operationId: number
  operation: OperationTeamMember['operation']
  members: OperationTeamMember[]
}

type PatientGroup = {
  patientId: number | 'unknown'
  patientName: string
  operations: OperationGroup[]
}

export function AccountantPage() {
  const antTheme = useAntTheme()
  const queryClient = useQueryClient()

  const [selectedPatient, setSelectedPatient] = useState<OperationPatient | null>(null)
  const [patientSearch, setPatientSearch] = useState('')
  const debouncedPatientSearch = useDebouncedValue(patientSearch)
  const [operationDate, setOperationDate] = useState<Dayjs | null>(null)
  const [unpaidOnly, setUnpaidOnly] = useState(false)

  const paymentMethodsQuery = useQuery({ queryKey: ['payment-methods'], queryFn: getPaymentMethods })
  const activePaymentMethods = (paymentMethodsQuery.data ?? [])
    .filter((pm) => pm.is_active)
    .sort((a, b) => paymentMethodRank(a.name) - paymentMethodRank(b.name) || a.name.localeCompare(b.name, 'ar'))

  const operationPatientsQuery = useQuery({
    queryKey: ['accountant-operation-patients', debouncedPatientSearch],
    queryFn: () => getOperationPatients(debouncedPatientSearch || undefined),
  })

  const operationDateStr = operationDate?.format('YYYY-MM-DD')

  const teamMembersQuery = useQuery({
    queryKey: ['accountant-team-members', selectedPatient?.id, operationDateStr, unpaidOnly],
    enabled: selectedPatient != null,
    queryFn: () =>
      getAccountantTeamMembers({
        patient_id: selectedPatient?.id,
        date_from: operationDateStr,
        date_to: operationDateStr,
        unpaid_only: unpaidOnly || undefined,
      }),
  })

  const entitlementMutation = useMutation({
    mutationFn: (payload: {
      teamMemberId: number
      entitlement_amount?: number | null
      payment_method_id?: number | null
      entitlement_paid_at?: string | null
    }) =>
      updateTeamMemberEntitlement(payload.teamMemberId, {
        entitlement_amount: payload.entitlement_amount,
        payment_method_id: payload.payment_method_id,
        entitlement_paid_at: payload.entitlement_paid_at,
      }),
    onSuccess: () => {
      toast.success('تم تحديث الاستحقاق')
      queryClient.invalidateQueries({ queryKey: ['accountant-team-members'] })
    },
    onError: () => {
      // Roll the inline inputs back to the server's values (error toast is shown by the axios interceptor).
      queryClient.invalidateQueries({ queryKey: ['accountant-team-members'] })
    },
  })

  const teamMembers = useMemo(() => teamMembersQuery.data ?? [], [teamMembersQuery.data])

  // Group members -> by patient -> by operation, so each operation renders its own table.
  const patientGroups = useMemo<PatientGroup[]>(() => {
    const byPatient = new Map<number | 'unknown', PatientGroup>()
    for (const member of teamMembers) {
      const patient = member.operation?.admission?.patient
      const patientId = patient?.id ?? 'unknown'
      let patientGroup = byPatient.get(patientId)
      if (!patientGroup) {
        patientGroup = { patientId, patientName: patient?.name ?? 'غير معروف', operations: [] }
        byPatient.set(patientId, patientGroup)
      }
      const operationId = member.operation?.id ?? member.operation_id
      let operationGroup = patientGroup.operations.find((o) => o.operationId === operationId)
      if (!operationGroup) {
        operationGroup = { operationId, operation: member.operation, members: [] }
        patientGroup.operations.push(operationGroup)
      }
      operationGroup.members.push(member)
    }
    return [...byPatient.values()]
  }, [teamMembers])

  // Flat ordered list of member ids so "Enter" jumps to the next amount input across tables.
  const orderedMemberIds = useMemo(
    () => patientGroups.flatMap((p) => p.operations.flatMap((o) => o.members.map((m) => m.id))),
    [patientGroups],
  )
  const amountInputRefs = useRef<Map<number, InputNumberInstance | null>>(new Map())

  function focusNextAmountInput(memberId: number) {
    const idx = orderedMemberIds.indexOf(memberId)
    const nextId = orderedMemberIds[idx + 1]
    if (nextId != null) amountInputRefs.current.get(nextId)?.focus()
  }

  const entitlementsByMethod = teamMembers.reduce<Record<string, number>>((acc, m) => {
    if (m.entitlement_amount === null) return acc
    const label = m.payment_method?.name ?? 'بدون طريقة دفع'
    acc[label] = (acc[label] ?? 0) + Number(m.entitlement_amount)
    return acc
  }, {})
  const entitlementsGrandTotal = Object.values(entitlementsByMethod).reduce((sum, total) => sum + total, 0)

  const buildColumns = (group: OperationGroup): ColumnsType<OperationTeamMember> => {
    const price = group.operation?.price != null ? Number(group.operation.price) : null
    return [
    {
      title: 'العضو',
      key: 'member',
      render: (_, m) => m.doctor?.name ?? m.name ?? '—',
    },
    { title: 'الدور', key: 'role', render: (_, m) => m.role?.name ?? '—' },
    {
      title: 'المبلغ المستحق',
      key: 'entitlement_amount',
      render: (_, m) => {
        const othersTotal = group.members.reduce(
          (sum, other) => (other.id === m.id || other.entitlement_amount == null ? sum : sum + Number(other.entitlement_amount)),
          0,
        )
        return (
          <EntitlementAmountCell
            member={m}
            maxAmount={price == null ? null : Math.max(0, price - othersTotal)}
            inputRef={(instance) => {
              amountInputRefs.current.set(m.id, instance)
            }}
            onCommit={(value) => entitlementMutation.mutate({ teamMemberId: m.id, entitlement_amount: value })}
            onEnter={() => focusNextAmountInput(m.id)}
          />
        )
      },
    },
    {
      title: 'تاريخ الاستحقاق',
      key: 'entitlement_paid_at',
      render: (_, m) => (
        <DatePicker
          size="small"
          style={{ width: 130 }}
          format="YYYY-MM-DD"
          placeholder="التاريخ"
          value={m.entitlement_paid_at ? dayjs(m.entitlement_paid_at) : null}
          onChange={(value) =>
            entitlementMutation.mutate({
              teamMemberId: m.id,
              entitlement_paid_at: value ? value.format('YYYY-MM-DD') : null,
            })
          }
        />
      ),
    },
    {
      title: 'طريقة الدفع',
      key: 'payment_method',
      render: (_, m) => (
        <Select
          size="small"
          style={{ width: 150 }}
          placeholder="اختر طريقة الدفع"
          loading={paymentMethodsQuery.isLoading}
          allowClear
          value={m.payment_method_id ?? undefined}
          onChange={(value) => entitlementMutation.mutate({ teamMemberId: m.id, payment_method_id: value ?? null })}
          options={activePaymentMethods.map((pm) => ({ label: pm.name, value: pm.id }))}
        />
      ),
    },
    ]
  }

  return (
    <ConfigProvider direction="rtl" theme={antTheme}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }} wrap="wrap" gap={12}>
        <Title level={3} style={{ margin: 0 }}>
          استحقاقات فريق العمليات
        </Title>
        <Space wrap align="end">
          <Autocomplete<OperationPatient>
            sx={{ width: 280 }}
            size="small"
            options={operationPatientsQuery.data ?? []}
            filterOptions={(options) => options}
            loading={operationPatientsQuery.isFetching}
            value={selectedPatient}
            onChange={(_, patient) => setSelectedPatient(patient)}
            onInputChange={(_, value) => setPatientSearch(value)}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            noOptionsText={debouncedPatientSearch ? 'لا يوجد مرضى' : 'لا يوجد مرضى لديهم عمليات'}
            renderInput={(params) => (
              <TextField
                {...params}
                label="المريض (أصحاب العمليات)"
                placeholder="ابحث عن أي مريض..."
                slotProps={{
                  ...params.slotProps,
                  input: {
                    ...params.slotProps.input,
                    endAdornment: (
                      <>
                        {operationPatientsQuery.isFetching ? <CircularProgress color="inherit" size={16} /> : null}
                        {params.slotProps.input.endAdornment}
                      </>
                    ),
                  },
                }}
              />
            )}
          />
          <Space direction="vertical" size={2}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              تاريخ العملية
            </Text>
            <DatePicker
              value={operationDate}
              onChange={(value) => setOperationDate(value)}
              allowClear
              format="YYYY-MM-DD"
              placeholder="كل التواريخ"
            />
          </Space>
          <Checkbox checked={unpaidOnly} onChange={(e) => setUnpaidOnly(e.target.checked)}>
            غير محدد المبلغ فقط
          </Checkbox>
        </Space>
      </Flex>

      {!selectedPatient ? (
        <Card>
          <Text type="secondary">اختر مريضاً من القائمة لعرض استحقاقات فريق عملياته.</Text>
        </Card>
      ) : (
        <>
          {Object.keys(entitlementsByMethod).length > 0 && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4" style={{ marginBottom: 16 }}>
              {Object.entries(entitlementsByMethod).map(([method, total]) => (
                <StatTile key={method} label={method} value={formatNumber(total)} />
              ))}
              <StatTile label="الإجمالي" value={formatNumber(entitlementsGrandTotal)} />
            </div>
          )}

          {patientGroups.length === 0 ? (
            <Card>
              <Text type="secondary">
                {teamMembersQuery.isLoading ? 'جارٍ التحميل...' : 'لا يوجد أعضاء فريق لهذا المريض ضمن الفترة المحددة.'}
              </Text>
            </Card>
          ) : (
            patientGroups.map((patientGroup) => (
              <div key={patientGroup.patientId} style={{ marginBottom: 24 }}>
                <Title level={4} style={{ marginBottom: 12 }}>
                  {patientGroup.patientName}
                </Title>
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  {patientGroup.operations.map((operationGroup) => (
                    <Card
                      key={operationGroup.operationId}
                      size="small"
                      title={
                        <Space size={8} wrap>
                          <Text strong>{operationGroup.operation?.procedure?.name_ar ?? 'عملية'}</Text>
                          {operationGroup.operation?.operation_number && (
                            <Text type="secondary">#{operationGroup.operation.operation_number}</Text>
                          )}
                          {operationGroup.operation?.scheduled_at && (
                            <Text type="secondary">{formatDate(operationGroup.operation.scheduled_at)}</Text>
                          )}
                          {operationGroup.operation?.price != null && (
                            <Text type="secondary">
                              سعر العملية: {formatNumber(Number(operationGroup.operation.price))}
                            </Text>
                          )}
                        </Space>
                      }
                    >
                      <Table
                        rowKey="id"
                        size="small"
                        loading={teamMembersQuery.isFetching}
                        columns={buildColumns(operationGroup)}
                        dataSource={operationGroup.members}
                        pagination={false}
                        locale={{ emptyText: 'لا يوجد أعضاء فريق' }}
                      />
                    </Card>
                  ))}
                </Space>
              </div>
            ))
          )}
        </>
      )}
    </ConfigProvider>
  )
}
