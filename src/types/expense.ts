import type { PaymentMethod } from '@/types/paymentMethod'

export interface Expense {
  id: number
  expense_date: string
  category: string
  description: string | null
  amount: number
  payment_method_id: number | null
  payment_method?: PaymentMethod | null
  recorded_by_id: number | null
  recorded_by?: { id: number; name: string } | null
  created_at: string
  updated_at: string
}
