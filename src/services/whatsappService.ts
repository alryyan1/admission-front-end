import apiClient from '@/services/api'

export interface WhatsAppSettings {
  configured: boolean
  phone_number_id: string | null
  display_phone_number: string | null
  verified_name: string | null
  quality_rating: string | null
  error: string | null
}

export async function getWhatsAppSettings(): Promise<WhatsAppSettings> {
  const { data } = await apiClient.get<WhatsAppSettings>('/settings/whatsapp')
  return data
}

export async function sendWhatsAppTestMessage(phone: string): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>('/settings/whatsapp/test', { phone })
  return data
}
