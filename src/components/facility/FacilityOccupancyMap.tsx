import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Armchair, BedDouble, Building2, CalendarClock, DoorClosed, SlidersHorizontal, Wrench } from 'lucide-react'
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Popover,
  Progress,
  Row,
  Segmented,
  Space,
  Statistic,
  Tag,
  Typography,
} from 'antd'
import dayjs from '@/lib/dayjs'
import { PageLoader } from '@/components/common/PageLoader'
import { getFloors, getFloor, setRoomBedsStatus } from '@/services/facilityService'
import { getOccupancyStatistics } from '@/services/statisticsService'
import { getRoomTypes } from '@/services/roomTypeService'
import { getRoomTypeName, getRoomTypeStyle } from '@/lib/roomTypes'
import type { Bed, BedStatus, Floor, Room, Ward } from '@/types/facility'

const { Title, Text } = Typography

const BED_STATUS_LABEL: Record<BedStatus, string> = {
  available: 'متاح',
  occupied: 'مشغول',
  maintenance: 'صيانة',
}

const BED_STATUS_COLORS: Record<BedStatus, { border: string; background: string; color: string }> = {
  available: { border: '#16a34a80', background: '#16a34a14', color: '#16a34a' },
  occupied: { border: '#dc262680', background: '#dc262614', color: '#dc2626' },
  maintenance: { border: '#d9770680', background: '#d9770614', color: '#d97706' },
}

const GENDER_LABEL: Record<string, string> = {
  male: 'رجال',
  female: 'نساء',
  children: 'أطفال',
}

const OCCUPANCY_COLOR = (pct: number) => (pct >= 85 ? '#dc2626' : pct >= 60 ? '#d97706' : '#16a34a')

function stayDays(admissionDate: string) {
  return Math.max(0, dayjs().diff(dayjs(admissionDate), 'day')) + 1
}

function collectBeds(floors: Floor[]): Bed[] {
  return floors.flatMap((f) =>
    (f.wards ?? []).flatMap((w) => (w.rooms ?? []).flatMap((r) => r.beds ?? [])),
  )
}

function bedStats(beds: Bed[]) {
  const total = beds.length
  const occupied = beds.filter((b) => b.status === 'occupied').length
  const available = beds.filter((b) => b.status === 'available').length
  const maintenance = beds.filter((b) => b.status === 'maintenance').length
  const occupancyRate = total ? Math.round((occupied / total) * 100) : 0
  return { total, occupied, available, maintenance, occupancyRate }
}

/* ------------------------------------------------------------------ */
/* Layout preferences                                                  */
/* ------------------------------------------------------------------ */

interface MapLayout {
  floors: number
  rooms: number
}

const DEFAULT_LAYOUT: MapLayout = { floors: 2, rooms: 3 }
const LAYOUT_STORAGE_KEY = 'facility-map-layout'

function useMapLayout() {
  const [layout, setLayout] = useState<MapLayout>(() => {
    try {
      const stored = localStorage.getItem(LAYOUT_STORAGE_KEY)
      return stored ? { ...DEFAULT_LAYOUT, ...JSON.parse(stored) } : DEFAULT_LAYOUT
    } catch {
      return DEFAULT_LAYOUT
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout))
    } catch {
      /* ignore quota / private-mode errors */
    }
  }, [layout])

  return [layout, setLayout] as const
}

function LayoutSettings({ layout, onChange }: { layout: MapLayout; onChange: (layout: MapLayout) => void }) {
  return (
    <Space direction="vertical" size={14} style={{ width: 220 }}>
      <div>
        <Text style={{ fontSize: 12 }} type="secondary">
          الطوابق في الصف
        </Text>
        <Segmented block value={layout.floors} onChange={(v) => onChange({ ...layout, floors: Number(v) })} options={[1, 2, 3]} />
      </div>
      <div>
        <Text style={{ fontSize: 12 }} type="secondary">
          الغرف في الصف
        </Text>
        <Segmented block value={layout.rooms} onChange={(v) => onChange({ ...layout, rooms: Number(v) })} options={[1, 2, 3, 4]} />
      </div>
    </Space>
  )
}

/* ------------------------------------------------------------------ */
/* Presentation pieces                                                 */
/* ------------------------------------------------------------------ */

function MapLegend() {
  return (
    <Space size={14} wrap>
      {(Object.keys(BED_STATUS_LABEL) as BedStatus[]).map((status) => (
        <Space key={status} size={6}>
          <span
            style={{
              display: 'inline-block',
              width: 12,
              height: 12,
              borderRadius: 3,
              border: `1px solid ${BED_STATUS_COLORS[status].border}`,
              background: BED_STATUS_COLORS[status].background,
            }}
          />
          <Text style={{ fontSize: 12 }}>{BED_STATUS_LABEL[status]}</Text>
        </Space>
      ))}
    </Space>
  )
}

function SummaryBar({ beds, dischargedToday }: { beds: Bed[]; dischargedToday: number }) {
  const s = bedStats(beds)
  return (
    <Card styles={{ body: { padding: 16 } }}>
      {/* <Row gutter={[16, 16]} align="middle">
        <Col xs={24} md={8}>
          <Flex align="center" gap={16}>
            <Progress
              type="dashboard"
              size={78}
              percent={s.occupancyRate}
              strokeColor={OCCUPANCY_COLOR(s.occupancyRate)}
              format={(p) => <span style={{ fontSize: 16, fontWeight: 600 }}>{p}%</span>}
            />
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                نسبة الإشغال
              </Text>
              <div style={{ fontSize: 15, fontWeight: 600 }}>
                {s.occupied} من {s.total} سرير
              </div>
            </div>
          </Flex>
        </Col>
        <Col xs={12} md={4}>
          <Statistic title="إجمالي الأسرّة" value={s.total} />
        </Col>
        <Col xs={12} md={4}>
          <Statistic title="مشغولة" value={s.occupied} valueStyle={{ color: BED_STATUS_COLORS.occupied.color }} />
        </Col>
        <Col xs={12} md={4}>
          <Statistic title="متاحة" value={s.available} valueStyle={{ color: BED_STATUS_COLORS.available.color }} />
        </Col>
        <Col xs={12} md={4}>
          <Statistic title="صيانة" value={s.maintenance} valueStyle={{ color: BED_STATUS_COLORS.maintenance.color }} />
        </Col>
        <Col xs={12} md={4}>
          <Statistic title="خروج اليوم" value={dischargedToday} />
        </Col>
      </Row> */}
    </Card>
  )
}

/** Just the bed-occupancy summary row, for embedding where the full floor/room map is too much (e.g. the dashboard). */
function SummaryStat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold" style={{ color }}>
        {value}
      </div>
    </div>
  )
}

export function FacilityOccupancySummary() {
  const floorsQuery = useQuery({ queryKey: ['floors'], queryFn: getFloors })
  const occupancyQuery = useQuery({ queryKey: ['statistics', 'occupancy'], queryFn: getOccupancyStatistics })

  const floorDetailsQuery = useQuery({
    queryKey: ['floors', 'map', floorsQuery.data?.map((f) => f.id)],
    queryFn: async () => {
      const floors = floorsQuery.data ?? []
      return Promise.all(floors.map((f) => getFloor(f.id)))
    },
    enabled: !!floorsQuery.data && floorsQuery.data.length > 0,
  })

  const floors = floorDetailsQuery.data ?? []
  const allBeds = collectBeds(floors)
  const isLoading = floorsQuery.isLoading || (floorDetailsQuery.isLoading && !!floorsQuery.data?.length)

  if (isLoading) return <PageLoader />

  const s = bedStats(allBeds)
  const dischargedToday = occupancyQuery.data?.summary.discharged_today ?? 0

  return (
    <Card styles={{ body: { padding: 16 } }}>
      <h2 className="mb-3 text-sm font-semibold">حالة الأسرّة</h2>

      <div className="grid grid-cols-5 gap-2">
        <SummaryStat label="إجمالي الأسرّة" value={s.total} />
        <SummaryStat label="مشغولة" value={s.occupied} color={BED_STATUS_COLORS.occupied.color} />
        <SummaryStat label="متاحة" value={s.available} color={BED_STATUS_COLORS.available.color} />
        <SummaryStat label="صيانة" value={s.maintenance} color={BED_STATUS_COLORS.maintenance.color} />
        <SummaryStat label="خروج اليوم" value={dischargedToday} />
      </div>

      <div className="mt-4 flex flex-col items-center">
        <Progress
          type="circle"
          size={72}
          percent={s.occupancyRate}
          strokeColor={OCCUPANCY_COLOR(s.occupancyRate)}
          format={(p) => <span className="text-sm font-semibold">{p}%</span>}
        />
        <span className="mt-1 text-xs text-muted-foreground">نسبة الإشغال</span>
      </div>
    </Card>
  )
}

function BedTile({ bed, onOpen }: { bed: Bed; onOpen: (admissionId: number) => void }) {
  const colors = BED_STATUS_COLORS[bed.status]
  const admission = bed.current_admission
  const days = admission ? stayDays(admission.admission_date) : null
  const Icon = bed.unit_type === 'chair' ? Armchair : BedDouble

  const tile = (
    <button
      type="button"
      className="facility-bed-tile"
      disabled={!admission}
      onClick={() => admission && onOpen(admission.id)}
      style={{
        width: '100%',
        minHeight: 74,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        borderRadius: 8,
        border: `1px solid ${colors.border}`,
        background: colors.background,
        color: 'inherit',
        padding: '8px 10px',
        textAlign: 'start',
        cursor: admission ? 'pointer' : 'default',
      }}
    >
      <Flex align="center" justify="space-between" gap={6}>
        <Flex align="center" gap={4} style={{ color: colors.color, fontWeight: 600, fontSize: 12 }}>
          <Icon size={13} />
          {bed.unit_type === 'chair' ? 'كرسي' : 'سرير'} {bed.bed_number}
        </Flex>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: colors.color, flexShrink: 0 }} />
      </Flex>
      <span
        style={{
          fontSize: 12,
          fontWeight: admission ? 600 : 400,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          width: '100%',
        }}
      >
        {admission ? admission.patient.name : BED_STATUS_LABEL[bed.status]}
      </span>
      {days != null && (
        <Flex align="center" gap={3} style={{ fontSize: 11, opacity: 0.7 }}>
          <CalendarClock size={11} />
          اليوم {days}
        </Flex>
      )}
    </button>
  )

  if (!admission) return tile

  return (
    <Popover
      placement="top"
      content={
        <Space direction="vertical" size={2} style={{ maxWidth: 220 }}>
          <Text strong>{admission.patient.name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            تاريخ الدخول: {dayjs(admission.admission_date).format('YYYY-MM-DD')}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            مدة الإقامة: {days} يوم
          </Text>
          <Text style={{ fontSize: 12 }}>اضغط لفتح ملف الدخول</Text>
        </Space>
      }
    >
      {tile}
    </Popover>
  )
}

function RoomMaintenanceAction({ room }: { room: Room }) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  const mutation = useMutation({
    mutationFn: (status: Extract<BedStatus, 'available' | 'maintenance'>) => setRoomBedsStatus(room.id, status),
    onSuccess: ({ updated, skipped }, status) => {
      const action = status === 'maintenance' ? 'وضع الغرفة تحت الصيانة' : 'إعادة الغرفة للخدمة'
      const message =
        skipped > 0
          ? `${action}: تم تحديث ${updated} سرير، وتخطي ${skipped} لوجود مريض حالياً به`
          : `${action}: تم تحديث ${updated} سرير`
      toast.success(message)
      queryClient.invalidateQueries({ queryKey: ['floors'] })
      setOpen(false)
    },
  })

  return (
    <Popover
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomLeft"
      content={
        <Space direction="vertical" size={4} onClick={(e) => e.stopPropagation()}>
          <Button
            size="small"
            block
            loading={mutation.isPending}
            onClick={() => mutation.mutate('maintenance')}
          >
            وضع الغرفة تحت الصيانة
          </Button>
          <Button size="small" block loading={mutation.isPending} onClick={() => mutation.mutate('available')}>
            إعادة الغرفة للخدمة
          </Button>
        </Space>
      }
    >
      <Button
        size="small"
        type="text"
        icon={<Wrench size={14} />}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
      />
    </Popover>
  )
}

function RoomCard({ room, onOpen }: { room: Room; onOpen: (id: number) => void }) {
  const roomTypesQuery = useQuery({ queryKey: ['room-types'], queryFn: getRoomTypes })
  const beds = room.beds ?? []
  const occupied = beds.filter((b) => b.status === 'occupied').length

  return (
    <Card size="small" style={{ height: '100%' }} styles={{ body: { padding: 12 } }}>
      <Flex justify="space-between" align="center" gap={8} style={{ marginBottom: 10 }}>
        <Space size={6}>
          <DoorClosed size={14} />
          <Text strong style={{ fontSize: 13 }}>
            غرفة {room.room_number}    <Tag color={getRoomTypeStyle(room.room_type).tagColor} style={{ marginInlineEnd: 0 }}>
            {getRoomTypeName(roomTypesQuery.data, room.room_type)}
          </Tag>
          </Text>
        </Space>
        <Space size={6}>
          {beds.length > 0 && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              {occupied}/{beds.length}
            </Text>
          )}
          <RoomMaintenanceAction room={room} />
        </Space>
      </Flex>

      {beds.length === 0 ? (
        <Text type="secondary" style={{ fontSize: 12 }}>
          لا توجد أسرّة
        </Text>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
            gap: 8,
          }}
        >
          {beds.map((bed) => (
            <BedTile key={bed.id} bed={bed} onOpen={onOpen} />
          ))}
        </div>
      )}
    </Card>
  )
}

function WardSection({
  ward,
  roomsPerRow,
  onOpen,
}: {
  ward: Ward
  roomsPerRow: number
  onOpen: (id: number) => void
}) {
  const rooms = ward.rooms ?? []
  const beds = rooms.flatMap((r) => r.beds ?? [])
  const s = bedStats(beds)

  return (
    <Card
      type="inner"
      size="small"
      title={
        <Flex align="center" gap={8} wrap="wrap">
          <Text strong>{ward.name}</Text>
          {ward.gender && <Tag color="blue">{GENDER_LABEL[ward.gender] ?? ward.gender}</Tag>}
        </Flex>
      }
      extra={
        s.total > 0 && (
          <Space size={8} align="center">
            <Text type="secondary" style={{ fontSize: 12 }}>
              {s.occupied}/{s.total}
            </Text>
            <Progress
              type="circle"
              size={34}
              percent={s.occupancyRate}
              strokeColor={OCCUPANCY_COLOR(s.occupancyRate)}
            />
          </Space>
        )
      }
    >
      {rooms.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="لا توجد غرف في هذا الجناح" />
      ) : (
        <Row gutter={[12, 12]}>
          {rooms.map((room) => (
            <Col key={room.id} xs={24} sm={12} md={24 / roomsPerRow}>
              <RoomCard room={room} onOpen={onOpen} />
            </Col>
          ))}
        </Row>
      )}
    </Card>
  )
}

function FloorPanel({ floor, layout, onOpen }: { floor: Floor; layout: MapLayout; onOpen: (id: number) => void }) {
  const wards = floor.wards ?? []
  const s = bedStats(collectBeds([floor]))

  return (
    <Card
      style={{ height: '100%' }}
      title={
        <Space size={8}>
          <Building2 size={16} />
          <span>{floor.name}</span>
        </Space>
      }
      extra={
        s.total > 0 && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {s.occupied}/{s.total} مشغول · {s.occupancyRate}%
          </Text>
        )
      }
    >
      {wards.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="لا توجد أجنحة في هذا الطابق" />
      ) : (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          {wards.map((ward) => (
            <WardSection
              key={ward.id}
              ward={ward}
              roomsPerRow={layout.rooms}
              onOpen={onOpen}
            />
          ))}
        </Space>
      )}
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* Shared component                                                    */
/* ------------------------------------------------------------------ */

interface FacilityOccupancyMapProps {
  title?: string
  description?: string
}

/** Floors/wards/rooms/beds occupancy map. Shared by {@link FacilityMapPage} and the dashboard. */
export function FacilityOccupancyMap({
  title = 'خريطة الغرف والأسرّة',
  description = 'توزيع المرضى على الطوابق والأجنحة والأسرّة',
}: FacilityOccupancyMapProps) {
  const navigate = useNavigate()
  const [layout, setLayout] = useMapLayout()
  const [activeFloor, setActiveFloor] = useState<string>('all')

  const floorsQuery = useQuery({ queryKey: ['floors'], queryFn: getFloors })
  const occupancyQuery = useQuery({ queryKey: ['statistics', 'occupancy'], queryFn: getOccupancyStatistics })

  const floorDetailsQuery = useQuery({
    queryKey: ['floors', 'map', floorsQuery.data?.map((f) => f.id)],
    queryFn: async () => {
      const floors = floorsQuery.data ?? []
      return Promise.all(floors.map((f) => getFloor(f.id)))
    },
    enabled: !!floorsQuery.data && floorsQuery.data.length > 0,
  })

  const floors = useMemo(() => floorDetailsQuery.data ?? [], [floorDetailsQuery.data])
  const allBeds = useMemo(() => collectBeds(floors), [floors])
  const visibleFloors = activeFloor === 'all' ? floors : floors.filter((f) => String(f.id) === activeFloor)

  const isLoading = floorsQuery.isLoading || (floorDetailsQuery.isLoading && !!floorsQuery.data?.length)
  const isError = floorsQuery.isError || floorDetailsQuery.isError

  const openAdmission = (admissionId: number) => navigate(`/admissions?admission_id=${admissionId}`)

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <style>{`
        .facility-bed-tile { transition: transform .15s ease, box-shadow .15s ease; }
        .facility-bed-tile:not(:disabled):hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,.14); }
        .facility-bed-tile:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
      `}</style>

      <Flex justify="space-between" align="flex-start" wrap="wrap" gap={12}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            {title}
          </Title>
          <Text type="secondary">{description}</Text>
        </div>
        <Space wrap align="center" size={16}>
          <MapLegend />
          <Popover
            trigger="click"
            placement="bottomLeft"
            title="طريقة العرض"
            content={<LayoutSettings layout={layout} onChange={setLayout} />}
          >
            <Button icon={<SlidersHorizontal size={14} />}>طريقة العرض</Button>
          </Popover>
        </Space>
      </Flex>

      {isError && (
        <Alert
          type="error"
          showIcon
          message="تعذّر تحميل خريطة المرفق"
          description="يرجى المحاولة مرة أخرى لاحقاً."
        />
      )}

      {isLoading && <PageLoader />}

      {!isLoading && !isError && floors.length === 0 && (
        <Card>
          <Empty description="لا يوجد طوابق بعد" />
        </Card>
      )}

      {!isLoading && !isError && floors.length > 0 && (
        <>
          <SummaryBar beds={allBeds} dischargedToday={occupancyQuery.data?.summary.discharged_today ?? 0} />

          {floors.length > 1 && (
            <Segmented
              value={activeFloor}
              onChange={(v) => setActiveFloor(String(v))}
              options={[
                { label: 'كل الطوابق', value: 'all' },
                ...floors.map((f) => ({ label: f.name, value: String(f.id) })),
              ]}
            />
          )}

          <Row gutter={[16, 16]}>
            {visibleFloors.map((floor) => (
              <Col key={floor.id} xs={24} md={activeFloor === 'all' ? 24 / layout.floors : 24}>
                <FloorPanel floor={floor} layout={layout} onOpen={openAdmission} />
              </Col>
            ))}
          </Row>
        </>
      )}
    </Space>
  )
}
