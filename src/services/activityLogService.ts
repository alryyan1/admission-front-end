import apiClient from '@/services/api'
import type { ActivityLogCauser, ActivityLogFilters, ActivityLogPage, ActivitySubjectType } from '@/types/activityLog'

export async function getActivityLogs(filters: ActivityLogFilters): Promise<ActivityLogPage> {
  const { data } = await apiClient.get<ActivityLogPage>('/activity-logs', { params: filters })
  return data
}

export async function getActivityLogSubjectTypes(): Promise<ActivitySubjectType[]> {
  const { data } = await apiClient.get<ActivitySubjectType[]>('/activity-logs/subject-types')
  return data
}

export async function getActivityLogCausers(): Promise<ActivityLogCauser[]> {
  const { data } = await apiClient.get<ActivityLogCauser[]>('/activity-logs/causers')
  return data
}
