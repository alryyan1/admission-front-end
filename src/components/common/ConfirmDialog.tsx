import { Modal } from 'antd'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  onConfirm: () => void
  isPending?: boolean
}

export function ConfirmDialog({ open, onOpenChange, title, description, onConfirm, isPending }: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title={title}
      okText="حذف"
      cancelText="إلغاء"
      okButtonProps={{ danger: true, loading: isPending, disabled: isPending }}
      cancelButtonProps={{ disabled: isPending }}
      onOk={onConfirm}
    >
      {description}
    </Modal>
  )
}
