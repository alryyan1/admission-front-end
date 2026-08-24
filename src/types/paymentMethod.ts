export interface PaymentMethod {
  id: number
  name: string
  account_number: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}
