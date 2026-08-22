import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Modal, Form, Input, Select, Button } from 'antd'
import { createBed, updateBed } from '@/services/facilityService'
import type { Bed, BedStatus, BedUnitType } from '@/types/facility'

interface BedFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  roomId: number
  bed?: Bed | null
}

interface BedFormValues {
  bed_number: string
  unit_type: BedUnitType
  status: BedStatus
}

export function BedFormDialog({ open, onOpenChange, roomId, bed }: BedFormDialogProps) {
  const queryClient = useQueryClient()
  const isEditing = !!bed
  const [form] = Form.useForm<BedFormValues>()

  const mutation = useMutation({
    mutationFn: (payload: { bed_number: string; unit_type: BedUnitType; status?: BedStatus }) =>
      isEditing ? updateBed(bed.id, payload) : createBed({ ...payload, room_id: roomId }),
    onSuccess: () => {
      toast.success(isEditing ? 'تم تحديث السرير' : 'تم إضافة السرير')
      queryClient.invalidateQueries({ queryKey: ['floors'] })
      onOpenChange(false)
    },
  })

  function handleFinish(values: BedFormValues) {
    mutation.mutate({
      bed_number: values.bed_number,
      unit_type: values.unit_type,
      status: isEditing ? values.status : undefined,
    })
  }

  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title={isEditing ? `تعديل سرير ${bed.bed_number}` : 'إضافة سرير جديد'}
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
          bed_number: bed?.bed_number,
          unit_type: bed?.unit_type ?? 'bed',
          status: bed?.status ?? 'available',
        }}
        onFinish={handleFinish}
      >
        <Form.Item name="bed_number" label="الرقم" rules={[{ required: true, message: 'هذا الحقل مطلوب' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="unit_type" label="النوع">
          <Select
            style={{ width: '100%' }}
            options={[
              { value: 'bed', label: 'سرير' },
              { value: 'chair', label: 'كرسي ولادة' },
            ]}
          />
        </Form.Item>
        {isEditing && (
          <Form.Item name="status" label="الحالة">
            <Select
              style={{ width: '100%' }}
              options={[
                { value: 'available', label: 'شاغر' },
                { value: 'occupied', label: 'مشغول' },
                { value: 'maintenance', label: 'صيانة' },
              ]}
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  )
}
