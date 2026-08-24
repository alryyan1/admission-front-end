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
  apply_to_short_stay: boolean
  service?: Service | null
}

export interface ShortStayServiceSetting {
  id: number
  enabled: boolean
  service_12h_id: number | null
  service_24h_id: number | null
  service12h?: Service | null
  service24h?: Service | null
}
