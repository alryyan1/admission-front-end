import apiClient from '@/services/api'
import type { PaymentMethod } from '@/types/paymentMethod'

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  const { data } = await apiClient.get<PaymentMethod[]>('/payment-methods')
  return data
}

export async function createPaymentMethod(payload: {
  name: string
  account_number?: string | null
  is_active?: boolean
}): Promise<PaymentMethod> {
  const { data } = await apiClient.post<PaymentMethod>('/payment-methods', payload)
  return data
}

export async function updatePaymentMethod(
  id: number,
  payload: { name: string; account_number?: string | null; is_active?: boolean },
): Promise<PaymentMethod> {
  const { data } = await apiClient.put<PaymentMethod>(`/payment-methods/${id}`, payload)
  return data
}

export async function deletePaymentMethod(id: number): Promise<void> {
  await apiClient.delete(`/payment-methods/${id}`)
}
