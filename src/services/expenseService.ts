import apiClient from '@/services/api'
import type { Expense } from '@/types/expense'

export interface ExpenseFilters {
  date_from?: string
  date_to?: string
  category?: string
  search?: string
}

export async function getExpenses(filters: ExpenseFilters = {}): Promise<Expense[]> {
  const { data } = await apiClient.get<Expense[]>('/expenses', { params: filters })
  return data
}

export interface ExpensePayload {
  expense_date?: string
  category: string
  description?: string | null
  amount: number
  payment_method_id?: number | null
}

export async function createExpense(payload: ExpensePayload): Promise<Expense> {
  const { data } = await apiClient.post<Expense>('/expenses', payload)
  return data
}

export async function updateExpense(id: number, payload: Partial<ExpensePayload>): Promise<Expense> {
  const { data } = await apiClient.put<Expense>(`/expenses/${id}`, payload)
  return data
}

export async function deleteExpense(id: number): Promise<void> {
  await apiClient.delete(`/expenses/${id}`)
}
