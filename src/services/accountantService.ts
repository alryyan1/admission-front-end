import apiClient from '@/services/api'
import type { OperationTeamMember } from '@/types/admission'

export async function updateTeamMemberEntitlement(
  teamMemberId: number,
  payload: {
    entitlement_amount?: number | null
    payment_method_id?: number | null
    entitlement_paid_at?: string | null
    name?: string | null
    doctor_id?: number | null
  },
): Promise<OperationTeamMember> {
  const { data } = await apiClient.patch<OperationTeamMember>(
    `/accountant/team-members/${teamMemberId}/entitlement`,
    payload,
  )
  return data
}
