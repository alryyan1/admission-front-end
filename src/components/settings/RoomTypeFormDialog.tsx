import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Modal, Form, Input, Button } from 'antd'
import { createRoomType, updateRoomType } from '@/services/roomTypeService'
import type { RoomType } from '@/types/facility'

interface RoomTypeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  roomType?: RoomType | null
}

interface RoomTypeFormValues {
  name: string
}

export function RoomTypeFormDialog({ open, onOpenChange, roomType }: RoomTypeFormDialogProps) {
  const queryClient = useQueryClient()
  const isEditing = !!roomType
  const [form] = Form.useForm<RoomTypeFormValues>()

  const mutation = useMutation({
    mutationFn: (payload: { name: string }) =>
      isEditing ? updateRoomType(roomType.id, payload) : createRoomType(payload),
    onSuccess: () => {
      toast.success(isEditing ? 'تم تحديث نوع الغرفة' : 'تم إضافة نوع الغرفة')
      queryClient.invalidateQueries({ queryKey: ['room-types'] })
      onOpenChange(false)
    },
  })

  function handleFinish(values: RoomTypeFormValues) {
    mutation.mutate({ name: values.name.trim() })
  }

  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title={isEditing ? `تعديل ${roomType.name}` : 'إضافة نوع غرفة جديد'}
      width={340}
      destroyOnHidden
      footer={[
        <Button key="cancel" type="text" onClick={() => onOpenChange(false)}>
          إلغاء
        </Button>,
        <Button key="submit" type="primary" onClick={() => form.submit()} loading={mutation.isPending}>
          حفظ
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" initialValues={{ name: roomType?.name ?? '' }} onFinish={handleFinish}>
        <Form.Item
          name="name"
          label="اسم نوع الغرفة"
          rules={[{ required: true, whitespace: true, message: 'هذا الحقل مطلوب' }]}
        >
          <Input placeholder="مثال: غرفة عزل" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
