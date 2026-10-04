export interface ServiceCategory {
  id: number
  name: string
}

export interface Service {
  id: number
  category_id: number | null
  name_ar: string
  name_en: string | null
  price: string
  is_active: boolean
  category?: ServiceCategory | null
}

export interface ChartOpeningServiceSetting {
  id: number
  service_id: number | null
  auto_add: boolean
  service?: Service | null
}
