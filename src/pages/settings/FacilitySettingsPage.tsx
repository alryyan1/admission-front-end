import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Pencil, Trash2, X } from 'lucide-react'
import { ConfigProvider, Button, Card, Tag, Collapse } from 'antd'
import type { CollapseProps } from 'antd'
import { useAntTheme } from '@/lib/antdTheme'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { PageLoader } from '@/components/common/PageLoader'
import { FloorFormDialog } from '@/components/settings/FloorFormDialog'
import { WardFormDialog } from '@/components/settings/WardFormDialog'
import { RoomFormDialog } from '@/components/settings/RoomFormDialog'
import { BedFormDialog } from '@/components/settings/BedFormDialog'
import { getFloors, getFloor, deleteFloor, deleteWard, deleteRoom, deleteBed } from '@/services/facilityService'
import { formatNumber } from '@/lib/utils'
import type { Bed, BedStatus, Floor, Room, Ward } from '@/types/facility'

const BED_STATUS_VARIANT: Record<BedStatus, 'success' | 'error' | 'warning'> = {
  available: 'success',
  occupied: 'error',
  maintenance: 'warning',
}

const BED_STATUS_LABEL: Record<BedStatus, string> = {
  available: 'شاغر',
  occupied: 'مشغول',
  maintenance: 'صيانة',
}

type DeleteTarget = { type: 'floor' | 'ward' | 'room' | 'bed'; id: number; label: string }

export function FacilitySettingsPage() {
  const antTheme = useAntTheme()
  const queryClient = useQueryClient()

  const [floorDialog, setFloorDialog] = useState<{ open: boolean; floor?: Floor | null }>({ open: false })
  const [wardDialog, setWardDialog] = useState<{ open: boolean; floorId: number; ward?: Ward | null } | null>(null)
  const [roomDialog, setRoomDialog] = useState<{ open: boolean; wardId: number; room?: Room | null } | null>(null)
  const [bedDialog, setBedDialog] = useState<{ open: boolean; roomId: number; bed?: Bed | null } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)

  const floorsQuery = useQuery({ queryKey: ['floors'], queryFn: getFloors })

  const floorDetailsQuery = useQuery({
    queryKey: ['floors', 'details', floorsQuery.data?.map((f) => f.id)],
    queryFn: async () => {
      const floors = floorsQuery.data ?? []
      return Promise.all(floors.map((f) => getFloor(f.id)))
    },
    enabled: !!floorsQuery.data && floorsQuery.data.length > 0,
  })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['floors'] })
  }

  const deleteFloorMutation = useMutation({
    mutationFn: deleteFloor,
    onSuccess: () => {
      toast.success('تم حذف الطابق')
      invalidate()
      setDeleteTarget(null)
    },
  })

  const deleteWardMutation = useMutation({
    mutationFn: deleteWard,
    onSuccess: () => {
      toast.success('تم حذف الجناح')
      invalidate()
      setDeleteTarget(null)
    },
  })

  const deleteRoomMutation = useMutation({
    mutationFn: deleteRoom,
    onSuccess: () => {
      toast.success('تم حذف الغرفة')
      invalidate()
      setDeleteTarget(null)
    },
  })

  const deleteBedMutation = useMutation({
    mutationFn: deleteBed,
    onSuccess: () => {
      toast.success('تم حذف السرير')
      invalidate()
      setDeleteTarget(null)
    },
  })

  const deleteMutationByType: Record<DeleteTarget['type'], { mutate: (id: number) => void; isPending: boolean }> = {
    floor: deleteFloorMutation,
    ward: deleteWardMutation,
    room: deleteRoomMutation,
    bed: deleteBedMutation,
  }

  const floorItems: CollapseProps['items'] = floorDetailsQuery.data?.map((floor) => {
    const wardItems: CollapseProps['items'] = floor.wards?.map((ward) => ({
      key: String(ward.id),
      label: (
        <div className="flex w-full items-center gap-2 pe-2">
          <span className="flex-1 font-semibold">{ward.name}</span>
          {ward.gender && (
            <Tag>{ward.gender === 'male' ? 'رجالي' : ward.gender === 'female' ? 'نسائي' : 'أطفال'}</Tag>
          )}
          <span className="text-sm text-muted-foreground">{ward.rooms?.length ?? 0} غرفة</span>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              type="text"
              shape="circle"
              size="small"
              icon={<Pencil className="h-4 w-4" />}
              onClick={() => setWardDialog({ open: true, floorId: floor.id, ward })}
            />
            <Button
              type="text"
              shape="circle"
              size="small"
              icon={<Trash2 className="h-4 w-4" />}
              onClick={() => setDeleteTarget({ type: 'ward', id: ward.id, label: ward.name })}
            />
          </div>
        </div>
      ),
      children: (
        <div className="flex flex-wrap gap-4">
          {ward.rooms?.map((room) => (
            <Card key={room.id} size="small" className="min-w-[240px] p-3">
              <div className="flex items-center justify-between">
                <span className="font-bold">
                  غرفة {room.room_number} {room.room_type === 'vip' && '(VIP)'}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="text"
                    shape="circle"
                    size="small"
                    className="h-6 w-6"
                    icon={<Pencil className="h-3.5 w-3.5" />}
                    onClick={() => setRoomDialog({ open: true, wardId: ward.id, room })}
                  />
                  <Button
                    type="text"
                    shape="circle"
                    size="small"
                    className="h-6 w-6"
                    icon={<Trash2 className="h-3.5 w-3.5" />}
                    onClick={() =>
                      setDeleteTarget({ type: 'room', id: room.id, label: `غرفة ${room.room_number}` })
                    }
                  />
                </div>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {room.is_short_stay ? (
                  <>
                    إقامة قصيرة — 12س: {room.price_12_hours ? formatNumber(room.price_12_hours) : 'غير محدد'} ·
                    24س: {room.price_24_hours ? formatNumber(room.price_24_hours) : 'غير محدد'}
                  </>
                ) : (
                  <>{room.price_per_day ? `${formatNumber(room.price_per_day)} / يوم` : 'السعر غير محدد'}</>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {room.beds?.map((bed) => {
                  const label =
                    bed.status === 'occupied' && bed.current_admission
                      ? `${bed.bed_number} — ${bed.current_admission.patient.name}`
                      : `${bed.unit_type === 'chair' ? 'كرسي' : 'سرير'} ${bed.bed_number} — ${BED_STATUS_LABEL[bed.status]}`
                  return (
                    <Tag
                      key={bed.id}
                      color={BED_STATUS_VARIANT[bed.status]}
                      className="flex items-center gap-1 p-0 ps-2 pe-1"
                      style={{ display: 'inline-flex', alignItems: 'center' }}
                    >
                      <button
                        type="button"
                        onClick={() => setBedDialog({ open: true, roomId: room.id, bed })}
                      >
                        {label}
                      </button>
                      <button
                        type="button"
                        className="opacity-70 hover:opacity-100"
                        onClick={() =>
                          setDeleteTarget({ type: 'bed', id: bed.id, label: `سرير ${bed.bed_number}` })
                        }
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Tag>
                  )
                })}
                <button type="button" onClick={() => setBedDialog({ open: true, roomId: room.id })}>
                  <Tag>+ سرير</Tag>
                </button>
              </div>
            </Card>
          ))}
          <Card
            size="small"
            className="flex min-w-[160px] cursor-pointer items-center justify-center p-3"
            onClick={() => setRoomDialog({ open: true, wardId: ward.id })}
          >
            <span className="text-muted-foreground">+ غرفة جديدة</span>
          </Card>
        </div>
      ),
    }))

    return {
      key: String(floor.id),
      label: (
        <div className="flex w-full items-center gap-2 pe-2">
          <span className="flex-1 font-bold">{floor.name}</span>
          <span className="text-sm text-muted-foreground">{floor.wards?.length ?? 0} جناح</span>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              type="text"
              shape="circle"
              size="small"
              icon={<Pencil className="h-4 w-4" />}
              onClick={() => setFloorDialog({ open: true, floor })}
            />
            <Button
              type="text"
              shape="circle"
              size="small"
              icon={<Trash2 className="h-4 w-4" />}
              onClick={() => setDeleteTarget({ type: 'floor', id: floor.id, label: floor.name })}
            />
          </div>
        </div>
      ),
      children: (
        <>
          <div className="mb-2 flex justify-end">
            <Button
              type="default"
              size="small"
              onClick={() => setWardDialog({ open: true, floorId: floor.id })}
            >
              + جناح جديد
            </Button>
          </div>

          <Collapse
            className="ps-4"
            defaultActiveKey={floor.wards?.map((w) => String(w.id))}
            items={wardItems}
          />
        </>
      ),
    }
  })

  return (
    <ConfigProvider direction="rtl" theme={antTheme}>
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">الإعدادات — الهيكل العام للمستشفى</h1>
          <Button type="primary" onClick={() => setFloorDialog({ open: true })}>
            + طابق جديد
          </Button>
        </div>

        {(floorsQuery.isLoading || floorDetailsQuery.isLoading) && <PageLoader />}

        <Collapse
          defaultActiveKey={floorDetailsQuery.data?.map((f) => String(f.id))}
          items={floorItems}
        />

        <FloorFormDialog
          open={floorDialog.open}
          onOpenChange={(open) => setFloorDialog((s) => ({ ...s, open }))}
          floor={floorDialog.floor}
        />

        {wardDialog && (
          <WardFormDialog
            open={wardDialog.open}
            onOpenChange={(open) => setWardDialog((s) => (s ? { ...s, open } : s))}
            floorId={wardDialog.floorId}
            ward={wardDialog.ward}
          />
        )}

        {roomDialog && (
          <RoomFormDialog
            open={roomDialog.open}
            onOpenChange={(open) => setRoomDialog((s) => (s ? { ...s, open } : s))}
            wardId={roomDialog.wardId}
            room={roomDialog.room}
          />
        )}

        {bedDialog && (
          <BedFormDialog
            open={bedDialog.open}
            onOpenChange={(open) => setBedDialog((s) => (s ? { ...s, open } : s))}
            roomId={bedDialog.roomId}
            bed={bedDialog.bed}
          />
        )}

        <ConfirmDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title={deleteTarget ? `حذف ${deleteTarget.label}؟` : ''}
          description="لا يمكن التراجع عن هذا الإجراء."
          isPending={deleteTarget ? deleteMutationByType[deleteTarget.type].isPending : false}
          onConfirm={() => deleteTarget && deleteMutationByType[deleteTarget.type].mutate(deleteTarget.id)}
        />
      </div>
    </ConfigProvider>
  )
}
