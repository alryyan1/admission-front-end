import apiClient from '@/services/api'

export interface WhatsAppSettings {
  configured: boolean
  phone_number_id: string | null
  display_phone_number: string | null
  verified_name: string | null
  quality_rating: string | null
  error: string | null
}

export interface WhatsAppRecipient {
  id: number
  phone: string
  label: string | null
}

export interface WhatsAppSendResult {
  phone: string
  label: string | null
  sent: boolean
  message?: string
}

export async function getWhatsAppSettings(): Promise<WhatsAppSettings> {
  const { data } = await apiClient.get<WhatsAppSettings>('/settings/whatsapp')
  return data
}

export async function sendWhatsAppTestMessage(phone: string): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>('/settings/whatsapp/test', { phone })
  return data
}

export async function getWhatsAppRecipients(): Promise<WhatsAppRecipient[]> {
  const { data } = await apiClient.get<WhatsAppRecipient[]>('/settings/whatsapp/recipients')
  return data
}

export async function addWhatsAppRecipient(payload: { phone: string; label?: string }): Promise<WhatsAppRecipient> {
  const { data } = await apiClient.post<WhatsAppRecipient>('/settings/whatsapp/recipients', payload)
  return data
}

export async function removeWhatsAppRecipient(id: number): Promise<void> {
  await apiClient.delete(`/settings/whatsapp/recipients/${id}`)
}

export async function sendOperationTeamPdfWhatsApp(operationId: number): Promise<{ results: WhatsAppSendResult[] }> {
  const { data } = await apiClient.post<{ results: WhatsAppSendResult[] }>(`/operations/${operationId}/team.pdf/whatsapp`)
  return data
}

export async function sendOperationInvoicePdfWhatsApp(operationId: number): Promise<{ sent: boolean; message: string }> {
  const { data } = await apiClient.post<{ sent: boolean; message: string }>(`/operations/${operationId}/invoice.pdf/whatsapp`)
  return data
}
