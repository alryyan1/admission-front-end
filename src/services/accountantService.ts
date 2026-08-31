import apiClient from '@/services/api'
import type { OperationTeamMember } from '@/types/admission'

export interface AccountantTeamMemberFilters {
  search?: string
  patient_id?: number
  date_from?: string
  date_to?: string
  unpaid_only?: boolean
}

export interface OperationPatient {
  id: number
  name: string
  phone: string | null
  latest_operation_at: string | null
}

export async function getOperationPatients(search?: string): Promise<OperationPatient[]> {
  const { data } = await apiClient.get<OperationPatient[]>('/accountant/operation-patients', {
    params: search ? { search } : undefined,
  })
  return data
}

export async function getAccountantTeamMembers(
  filters: AccountantTeamMemberFilters = {},
): Promise<OperationTeamMember[]> {
  const { data } = await apiClient.get<OperationTeamMember[]>('/accountant/team-members', { params: filters })
  return data
}

export async function updateTeamMemberEntitlement(
  teamMemberId: number,
  payload: { entitlement_amount?: number | null; payment_method_id?: number | null; entitlement_paid_at?: string | null },
): Promise<OperationTeamMember> {
  const { data } = await apiClient.patch<OperationTeamMember>(
    `/accountant/team-members/${teamMemberId}/entitlement`,
    payload,
  )
  return data
}
