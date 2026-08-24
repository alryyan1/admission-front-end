export interface ActivityLogCauser {
  id: number
  name: string
  username: string
}

export type ActivityLogEvent = 'created' | 'updated' | 'deleted' | null

export interface ActivityLogProperties {
  attributes?: Record<string, unknown>
  old?: Record<string, unknown>
}

export interface ActivityLogEntry {
  id: number
  log_name: string | null
  description: string
  subject_type: string | null
  subject_id: number | null
  causer_id: number | null
  causer: ActivityLogCauser | null
  event: ActivityLogEvent
  properties: ActivityLogProperties | null
  created_at: string
}

export interface ActivityLogPage {
  data: ActivityLogEntry[]
  current_page: number
  last_page: number
  total: number
  per_page: number
}

export interface ActivityLogFilters {
  causer_id?: number
  subject_type?: string
  event?: string
  search?: string
  date_from?: string
  date_to?: string
  page?: number
  per_page?: number
}

export interface ActivitySubjectType {
  value: string
  label: string
}
