import apiClient from '@/services/api'
import type { Operation } from '@/types/admission'

export interface OperationFilters {
  surgeon_id?: number
  date?: string
  search?: string
  page?: number
}

export async function getAllOperations(filters: OperationFilters = {}): Promise<{ data: Operation[] }> {
  const { data } = await apiClient.get('/operations', { params: filters })
  return data
}

export async function getOperation(id: number): Promise<Operation> {
  const { data } = await apiClient.get<Operation>(`/operations/${id}`)
  return data
}
