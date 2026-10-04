import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Modal, Form, Input, Select, Button, Checkbox } from 'antd'
import { createRoom, updateRoom } from '@/services/facilityService'
import { getRoomTypes } from '@/services/roomTypeService'
import type { Room } from '@/types/facility'

interface RoomFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  wardId: number
  room?: Room | null
}

interface RoomFormValues {
  room_number: string
  room_type: string
  capacity: number | string
  auto_create_beds?: boolean
  price_per_day?: number | string
}

export function RoomFormDialog({ open, onOpenChange, wardId, room }: RoomFormDialogProps) {
  const queryClient = useQueryClient()
  const isEditing = !!room
  const [form] = Form.useForm<RoomFormValues>()
  const roomTypesQuery = useQuery({ queryKey: ['room-types'], queryFn: getRoomTypes })

  const mutation = useMutation({
    mutationFn: (payload: {
      room_number: string
      room_type: string
      capacity: number
      price_per_day: number | null
      auto_create_beds?: boolean
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
      ...(isEditing ? {} : { auto_create_beds: !!values.auto_create_beds }),
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
          auto_create_beds: false,
          price_per_day: room?.price_per_day ?? '',
        }}
        onFinish={handleFinish}
      >
        <Form.Item name="room_number" label="رقم الغرفة" rules={[{ required: true, message: 'هذا الحقل مطلوب' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="room_type" label="نوع الغرفة">
          <Select
            style={{ width: '100%' }}
            loading={roomTypesQuery.isLoading}
            options={roomTypesQuery.data?.map((roomType) => ({ value: roomType.code, label: roomType.name }))}
          />
        </Form.Item>
        <Form.Item name="capacity" label="عدد السراير" rules={[{ required: true, message: 'هذا الحقل مطلوب' }]}>
          <Input type="number" min={0} />
        </Form.Item>
        {!isEditing && (
          <Form.Item name="auto_create_beds" valuePropName="checked">
            <Checkbox>إنشاء عدد السراير المحدد تلقائياً</Checkbox>
          </Form.Item>
        )}
        <Form.Item name="price_per_day" label="السعر لليوم">
          <Input type="number" className="amount-input" placeholder="غير محدد بعد" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
