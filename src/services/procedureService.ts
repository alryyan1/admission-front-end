import apiClient from '@/services/api'
import type { Procedure, ProcedureCategory } from '@/types/admission'

export async function getProcedureCategories(): Promise<ProcedureCategory[]> {
  const { data } = await apiClient.get<ProcedureCategory[]>('/procedure-categories')
  return data
}

export async function createProcedureCategory(name: string): Promise<ProcedureCategory> {
  const { data } = await apiClient.post<ProcedureCategory>('/procedure-categories', { name })
  return data
}

export async function updateProcedureCategory(id: number, name: string): Promise<ProcedureCategory> {
  const { data } = await apiClient.patch<ProcedureCategory>(`/procedure-categories/${id}`, { name })
  return data
}

export async function deleteProcedureCategory(id: number): Promise<void> {
  await apiClient.delete(`/procedure-categories/${id}`)
}

export async function getProcedures(filters?: {
  category_id?: number
  search?: string
  active_only?: boolean
}): Promise<Procedure[]> {
  const { data } = await apiClient.get<Procedure[]>('/procedures', { params: filters ?? {} })
  return data
}

export async function createProcedure(payload: {
  category_id?: number | null
  name_ar: string
  name_en?: string
  type?: string
  description?: string
  is_active?: boolean
}): Promise<Procedure> {
  const { data } = await apiClient.post<Procedure>('/procedures', payload)
  return data
}

export async function updateProcedure(
  id: number,
  payload: Partial<{
    category_id: number | null
    name_ar: string
    name_en: string | null
    type: string | null
    description: string | null
    is_active: boolean
  }>,
): Promise<Procedure> {
  const { data } = await apiClient.patch<Procedure>(`/procedures/${id}`, payload)
  return data
}

export async function deleteProcedure(id: number): Promise<void> {
  await apiClient.delete(`/procedures/${id}`)
}
