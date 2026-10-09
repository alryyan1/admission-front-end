import apiClient from '@/services/api'
import type { Operation, OperationListResponse } from '@/types/admission'

export interface OperationFilters {
  surgeon_id?: number
  date?: string
  date_from?: string
  date_to?: string
  search?: string
  page?: number
  per_page?: number
}

export async function getAllOperations(filters: OperationFilters = {}): Promise<OperationListResponse> {
  const { data } = await apiClient.get('/operations', { params: filters })
  return data
}

export async function getOperation(id: number): Promise<Operation> {
  const { data } = await apiClient.get<Operation>(`/operations/${id}`)
  return data
}
