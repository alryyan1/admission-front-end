export type WardGender = 'male' | 'female' | 'children'

export interface FacilitySettings {
  id: number
  name: string | null
  phone: string | null
  email: string | null
  address: string | null
  logo_path: string | null
  logo_url: string | null
  stamp_path: string | null
  stamp_url: string | null
  watermark_path: string | null
  watermark_url: string | null
  use_logo: boolean
  use_stamp: boolean
  use_watermark: boolean
}

export interface Floor {
  id: number
  name: string
  description: string | null
  status: boolean
  wards_count?: number
  wards?: Ward[]
}

export interface Ward {
  id: number
  floor_id: number
  name: string
  description: string | null
  gender: WardGender | null
  status: boolean
  floor?: Floor
  rooms_count?: number
  rooms?: Room[]
}

export interface RoomType {
  id: number
  code: string
  name: string
}

export interface Room {
  id: number
  ward_id: number
  room_number: string
  room_type: string
  capacity: number
  price_per_day: string | null
  status: boolean
  ward?: Ward
  beds?: Bed[]
  beds_count?: number
}

export type BedStatus = 'available' | 'occupied' | 'maintenance'
export type BedUnitType = 'bed' | 'chair'

export interface Bed {
  id: number
  room_id: number
  bed_number: string
  unit_type: BedUnitType
  status: BedStatus
  room?: Room
  current_admission?: {
    id: number
    admission_date: string
    patient: { id: number; name: string }
  } | null
}
