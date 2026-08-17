import apiClient from '@/services/api'
import type { Doctor, JawdaPatientResult, Patient } from '@/types/patient'

export async function searchLocalPatients(search: string): Promise<Patient[]> {
  const { data } = await apiClient.get('/patients', { params: { search } })
  return data.data
}

export async function searchJawdaPatients(search: string): Promise<JawdaPatientResult[]> {
  const { data } = await apiClient.get<{ data: JawdaPatientResult[] }>('/patients/search-jawda', {
    params: { search },
  })
  return data.data
}

export async function importJawdaPatient(patient: JawdaPatientResult): Promise<Patient> {
  const { data } = await apiClient.post<Patient>('/patients/import-jawda', {
    jawda_patient_id: patient.id,
    name: patient.name,
    phone: patient.phone,
    gender: patient.gender,
    age_year: patient.age_year,
    age_month: patient.age_month,
    age_day: patient.age_day,
    address: patient.address,
  })
  return data
}

export async function createLocalPatient(payload: {
  name: string
  phone?: string
  gender?: string
  age_year?: number
}): Promise<Patient> {
  const { data } = await apiClient.post<Patient>('/patients', payload)
  return data
}

export async function getDoctors(search?: string): Promise<Doctor[]> {
  const { data } = await apiClient.get<Doctor[]>('/doctors', { params: search ? { search } : undefined })
  return data
}

export async function syncJawdaDoctors(): Promise<Doctor[]> {
  const { data } = await apiClient.post<Doctor[]>('/doctors/sync-jawda')
  return data
}
