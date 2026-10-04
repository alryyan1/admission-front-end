import { useState, type CSSProperties, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Pencil, Trash2 } from 'lucide-react'
import { ConfigProvider, Button, Tag, Tabs, Flex, Radio, theme as antdThemeApi } from 'antd'
import { useAntTheme } from '@/lib/antdTheme'
import {
  useTheme,
  ADMISSION_HEADER_BG_OPTIONS,
  ADMISSION_HEADER_FONT_SIZE_OPTIONS,
  ADMISSION_HEADER_FONT_SIZE_PX,
  type AdmissionHeaderBg,
} from '@/contexts/ThemeContext'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { PageLoader } from '@/components/common/PageLoader'
import { FloorFormDialog } from '@/components/settings/FloorFormDialog'
import { WardFormDialog } from '@/components/settings/WardFormDialog'
import { RoomFormDialog } from '@/components/settings/RoomFormDialog'
import { BedFormDialog } from '@/components/settings/BedFormDialog'
import { ChartOpeningServiceSettingsTab } from '@/components/settings/ChartOpeningServiceSettingsTab'
import { LogoStampSettingsTab } from '@/components/settings/LogoStampSettingsTab'
import { FacilityInfoSettingsTab } from '@/components/settings/FacilityInfoSettingsTab'
import { PaymentMethodsSettingsTab } from '@/components/settings/PaymentMethodsSettingsTab'
import { RoomTypesSettingsTab } from '@/components/settings/RoomTypesSettingsTab'
import { getFloors, getFloor, deleteFloor, deleteWard, deleteRoom, deleteBed } from '@/services/facilityService'
import { getRoomTypes } from '@/services/roomTypeService'
import { getRoomTypeName, getRoomTypeStyle } from '@/lib/roomTypes'
import { cn, formatNumber } from '@/lib/utils'
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

type StructureColumnProps = {
  title: string
  count: number
  action: ReactNode
  isEmpty: boolean
  emptyText: string
  children?: ReactNode
}

function StructureColumn({ title, count, action, isEmpty, emptyText, children }: StructureColumnProps) {
  return (
    <div className="flex min-w-0 flex-col rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border p-3">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold">{title}</h2>
          <span className="text-xs text-muted-foreground">{count}</span>
        </div>
        {action}
      </div>
      <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto p-2">
        {isEmpty ? <p className="p-4 text-center text-sm text-muted-foreground">{emptyText}</p> : children}
      </div>
    </div>
  )
}

type StructureRowProps = {
  selected?: boolean
  onSelect?: () => void
  style?: CSSProperties
  onEdit: () => void
  onDelete: () => void
  children: ReactNode
}

function StructureRow({ selected = false, onSelect, style, onEdit, onDelete, children }: StructureRowProps) {
  return (
    <div
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={onSelect ? (e) => e.key === 'Enter' && onSelect() : undefined}
      style={style}
      className={cn(
        'flex items-center gap-2 rounded-md border border-border p-2',
        onSelect && 'cursor-pointer hover:bg-muted/40',
        selected && 'ring-2 ring-primary',
      )}
    >
      <div className="min-w-0 flex-1">{children}</div>
      <div className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <Button type="text" shape="circle" size="small" icon={<Pencil className="h-4 w-4" />} onClick={onEdit} />
        <Button type="text" shape="circle" size="small" icon={<Trash2 className="h-4 w-4" />} onClick={onDelete} />
      </div>
    </div>
  )
}

export function FacilitySettingsPage() {
  const antTheme = useAntTheme()
  const { token } = antdThemeApi.useToken()
  const { admissionHeaderBg, setAdmissionHeaderBg, admissionHeaderFontSize, setAdmissionHeaderFontSize } = useTheme()
  const queryClient = useQueryClient()

  const [floorDialog, setFloorDialog] = useState<{ open: boolean; floor?: Floor | null }>({ open: false })
  const [wardDialog, setWardDialog] = useState<{ open: boolean; floorId: number; ward?: Ward | null } | null>(null)
  const [roomDialog, setRoomDialog] = useState<{ open: boolean; wardId: number; room?: Room | null } | null>(null)
  const [bedDialog, setBedDialog] = useState<{ open: boolean; roomId: number; bed?: Bed | null } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)

  const [selectedFloorId, setSelectedFloorId] = useState<number | null>(null)
  const [selectedWardId, setSelectedWardId] = useState<number | null>(null)
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null)

  const floorsQuery = useQuery({ queryKey: ['floors'], queryFn: getFloors })
  const roomTypesQuery = useQuery({ queryKey: ['room-types'], queryFn: getRoomTypes })

  const floorDetailsQuery = useQuery({
    queryKey: ['floors', 'details', floorsQuery.data?.map((f) => f.id)],
    queryFn: async () => {
      const floors = floorsQuery.data ?? []
      return Promise.all(floors.map((f) => getFloor(f.id)))
    },
    enabled: !!floorsQuery.data && floorsQuery.data.length > 0,
  })

  const floors = floorDetailsQuery.data ?? []
  const selectedFloor = floors.find((floor) => floor.id === selectedFloorId)
  const wards = selectedFloor?.wards ?? []
  const selectedWard = wards.find((ward) => ward.id === selectedWardId)
  const rooms = selectedWard?.rooms ?? []
  const selectedRoom = rooms.find((room) => room.id === selectedRoomId)
  const beds = selectedRoom?.beds ?? []

  function selectFloor(floorId: number | null) {
    setSelectedFloorId(floorId)
    setSelectedWardId(null)
    setSelectedRoomId(null)
  }

  function selectWard(wardId: number) {
    setSelectedWardId(wardId)
    setSelectedRoomId(null)
  }

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['floors'] })
  }

  function handleDeleted(type: DeleteTarget['type'], id: number) {
    if (type === 'floor' && id === selectedFloorId) selectFloor(null)
    if (type === 'ward' && id === selectedWardId) {
      setSelectedWardId(null)
      setSelectedRoomId(null)
    }
    if (type === 'room' && id === selectedRoomId) setSelectedRoomId(null)
    invalidate()
    setDeleteTarget(null)
  }

  const deleteFloorMutation = useMutation({
    mutationFn: deleteFloor,
    onSuccess: (_data, id) => {
      toast.success('تم حذف الطابق')
      handleDeleted('floor', id)
    },
  })

  const deleteWardMutation = useMutation({
    mutationFn: deleteWard,
    onSuccess: (_data, id) => {
      toast.success('تم حذف الجناح')
      handleDeleted('ward', id)
    },
  })

  const deleteRoomMutation = useMutation({
    mutationFn: deleteRoom,
    onSuccess: (_data, id) => {
      toast.success('تم حذف الغرفة')
      handleDeleted('room', id)
    },
  })

  const deleteBedMutation = useMutation({
    mutationFn: deleteBed,
    onSuccess: () => {
      toast.success('تم حذف السرير')
      handleDeleted('bed', 0)
    },
  })

  const deleteMutationByType: Record<DeleteTarget['type'], { mutate: (id: number) => void; isPending: boolean }> = {
    floor: deleteFloorMutation,
    ward: deleteWardMutation,
    room: deleteRoomMutation,
    bed: deleteBedMutation,
  }

  const previewColorFor = (value: AdmissionHeaderBg) => {
    switch (value) {
      case 'fillAlter':
        return token.colorFillAlter
      case 'primaryBg':
        return token.colorPrimaryBg
      case 'infoBg':
        return token.colorInfoBg
      case 'statusReactive':
        return token.colorSuccessBg
      default:
        return token.colorBgContainer
    }
  }

  return (
    <ConfigProvider direction="rtl" theme={antTheme}>
      <div>
        <h1 className="mb-4 text-xl font-semibold">الإعدادات</h1>

        <Tabs
          items={[
            {
              key: 'rooms',
              label: 'إدارة الغرف',
              children:
                floorsQuery.isLoading || floorDetailsQuery.isLoading ? (
                  <PageLoader />
                ) : (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <StructureColumn
                      title="الطوابق"
                      count={floors.length}
                      action={
                        <Button type="primary" size="small" onClick={() => setFloorDialog({ open: true })}>
                          + طابق جديد
                        </Button>
                      }
                      isEmpty={floors.length === 0}
                      emptyText="لا توجد طوابق بعد"
                    >
                      {floors.map((floor) => (
                        <StructureRow
                          key={floor.id}
                          selected={floor.id === selectedFloorId}
                          onSelect={() => selectFloor(floor.id)}
                          onEdit={() => setFloorDialog({ open: true, floor })}
                          onDelete={() => setDeleteTarget({ type: 'floor', id: floor.id, label: floor.name })}
                        >
                          <div className="font-bold">{floor.name} {floor.description && <span className="text-sm text-muted-foreground">({floor.description})</span>}</div>
                          <div className="text-xs text-muted-foreground">{floor.wards?.length ?? 0} جناح</div>
                        </StructureRow>
                      ))}
                    </StructureColumn>

                    <StructureColumn
                      title="الأجنحة"
                      count={wards.length}
                      action={
                        <Button
                          type="default"
                          size="small"
                          disabled={!selectedFloor}
                          onClick={() => selectedFloor && setWardDialog({ open: true, floorId: selectedFloor.id })}
                        >
                          + جناح جديد
                        </Button>
                      }
                      isEmpty={!selectedFloor || wards.length === 0}
                      emptyText={selectedFloor ? 'لا توجد أجنحة في هذا الطابق' : 'اختر طابقاً لعرض أجنحته'}
                    >
                      {wards.map((ward) => (
                        <StructureRow
                          key={ward.id}
                          selected={ward.id === selectedWardId}
                          onSelect={() => selectWard(ward.id)}
                          onEdit={() => selectedFloor && setWardDialog({ open: true, floorId: selectedFloor.id, ward })}
                          onDelete={() => setDeleteTarget({ type: 'ward', id: ward.id, label: ward.name })}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{ward.name}</span>
                            {ward.gender && (
                              <Tag>
                                {ward.gender === 'male' ? 'رجالي' : ward.gender === 'female' ? 'نسائي' : 'أطفال'}
                              </Tag>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">{ward.rooms?.length ?? 0} غرفة | {ward.description}</div>
                        </StructureRow>
                      ))}
                    </StructureColumn>

                    <StructureColumn
                      title="الغرف"
                      count={rooms.length}
                      action={
                        <Button
                          type="default"
                          size="small"
                          disabled={!selectedWard}
                          onClick={() => selectedWard && setRoomDialog({ open: true, wardId: selectedWard.id })}
                        >
                          + غرفة جديدة
                        </Button>
                      }
                      isEmpty={!selectedWard || rooms.length === 0}
                      emptyText={selectedWard ? 'لا توجد غرف في هذا الجناح' : 'اختر جناحاً لعرض غرفه'}
                    >
                      {rooms.map((room) => {
                        const typeStyle = getRoomTypeStyle(room.room_type)
                        return (
                          <StructureRow
                            key={room.id}
                            selected={room.id === selectedRoomId}
                            onSelect={() => setSelectedRoomId(room.id)}
                            style={{
                              borderInlineStart: `4px solid ${typeStyle.color}`,
                              backgroundColor: typeStyle.bg,
                            }}
                            onEdit={() => selectedWard && setRoomDialog({ open: true, wardId: selectedWard.id, room })}
                            onDelete={() =>
                              setDeleteTarget({ type: 'room', id: room.id, label: `غرفة ${room.room_number}` })
                            }
                          >
                            <div className="flex flex-wrap items-center gap-1 font-bold">
                              غرفة {room.room_number}
                              <Tag color={typeStyle.tagColor} className="ms-1">
                                {getRoomTypeName(roomTypesQuery.data, room.room_type)}
                              </Tag>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {room.price_per_day ? `${formatNumber(room.price_per_day)} / يوم` : 'السعر غير محدد'}
                              {' · '}
                              {room.beds?.length ?? 0} سرير
                            </div>
                          </StructureRow>
                        )
                      })}
                    </StructureColumn>

                    <StructureColumn
                      title="الأسرّة"
                      count={beds.length}
                      action={
                        <Button
                          type="default"
                          size="small"
                          disabled={!selectedRoom}
                          onClick={() => selectedRoom && setBedDialog({ open: true, roomId: selectedRoom.id })}
                        >
                          + سرير
                        </Button>
                      }
                      isEmpty={!selectedRoom || beds.length === 0}
                      emptyText={selectedRoom ? 'لا توجد أسرّة في هذه الغرفة' : 'اختر غرفة لعرض أسرّتها'}
                    >
                      {beds.map((bed) => (
                        <StructureRow
                          key={bed.id}
                          onEdit={() => selectedRoom && setBedDialog({ open: true, roomId: selectedRoom.id, bed })}
                          onDelete={() => setDeleteTarget({ type: 'bed', id: bed.id, label: `سرير ${bed.bed_number}` })}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              {bed.unit_type === 'chair' ? 'كرسي' : 'سرير'} {bed.bed_number}
                            </span>
                            <Tag color={BED_STATUS_VARIANT[bed.status]}>{BED_STATUS_LABEL[bed.status]}</Tag>
                          </div>
                          {bed.status === 'occupied' && bed.current_admission && (
                            <div className="text-xs text-muted-foreground">{bed.current_admission.patient.name}</div>
                          )}
                        </StructureRow>
                      ))}
                    </StructureColumn>
                  </div>
                ),
            },
            {
              key: 'chart-opening-service',
              label: 'خدمة فتح الملف',
              children: <ChartOpeningServiceSettingsTab />,
            },
            {
              key: 'facility-info',
              label: 'معلومات المنشأة',
              children: <FacilityInfoSettingsTab />,
            },
            {
              key: 'logo-stamp',
              label: 'الشعار والختم والعلامة المائية',
              children: <LogoStampSettingsTab />,
            },
            {
              key: 'payment-methods',
              label: 'طرق الدفع',
              children: <PaymentMethodsSettingsTab />,
            },
            {
              key: 'room-types',
              label: 'أنواع الغرف',
              children: <RoomTypesSettingsTab />,
            },
            {
              key: 'appearance',
              label: 'المظهر',
              children: (
                <div>
                  <h2 className="mb-3 text-base font-semibold text-muted-foreground">
                    خلفية رأس الصفحة (التنويم والمريض)
                  </h2>
                  <Radio.Group
                    value={admissionHeaderBg}
                    onChange={(e) => setAdmissionHeaderBg(e.target.value)}
                  >
                    <Flex gap={12} wrap="wrap">
                      {ADMISSION_HEADER_BG_OPTIONS.map((option) => (
                        <Radio.Button
                          key={option.value}
                          value={option.value}
                          style={{ height: 'auto', padding: 0 }}
                        >
                          <Flex align="center" gap={8} style={{ padding: '8px 12px' }}>
                            <span
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: 4,
                                backgroundColor: previewColorFor(option.value),
                                border: `1px solid ${token.colorBorder}`,
                                flexShrink: 0,
                              }}
                            />
                            {option.label}
                          </Flex>
                        </Radio.Button>
                      ))}
                    </Flex>
                  </Radio.Group>

                  <h2 className="mb-3 mt-6 text-base font-semibold text-muted-foreground">
                    حجم خط رأس صفحة التنويم
                  </h2>
                  <Radio.Group
                    value={admissionHeaderFontSize}
                    onChange={(e) => setAdmissionHeaderFontSize(e.target.value)}
                  >
                    <Flex gap={12} wrap="wrap">
                      {ADMISSION_HEADER_FONT_SIZE_OPTIONS.map((option) => (
                        <Radio.Button
                          key={option.value}
                          value={option.value}
                          style={{ height: 'auto', padding: 0 }}
                        >
                          <Flex
                            align="center"
                            gap={8}
                            style={{ padding: '8px 12px', fontSize: ADMISSION_HEADER_FONT_SIZE_PX[option.value].name }}
                          >
                            {option.label}
                          </Flex>
                        </Radio.Button>
                      ))}
                    </Flex>
                  </Radio.Group>
                </div>
              ),
            },
          ]}
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
