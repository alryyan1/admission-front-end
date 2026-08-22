import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Modal, Form, Input, Checkbox, Button } from 'antd'
import { createFloor, updateFloor } from '@/services/facilityService'
import type { Floor } from '@/types/facility'

interface FloorFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  floor?: Floor | null
}

interface FloorFormValues {
  name: string
  description?: string
  status: boolean
}

export function FloorFormDialog({ open, onOpenChange, floor }: FloorFormDialogProps) {
  const queryClient = useQueryClient()
  const isEditing = !!floor
  const [form] = Form.useForm<FloorFormValues>()

  const mutation = useMutation({
    mutationFn: (payload: { name: string; description?: string; status: boolean }) =>
      isEditing ? updateFloor(floor.id, payload) : createFloor(payload),
    onSuccess: () => {
      toast.success(isEditing ? 'تم تحديث الطابق' : 'تم إضافة الطابق')
      queryClient.invalidateQueries({ queryKey: ['floors'] })
      onOpenChange(false)
    },
  })

  function handleFinish(values: FloorFormValues) {
    mutation.mutate({
      name: values.name,
      description: values.description || '',
      status: values.status,
    })
  }

  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title={isEditing ? `تعديل ${floor.name}` : 'إضافة طابق جديد'}
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
          name: floor?.name,
          description: floor?.description ?? '',
          status: floor?.status ?? true,
        }}
        onFinish={handleFinish}
      >
        <Form.Item name="name" label="اسم الطابق" rules={[{ required: true, message: 'هذا الحقل مطلوب' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="الوصف">
          <Input />
        </Form.Item>
        <Form.Item name="status" valuePropName="checked">
          <Checkbox>نشط</Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  )
}
