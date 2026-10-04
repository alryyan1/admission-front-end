import apiClient from '@/services/api'
import type { RoomType } from '@/types/facility'

export async function getRoomTypes(): Promise<RoomType[]> {
  const { data } = await apiClient.get<RoomType[]>('/room-types')
  return data
}

export async function createRoomType(payload: { name: string }): Promise<RoomType> {
  const { data } = await apiClient.post<RoomType>('/room-types', payload)
  return data
}

export async function updateRoomType(id: number, payload: { name: string }): Promise<RoomType> {
  const { data } = await apiClient.put<RoomType>(`/room-types/${id}`, payload)
  return data
}

export async function deleteRoomType(id: number): Promise<void> {
  await apiClient.delete(`/room-types/${id}`)
}
