import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { updateAdmission } from '@/services/admissionService'

type UpdateAdmissionPayload = Parameters<typeof updateAdmission>[1]

export function useAdmissionFieldUpdate(admissionId: number) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (payload: UpdateAdmissionPayload) => updateAdmission(admissionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admissions'] })
    },
    onError: () => {
      toast.error('تعذر حفظ التعديل')
    },
  })

  return async function saveField<K extends keyof UpdateAdmissionPayload>(
    field: K,
    value: UpdateAdmissionPayload[K],
  ) {
    await mutation.mutateAsync({ [field]: value } as UpdateAdmissionPayload)
  }
}
