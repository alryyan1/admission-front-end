import apiClient from '@/services/api'
import type {
  Admission,
  AdmissionDeposit,
  AdmissionInvoice,
  AdmissionStatus,
  CashierOverview,
  DoctorOrder,
  Invoice,
  Operation,
  OperationPriority,
  OperationSupply,
  OperationTeamMember,
  RequestedService,
  TreatmentDose,
  VitalSign,
} from '@/types/admission'

export async function getAdmissions(
  filters?: {
    status?: AdmissionStatus
    patient_id?: number
    from?: string
    to?: string
    search?: string
    room_id?: number
    bed_id?: number
  },
): Promise<{ data: Admission[] }> {
  const { data } = await apiClient.get('/admissions', { params: filters ?? {} })
  return data
}

export async function getAdmission(id: number): Promise<Admission> {
  const { data } = await apiClient.get<Admission>(`/admissions/${id}`)
  return data
}

export async function createAdmission(payload: {
  patient_id: number
  bed_id: number
  admitting_doctor_id?: number | null
  admission_duration_hours?: 12 | 24
  diagnosis?: string
  admission_notes?: string
}): Promise<Admission> {
  const { data } = await apiClient.post<Admission>('/admissions', payload)
  return data
}

export async function dischargeAdmission(
  id: number,
  payload: { discharge_summary?: string },
): Promise<Admission> {
  const { data } = await apiClient.patch<Admission>(`/admissions/${id}/discharge`, payload)
  return data
}

export async function cancelAdmission(
  id: number,
  payload: { cancellation_reason?: string },
): Promise<Admission> {
  const { data } = await apiClient.patch<Admission>(`/admissions/${id}/cancel`, payload)
  return data
}

export async function addVitalSign(
  admissionId: number,
  payload: Partial<VitalSign>,
): Promise<VitalSign> {
  const { data } = await apiClient.post<VitalSign>(`/admissions/${admissionId}/vitals`, payload)
  return data
}

export async function addDoctorOrder(
  admissionId: number,
  payload: { order_text: string; frequency?: string; route?: string },
): Promise<DoctorOrder> {
  const { data } = await apiClient.post<DoctorOrder>(`/admissions/${admissionId}/orders`, payload)
  return data
}

export async function addDose(
  orderId: number,
  payload: { status?: 'given' | 'missed' | 'refused'; notes?: string },
): Promise<TreatmentDose> {
  const { data } = await apiClient.post<TreatmentDose>(`/orders/${orderId}/doses`, payload)
  return data
}

export async function addDeposit(
  admissionId: number,
  payload: { amount: number; payment_method_id?: number },
): Promise<AdmissionDeposit> {
  const { data } = await apiClient.post<AdmissionDeposit>(
    `/admissions/${admissionId}/deposits`,
    payload,
  )
  return data
}

export async function removeDeposit(admissionId: number, depositId: number): Promise<void> {
  await apiClient.delete(`/admissions/${admissionId}/deposits/${depositId}`)
}

export async function addRequestedService(
  admissionId: number,
  payload: { name: string; quantity?: number; unit_price: number },
): Promise<RequestedService> {
  const { data } = await apiClient.post<RequestedService>(
    `/admissions/${admissionId}/services`,
    payload,
  )
  return data
}

export async function calculateAccommodationFee(admissionId: number): Promise<RequestedService> {
  const { data } = await apiClient.post<RequestedService>(
    `/admissions/${admissionId}/services/accommodation-fee`,
  )
  return data
}

export async function updateRequestedService(
  admissionId: number,
  requestedServiceId: number,
  payload: { quantity?: number; unit_price?: number },
): Promise<RequestedService> {
  const { data } = await apiClient.patch<RequestedService>(
    `/admissions/${admissionId}/services/${requestedServiceId}`,
    payload,
  )
  return data
}

export async function removeRequestedService(admissionId: number, requestedServiceId: number): Promise<void> {
  await apiClient.delete(`/admissions/${admissionId}/services/${requestedServiceId}`)
}

export async function getCashierOverview(filters?: { search?: string; date_from?: string; date_to?: string }): Promise<CashierOverview> {
  const { data } = await apiClient.get<CashierOverview>('/cashier/admissions', { params: filters ?? {} })
  return data
}

export async function getInvoice(admissionId: number): Promise<AdmissionInvoice> {
  const { data } = await apiClient.get<AdmissionInvoice>(`/admissions/${admissionId}/invoice`)
  return data
}

export async function getInvoices(admissionId: number): Promise<Invoice[]> {
  const { data } = await apiClient.get<Invoice[]>(`/admissions/${admissionId}/invoices`)
  return data
}

export async function generateInvoice(admissionId: number): Promise<Invoice> {
  const { data } = await apiClient.post<Invoice>(`/admissions/${admissionId}/invoices`)
  return data
}

export async function markInvoicePaid(invoiceId: number): Promise<Invoice> {
  const { data } = await apiClient.patch<Invoice>(`/invoices/${invoiceId}/pay`)
  return data
}

export async function getOperations(admissionId: number): Promise<Operation[]> {
  const { data } = await apiClient.get<Operation[]>(`/admissions/${admissionId}/operations`)
  return data
}

export async function addOperation(
  admissionId: number,
  payload: {
    surgeon_id: number
    operation_room_id?: number | null
    procedure_id: number
    priority?: OperationPriority
    diagnosis?: string
    expected_duration_minutes?: number
    anesthesia_type?: string
    requested_by_doctor_id?: number
    scheduled_at: string | null
    notes?: string
  },
): Promise<Operation> {
  const { data } = await apiClient.post<Operation>(`/admissions/${admissionId}/operations`, payload)
  return data
}

export async function updateOperation(
  operationId: number,
  payload: Partial<{
    surgeon_id: number
    operation_room_id: number | null
    procedure_id: number
    priority: OperationPriority
    diagnosis: string | null
    expected_duration_minutes: number | null
    anesthesia_type: string | null
    requested_by_doctor_id: number | null
    scheduled_at: string | null
    notes: string
  }>,
): Promise<Operation> {
  const { data } = await apiClient.patch<Operation>(`/operations/${operationId}`, payload)
  return data
}

export async function prepareOperation(
  operationId: number,
  payload: {
    consent_obtained: boolean
    fasting_confirmed: boolean
    site_marked: boolean
    preop_vitals_checked: boolean
    preop_notes?: string | null
  },
): Promise<Operation> {
  const { data } = await apiClient.patch<Operation>(`/operations/${operationId}/prepare`, payload)
  return data
}

export async function startOperation(operationId: number): Promise<Operation> {
  const { data } = await apiClient.patch<Operation>(`/operations/${operationId}/start`)
  return data
}

export async function completeOperation(
  operationId: number,
  payload?: {
    notes?: string
    findings?: string
    complications?: string
    blood_loss_ml?: number
    outcome?: string
    report_notes?: string
  },
): Promise<Operation> {
  const { data } = await apiClient.patch<Operation>(`/operations/${operationId}/complete`, payload)
  return data
}

export async function cancelOperation(
  operationId: number,
  payload?: { cancellation_reason?: string },
): Promise<Operation> {
  const { data } = await apiClient.patch<Operation>(`/operations/${operationId}/cancel`, payload)
  return data
}

export async function addOperationTeamMember(
  operationId: number,
  payload: { doctor_id?: number | null; name?: string; role_id: number; notes?: string },
): Promise<OperationTeamMember> {
  const { data } = await apiClient.post<OperationTeamMember>(`/operations/${operationId}/team-members`, payload)
  return data
}

export async function removeOperationTeamMember(operationId: number, teamMemberId: number): Promise<void> {
  await apiClient.delete(`/operations/${operationId}/team-members/${teamMemberId}`)
}

export async function addOperationSupply(
  operationId: number,
  payload: { name: string; quantity?: number; unit?: string; notes?: string },
): Promise<OperationSupply> {
  const { data } = await apiClient.post<OperationSupply>(`/operations/${operationId}/supplies`, payload)
  return data
}

export async function removeOperationSupply(operationId: number, supplyId: number): Promise<void> {
  await apiClient.delete(`/operations/${operationId}/supplies/${supplyId}`)
}
