import type { RoomType } from '@/types/facility'

interface RoomTypeStyle {
  color: string
  bg: string
  tagColor: string
}

const ROOM_TYPE_STYLE: Record<string, RoomTypeStyle> = {
  normal: { color: '#94a3b8', bg: '#f8fafc', tagColor: 'default' },
  vip: { color: '#d4af37', bg: '#fdf8e9', tagColor: 'gold' },
  nursery: { color: '#16a34a', bg: '#f0fdf4', tagColor: 'green' },
  ward: { color: '#2563eb', bg: '#eff6ff', tagColor: 'blue' },
  operation: { color: '#dc2626', bg: '#fef2f2', tagColor: 'red' },
}

const FALLBACK_ROOM_TYPE_STYLE: RoomTypeStyle = { color: '#64748b', bg: '#f8fafc', tagColor: 'purple' }

export function getRoomTypeStyle(code: string): RoomTypeStyle {
  return ROOM_TYPE_STYLE[code] ?? FALLBACK_ROOM_TYPE_STYLE
}

export function getRoomTypeName(roomTypes: RoomType[] | undefined, code: string): string {
  return roomTypes?.find((roomType) => roomType.code === code)?.name ?? code
}
