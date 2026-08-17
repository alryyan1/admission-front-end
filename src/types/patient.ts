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
  jawda_doctor_id: number | null
  name: string
  specialist: string | null
}
