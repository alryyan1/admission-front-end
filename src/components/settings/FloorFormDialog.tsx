import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { createFloor, updateFloor } from '@/services/facilityService'
import type { Floor } from '@/types/facility'

interface FloorFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  floor?: Floor | null
}

export function FloorFormDialog({ open, onOpenChange, floor }: FloorFormDialogProps) {
  const queryClient = useQueryClient()
  const isEditing = !!floor

  const mutation = useMutation({
    mutationFn: (payload: { name: string; description?: string; status: boolean }) =>
      isEditing ? updateFloor(floor.id, payload) : createFloor(payload),
    onSuccess: () => {
      toast.success(isEditing ? 'تم تحديث الطابق' : 'تم إضافة الطابق')
      queryClient.invalidateQueries({ queryKey: ['floors'] })
      onOpenChange(false)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>{isEditing ? `تعديل ${floor.name}` : 'إضافة طابق جديد'}</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            const form = new FormData(e.currentTarget)
            mutation.mutate({
              name: String(form.get('name')),
              description: String(form.get('description') || ''),
              status: form.get('status') === 'on',
            })
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="floor-name">اسم الطابق</Label>
            <Input id="floor-name" name="name" defaultValue={floor?.name} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="floor-description">الوصف</Label>
            <Input id="floor-description" name="description" defaultValue={floor?.description ?? ''} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="status" defaultChecked={floor?.status ?? true} />
            نشط
          </label>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              حفظ
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
