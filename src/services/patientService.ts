import apiClient from '@/services/api'
import type { Doctor, JawdaPatientResult, Patient, UpdatePatientPayload } from '@/types/patient'

export async function searchLocalPatients(search: string): Promise<Patient[]> {
  const { data } = await apiClient.get('/patients', { params: { search } })
  return data.data
}

export async function getPatient(id: number): Promise<Patient> {
  const { data } = await apiClient.get<Patient>(`/patients/${id}`)
  return data
}

export async function updatePatient(id: number, payload: UpdatePatientPayload): Promise<Patient> {
  const { data } = await apiClient.patch<Patient>(`/patients/${id}`, payload)
  return data
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

export async function getDoctors(search?: string, roleId?: number): Promise<Doctor[]> {
  const params = { ...(search ? { search } : {}), ...(roleId ? { role_id: roleId } : {}) }
  const { data } = await apiClient.get<Doctor[]>('/doctors', { params: Object.keys(params).length ? params : undefined })
  return data
}

export async function createDoctor(payload: {
  name: string
  specialist_id?: number | null
  role_id: number
}): Promise<Doctor> {
  const { data } = await apiClient.post<Doctor>('/doctors', payload)
  return data
}

export async function updateDoctor(
  id: number,
  payload: Partial<{ name: string; specialist_id: number | null; role_id: number }>,
): Promise<Doctor> {
  const { data } = await apiClient.patch<Doctor>(`/doctors/${id}`, payload)
  return data
}

export async function deleteDoctor(id: number): Promise<void> {
  await apiClient.delete(`/doctors/${id}`)
}
