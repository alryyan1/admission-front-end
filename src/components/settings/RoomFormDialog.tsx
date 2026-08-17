import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { createRoom, updateRoom } from '@/services/facilityService'
import type { Room } from '@/types/facility'

interface RoomFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  wardId: number
  room?: Room | null
}

export function RoomFormDialog({ open, onOpenChange, wardId, room }: RoomFormDialogProps) {
  const queryClient = useQueryClient()
  const isEditing = !!room
  const [roomType, setRoomType] = useState<'normal' | 'vip' | 'operation'>(room?.room_type ?? 'normal')
  const [isShortStay, setIsShortStay] = useState(room?.is_short_stay ?? false)

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>{isEditing ? `تعديل غرفة ${room.room_number}` : 'إضافة غرفة جديدة'}</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            const form = new FormData(e.currentTarget)
            const priceDaily = form.get('price_per_day')
            const price12 = form.get('price_12_hours')
            const price24 = form.get('price_24_hours')
            mutation.mutate({
              room_number: String(form.get('room_number')),
              room_type: roomType,
              capacity: Number(form.get('capacity')),
              price_per_day: priceDaily ? Number(priceDaily) : null,
              is_short_stay: isShortStay,
              price_12_hours: price12 ? Number(price12) : null,
              price_24_hours: price24 ? Number(price24) : null,
            })
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="room-number">رقم الغرفة</Label>
            <Input id="room-number" name="room_number" defaultValue={room?.room_number} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>نوع الغرفة</Label>
            <Select value={roomType} onValueChange={(v) => setRoomType(v as 'normal' | 'vip' | 'operation')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">عادية</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
                <SelectItem value="operation">غرفة عمليات</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="room-capacity">السعة</Label>
            <Input id="room-capacity" name="capacity" type="number" min={0} defaultValue={room?.capacity ?? 1} required />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isShortStay}
              onChange={(e) => setIsShortStay(e.target.checked)}
            />
            غرفة إقامات قصيرة (12 أو 24 ساعة فقط)
          </label>
          {isShortStay ? (
            <>
              <p className="text-xs text-muted-foreground">
                هذه الغرفة مخصصة للإقامات القصيرة. جميع الأسرة داخلها تسمح بإقامة 12 أو 24 ساعة فقط.
              </p>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="price-12">السعر لـ 12 ساعة</Label>
                <Input
                  id="price-12"
                  name="price_12_hours"
                  type="number"
                  defaultValue={room?.price_12_hours ?? ''}
                  placeholder="غير محدد بعد"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="price-24">السعر لـ 24 ساعة</Label>
                <Input
                  id="price-24"
                  name="price_24_hours"
                  type="number"
                  defaultValue={room?.price_24_hours ?? ''}
                  placeholder="غير محدد بعد"
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="room-price">السعر لليوم</Label>
              <Input
                id="room-price"
                name="price_per_day"
                type="number"
                defaultValue={room?.price_per_day ?? ''}
                placeholder="غير محدد بعد"
              />
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
