import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Modal, Form, Input, Select, Checkbox, Button } from 'antd'
import { createWard, updateWard } from '@/services/facilityService'
import type { Ward, WardGender } from '@/types/facility'

interface WardFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  floorId: number
  ward?: Ward | null
}

const GENDER_LABEL: Record<WardGender, string> = {
  male: 'رجالي',
  female: 'نسائي',
  children: 'أطفال',
}

interface WardFormValues {
  name: string
  description?: string
  gender: WardGender | 'none'
  status: boolean
}

export function WardFormDialog({ open, onOpenChange, floorId, ward }: WardFormDialogProps) {
  const queryClient = useQueryClient()
  const isEditing = !!ward
  const [form] = Form.useForm<WardFormValues>()

  const mutation = useMutation({
    mutationFn: (payload: { name: string; description?: string; gender: WardGender | null; status: boolean }) =>
      isEditing
        ? updateWard(ward.id, payload)
        : createWard({ ...payload, floor_id: floorId }),
    onSuccess: () => {
      toast.success(isEditing ? 'تم تحديث الجناح' : 'تم إضافة الجناح')
      queryClient.invalidateQueries({ queryKey: ['floors'] })
      onOpenChange(false)
    },
  })

  function handleFinish(values: WardFormValues) {
    mutation.mutate({
      name: values.name,
      description: values.description || '',
      gender: values.gender === 'none' ? null : values.gender,
      status: values.status,
    })
  }

  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title={isEditing ? `تعديل ${ward.name}` : 'إضافة جناح جديد'}
      width={340}
      footer={[
        <Button key="cancel" type="text" onClick={() => onOpenChange(false)}>
          إلغاء
        </Button>,
        <Button key="submit" type="primary" onClick={() => form.submit()} loading={mutation.isPending}>
          حفظ
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          name: ward?.name,
          description: ward?.description ?? '',
          gender: ward?.gender ?? 'none',
          status: ward?.status ?? true,
        }}
        onFinish={handleFinish}
      >
        <Form.Item name="name" label="اسم الجناح" rules={[{ required: true, message: 'هذا الحقل مطلوب' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="الوصف">
          <Input />
        </Form.Item>
        <Form.Item name="gender" label="الجنس">
          <Select
            style={{ width: '100%' }}
            options={[
              { value: 'none', label: 'عام (بدون تحديد)' },
              ...(Object.keys(GENDER_LABEL) as WardGender[]).map((g) => ({ value: g, label: GENDER_LABEL[g] })),
            ]}
          />
        </Form.Item>
        <Form.Item name="status" valuePropName="checked">
          <Checkbox>نشط</Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  )
}
