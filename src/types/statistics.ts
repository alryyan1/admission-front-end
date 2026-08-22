export interface DateRange {
  from: string
  to: string
}

export interface WardOccupancy {
  floor_id: number
  floor_name: string
  ward_id: number
  ward_name: string
  total_beds: number
  occupied_beds: number
}

export interface OccupancyStatistics {
  summary: {
    total_beds: number
    occupied_beds: number
    available_beds: number
    maintenance_beds: number
    occupancy_rate: number
  }
  by_ward: WardOccupancy[]
}

export interface DailyCount {
  date: string
  total: number
}

export interface AdmissionsStatistics {
  range: DateRange
  active_admissions: number
  status_counts: Record<string, number>
  type_counts: Record<string, number>
  daily_trend: DailyCount[]
  average_length_of_stay_hours: number | null
}

export interface DailyRevenue {
  date: string
  total: number
}

export interface FinancialStatistics {
  range: DateRange
  paid_total: number
  outstanding_total: number
  deposits_total: number
  services_total: number
  daily_revenue: DailyRevenue[]
  deposits_by_method: Record<string, number>
}

export interface TopDoctor {
  id: number
  name: string
  specialist: string | null
  admissions_count: number
}

export interface TopService {
  name: string
  total_quantity: number
  total_revenue: number
}

export interface DoctorsServicesStatistics {
  range: DateRange
  top_doctors: TopDoctor[]
  top_services: TopService[]
}

export interface TopSurgeon {
  id: number
  name: string | null
  specialist: string | null
  total: number
  completed_count: number
  cancelled_count: number
}

export interface OperationsStatistics {
  range: DateRange
  today: {
    scheduled: number
    completed: number
    cancelled: number
  }
  status_counts: Record<string, number>
  by_surgeon: TopSurgeon[]
}
