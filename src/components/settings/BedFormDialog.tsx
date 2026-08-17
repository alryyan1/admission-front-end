import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { createBed, updateBed } from '@/services/facilityService'
import type { Bed, BedStatus, BedUnitType } from '@/types/facility'

interface BedFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  roomId: number
  bed?: Bed | null
}

export function BedFormDialog({ open, onOpenChange, roomId, bed }: BedFormDialogProps) {
  const queryClient = useQueryClient()
  const isEditing = !!bed
  const [unitType, setUnitType] = useState<BedUnitType>(bed?.unit_type ?? 'bed')
  const [status, setStatus] = useState<BedStatus>(bed?.status ?? 'available')

  const mutation = useMutation({
    mutationFn: (payload: { bed_number: string; unit_type: BedUnitType; status?: BedStatus }) =>
      isEditing ? updateBed(bed.id, payload) : createBed({ ...payload, room_id: roomId }),
    onSuccess: () => {
      toast.success(isEditing ? 'تم تحديث السرير' : 'تم إضافة السرير')
      queryClient.invalidateQueries({ queryKey: ['floors'] })
      onOpenChange(false)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>{isEditing ? `تعديل سرير ${bed.bed_number}` : 'إضافة سرير جديد'}</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            const form = new FormData(e.currentTarget)
            mutation.mutate({
              bed_number: String(form.get('bed_number')),
              unit_type: unitType,
              status: isEditing ? status : undefined,
            })
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bed-number">الرقم</Label>
            <Input id="bed-number" name="bed_number" defaultValue={bed?.bed_number} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>النوع</Label>
            <Select value={unitType} onValueChange={(v) => setUnitType(v as BedUnitType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bed">سرير</SelectItem>
                <SelectItem value="chair">كرسي ولادة</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isEditing && (
            <div className="flex flex-col gap-1.5">
              <Label>الحالة</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as BedStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">شاغر</SelectItem>
                  <SelectItem value="occupied">مشغول</SelectItem>
                  <SelectItem value="maintenance">صيانة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
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
