import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
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

export function WardFormDialog({ open, onOpenChange, floorId, ward }: WardFormDialogProps) {
  const queryClient = useQueryClient()
  const isEditing = !!ward
  const [gender, setGender] = useState<WardGender | 'none'>(ward?.gender ?? 'none')

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>{isEditing ? `تعديل ${ward.name}` : 'إضافة جناح جديد'}</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            const form = new FormData(e.currentTarget)
            mutation.mutate({
              name: String(form.get('name')),
              description: String(form.get('description') || ''),
              gender: gender === 'none' ? null : gender,
              status: form.get('status') === 'on',
            })
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ward-name">اسم الجناح</Label>
            <Input id="ward-name" name="name" defaultValue={ward?.name} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ward-description">الوصف</Label>
            <Input id="ward-description" name="description" defaultValue={ward?.description ?? ''} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>الجنس</Label>
            <Select value={gender} onValueChange={(v) => setGender(v as WardGender | 'none')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">عام (بدون تحديد)</SelectItem>
                {(Object.keys(GENDER_LABEL) as WardGender[]).map((g) => (
                  <SelectItem key={g} value={g}>
                    {GENDER_LABEL[g]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="status" defaultChecked={ward?.status ?? true} />
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
