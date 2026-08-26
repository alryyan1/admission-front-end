import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Modal, Form, Input, Select, Checkbox, Button } from 'antd'
import { createRoom, updateRoom } from '@/services/facilityService'
import type { Room } from '@/types/facility'

interface RoomFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  wardId: number
  room?: Room | null
}

interface RoomFormValues {
  room_number: string
  room_type: 'normal' | 'vip' | 'operation'
  capacity: number | string
  is_short_stay: boolean
  price_per_day?: number | string
  price_12_hours?: number | string
  price_24_hours?: number | string
}

export function RoomFormDialog({ open, onOpenChange, wardId, room }: RoomFormDialogProps) {
  const queryClient = useQueryClient()
  const isEditing = !!room
  const [form] = Form.useForm<RoomFormValues>()
  const isShortStay = Form.useWatch('is_short_stay', form) ?? room?.is_short_stay ?? false

  const mutation = useMutation({
    mutationFn: (payload: {
      room_number: string
      room_type: 'normal' | 'vip' | 'operation'
      capacity: number
      price_per_day: number | null
      is_short_stay: boolean
      price_12_hours: number | null
      price_24_hours: number | null
    }) => (isEditing ? updateRoom(room.id, payload) : createRoom({ ...payload, ward_id: wardId })),
    onSuccess: () => {
      toast.success(isEditing ? 'تم تحديث الغرفة' : 'تم إضافة الغرفة')
      queryClient.invalidateQueries({ queryKey: ['floors'] })
      onOpenChange(false)
    },
  })

  function handleFinish(values: RoomFormValues) {
    mutation.mutate({
      room_number: values.room_number,
      room_type: values.room_type,
      capacity: Number(values.capacity),
      price_per_day: values.price_per_day ? Number(values.price_per_day) : null,
      is_short_stay: !!values.is_short_stay,
      price_12_hours: values.price_12_hours ? Number(values.price_12_hours) : null,
      price_24_hours: values.price_24_hours ? Number(values.price_24_hours) : null,
    })
  }

  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title={isEditing ? `تعديل غرفة ${room.room_number}` : 'إضافة غرفة جديدة'}
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
          room_number: room?.room_number,
          room_type: room?.room_type ?? 'normal',
          capacity: room?.capacity ?? 1,
          is_short_stay: room?.is_short_stay ?? false,
          price_per_day: room?.price_per_day ?? '',
          price_12_hours: room?.price_12_hours ?? '',
          price_24_hours: room?.price_24_hours ?? '',
        }}
        onFinish={handleFinish}
      >
        <Form.Item name="room_number" label="رقم الغرفة" rules={[{ required: true, message: 'هذا الحقل مطلوب' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="room_type" label="نوع الغرفة">
          <Select
            style={{ width: '100%' }}
            options={[
              { value: 'normal', label: 'عادية' },
              { value: 'vip', label: 'VIP' },
              { value: 'operation', label: 'غرفة عمليات' },
              { value: 'ward', label: 'عنبر' },
            ]}
          />
        </Form.Item>
        <Form.Item name="capacity" label="السعة" rules={[{ required: true, message: 'هذا الحقل مطلوب' }]}>
          <Input type="number" min={0} />
        </Form.Item>
        <Form.Item name="is_short_stay" valuePropName="checked">
          <Checkbox>غرفة إقامات قصيرة (12 أو 24 ساعة فقط)</Checkbox>
        </Form.Item>
        {isShortStay ? (
          <>
            <p className="text-xs text-muted-foreground">
              هذه الغرفة مخصصة للإقامات القصيرة. جميع الأسرة داخلها تسمح بإقامة 12 أو 24 ساعة فقط.
            </p>
            <Form.Item name="price_12_hours" label="السعر لـ 12 ساعة">
              <Input type="number" placeholder="غير محدد بعد" />
            </Form.Item>
            <Form.Item name="price_24_hours" label="السعر لـ 24 ساعة">
              <Input type="number" placeholder="غير محدد بعد" />
            </Form.Item>
          </>
        ) : (
          <Form.Item name="price_per_day" label="السعر لليوم">
            <Input type="number" placeholder="غير محدد بعد" />
          </Form.Item>
        )}
      </Form>
    </Modal>
  )
}
