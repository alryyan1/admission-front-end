import type { Specialist, TeamRole } from '@/types/admission'

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'

export interface Patient {
  id: number
  jawda_patient_id: number | null
  name: string
  phone: string | null
  gender: string | null
  age_year: number | null
  age_month: number | null
  age_day: number | null
  address: string | null
  is_local_only: boolean
  emergency_contact_name: string | null
  emergency_contact_relationship: string | null
  emergency_contact_phone: string | null
  emergency_contact_address: string | null
  blood_type: BloodType | null
  allergies: string | null
  chronic_diseases: string | null
  current_medications: string | null
  past_surgeries: string | null
  medical_history: string | null
  medical_notes: string | null
}

export interface UpdatePatientPayload {
  name?: string
  phone?: string | null
  gender?: string | null
  age_year?: number | null
  age_month?: number | null
  age_day?: number | null
  address?: string | null
  emergency_contact_name?: string | null
  emergency_contact_relationship?: string | null
  emergency_contact_phone?: string | null
  emergency_contact_address?: string | null
  blood_type?: BloodType | null
  allergies?: string | null
  chronic_diseases?: string | null
  current_medications?: string | null
  past_surgeries?: string | null
  medical_history?: string | null
  medical_notes?: string | null
}

export interface JawdaPatientResult {
  id: number
  name: string
  phone: string | null
  gender: string | null
  age_year: number | null
  age_month: number | null
  age_day: number | null
  address: string | null
  full_age?: string
}

export interface Doctor {
  id: number
  name: string
  specialist_id: number | null
  role_id: number
  role?: TeamRole | null
  specialist?: Specialist | null
}
