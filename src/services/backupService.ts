import apiClient from '@/services/api'

export interface BackupFile {
  filename: string
  size: number
  created_at: string
}

export async function getBackups(): Promise<BackupFile[]> {
  const { data } = await apiClient.get<BackupFile[]>('/backups')
  return data
}

export async function createBackup(): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>('/backups')
  return data
}

export async function downloadBackupBlob(filename: string): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(`/backups/${encodeURIComponent(filename)}/download`, {
    responseType: 'blob',
  })
  return data
}

export async function deleteBackup(filename: string): Promise<{ message: string }> {
  const { data } = await apiClient.delete<{ message: string }>(`/backups/${encodeURIComponent(filename)}`)
  return data
}
