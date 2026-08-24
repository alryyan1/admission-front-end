import apiClient from '@/services/api'
import type { Bed, BedStatus, BedUnitType, FacilitySettings, Floor, Room, Ward, WardGender } from '@/types/facility'

export async function getFloors(): Promise<Floor[]> {
  const { data } = await apiClient.get<Floor[]>('/floors')
  return data
}

export async function getFloor(id: number): Promise<Floor> {
  const { data } = await apiClient.get<Floor>(`/floors/${id}`)
  return data
}

export async function createFloor(payload: { name: string; description?: string; status?: boolean }): Promise<Floor> {
  const { data } = await apiClient.post<Floor>('/floors', payload)
  return data
}

export async function updateFloor(
  id: number,
  payload: { name?: string; description?: string | null; status?: boolean },
): Promise<Floor> {
  const { data } = await apiClient.put<Floor>(`/floors/${id}`, payload)
  return data
}

export async function deleteFloor(id: number): Promise<void> {
  await apiClient.delete(`/floors/${id}`)
}

export async function getWards(floorId?: number): Promise<Ward[]> {
  const { data } = await apiClient.get<Ward[]>('/wards', { params: floorId ? { floor_id: floorId } : undefined })
  return data
}

export async function getWard(id: number): Promise<Ward> {
  const { data } = await apiClient.get<Ward>(`/wards/${id}`)
  return data
}

export async function createWard(payload: {
  floor_id: number
  name: string
  description?: string
  gender?: WardGender | null
  status?: boolean
}): Promise<Ward> {
  const { data } = await apiClient.post<Ward>('/wards', payload)
  return data
}

export async function updateWard(
  id: number,
  payload: { name?: string; description?: string | null; gender?: WardGender | null; status?: boolean },
): Promise<Ward> {
  const { data } = await apiClient.put<Ward>(`/wards/${id}`, payload)
  return data
}

export async function deleteWard(id: number): Promise<void> {
  await apiClient.delete(`/wards/${id}`)
}

export async function getRooms(wardId?: number, roomType?: Room['room_type']): Promise<Room[]> {
  const { data } = await apiClient.get<Room[]>('/rooms', {
    params: { ...(wardId ? { ward_id: wardId } : {}), ...(roomType ? { room_type: roomType } : {}) },
  })
  return data
}

export async function getOperationRooms(): Promise<Room[]> {
  return getRooms(undefined, 'operation')
}

export async function createRoom(payload: {
  ward_id: number
  room_number: string
  room_type: 'normal' | 'vip' | 'operation'
  capacity: number
  price_per_day?: number | null
  is_short_stay?: boolean
  price_12_hours?: number | null
  price_24_hours?: number | null
  status?: boolean
}): Promise<Room> {
  const { data } = await apiClient.post<Room>('/rooms', payload)
  return data
}

export async function updateRoom(
  id: number,
  payload: {
    room_number?: string
    room_type?: 'normal' | 'vip' | 'operation'
    capacity?: number
    price_per_day?: number | null
    is_short_stay?: boolean
    price_12_hours?: number | null
    price_24_hours?: number | null
    status?: boolean
  },
): Promise<Room> {
  const { data } = await apiClient.put<Room>(`/rooms/${id}`, payload)
  return data
}

export async function deleteRoom(id: number): Promise<void> {
  await apiClient.delete(`/rooms/${id}`)
}

export async function createBed(payload: { room_id: number; bed_number: string; unit_type?: BedUnitType }): Promise<Bed> {
  const { data } = await apiClient.post<Bed>('/beds', payload)
  return data
}

export async function updateBed(
  id: number,
  payload: { bed_number?: string; unit_type?: BedUnitType; status?: BedStatus },
): Promise<Bed> {
  const { data } = await apiClient.put<Bed>(`/beds/${id}`, payload)
  return data
}

export async function deleteBed(id: number): Promise<void> {
  await apiClient.delete(`/beds/${id}`)
}

export async function getAvailableBeds(roomId?: number): Promise<Bed[]> {
  const { data } = await apiClient.get<Bed[]>('/beds', {
    params: { status: 'available', ...(roomId ? { room_id: roomId } : {}) },
  })
  return data
}

export async function getBeds(roomId?: number): Promise<Bed[]> {
  const { data } = await apiClient.get<Bed[]>('/beds', {
    params: roomId ? { room_id: roomId } : undefined,
  })
  return data
}

export async function getFacilitySettings(): Promise<FacilitySettings> {
  const { data } = await apiClient.get<FacilitySettings>('/settings/facility')
  return data
}

export async function getFacilityLogoBlob(): Promise<Blob> {
  const { data } = await apiClient.get<Blob>('/settings/facility/logo', {
    responseType: 'blob',
    headers: { 'X-Suppress-Error-Toast': '1' },
  })
  return data
}

export async function getFacilityStampBlob(): Promise<Blob> {
  const { data } = await apiClient.get<Blob>('/settings/facility/stamp', {
    responseType: 'blob',
    headers: { 'X-Suppress-Error-Toast': '1' },
  })
  return data
}

export async function updateFacilitySettings(payload: {
  name?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  logo?: File | null
  stamp?: File | null
  removeLogo?: boolean
  removeStamp?: boolean
  useLogo?: boolean
  useStamp?: boolean
}): Promise<FacilitySettings> {
  const formData = new FormData()
  if (payload.name !== undefined) formData.append('name', payload.name ?? '')
  if (payload.phone !== undefined) formData.append('phone', payload.phone ?? '')
  if (payload.email !== undefined) formData.append('email', payload.email ?? '')
  if (payload.address !== undefined) formData.append('address', payload.address ?? '')
  if (payload.logo) formData.append('logo', payload.logo)
  if (payload.stamp) formData.append('stamp', payload.stamp)
  if (payload.removeLogo) formData.append('remove_logo', '1')
  if (payload.removeStamp) formData.append('remove_stamp', '1')
  if (payload.useLogo !== undefined) formData.append('use_logo', payload.useLogo ? '1' : '0')
  if (payload.useStamp !== undefined) formData.append('use_stamp', payload.useStamp ? '1' : '0')

  const { data } = await apiClient.post<FacilitySettings>('/settings/facility', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
