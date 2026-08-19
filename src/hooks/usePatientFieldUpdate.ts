import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { updatePatient } from '@/services/patientService'
import type { UpdatePatientPayload } from '@/types/patient'

export function usePatientFieldUpdate(patientId: number) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (payload: UpdatePatientPayload) => updatePatient(patientId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient', patientId] })
    },
    onError: () => {
      toast.error('تعذر حفظ التعديل')
    },
  })

  return async function saveField<K extends keyof UpdatePatientPayload>(
    field: K,
    value: UpdatePatientPayload[K],
  ) {
    await mutation.mutateAsync({ [field]: value } as UpdatePatientPayload)
  }
}
