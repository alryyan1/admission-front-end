import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Armchair, BedDouble, Building2, CalendarClock, DoorClosed, SlidersHorizontal } from 'lucide-react'
import {
  Alert,
  Button,
  Card,
  Col,
  ConfigProvider,
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
import { useAntTheme } from '@/lib/antdTheme'
import { PageLoader } from '@/components/common/PageLoader'
import { getFloors, getFloor } from '@/services/facilityService'
import type { Bed, BedStatus, Floor, Room, Ward } from '@/types/facility'

const { Title, Text } = Typography

const BED_STATUS_LABEL: Record<BedStatus, string> = {
  available: 'متاح',
  occupied: 'مشغول',
  maintenance: 'صيانة',
}

const ROOM_TYPE_TAG: Record<Room['room_type'], { label: string; color: string }> = {
  normal: { label: 'عادية', color: 'default' },
  vip: { label: 'VIP', color: 'gold' },
  operation: { label: 'عمليات', color: 'red' },
  ward: { label: 'عنبر', color: 'blue' },
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
  beds: number
}

const DEFAULT_LAYOUT: MapLayout = { floors: 1, rooms: 3, beds: 4 }
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
      <div>
        <Text style={{ fontSize: 12 }} type="secondary">
          الأسرّة في الصف
        </Text>
        <Segmented block value={layout.beds} onChange={(v) => onChange({ ...layout, beds: Number(v) })} options={[2, 3, 4, 6]} />
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

function SummaryBar({ beds }: { beds: Bed[] }) {
  const s = bedStats(beds)
  return (
    <Card styles={{ body: { padding: 16 } }}>
      <Row gutter={[16, 16]} align="middle">
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
      </Row>
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

function RoomCard({ room, bedsPerRow, onOpen }: { room: Room; bedsPerRow: number; onOpen: (id: number) => void }) {
  const beds = room.beds ?? []
  const occupied = beds.filter((b) => b.status === 'occupied').length

  return (
    <Card size="small" style={{ height: '100%' }} styles={{ body: { padding: 12 } }}>
      <Flex justify="space-between" align="center" gap={8} style={{ marginBottom: 10 }}>
        <Space size={6}>
          <DoorClosed size={14} />
          <Text strong style={{ fontSize: 13 }}>
            غرفة {room.room_number}
          </Text>
        </Space>
        <Space size={6}>
          {beds.length > 0 && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              {occupied}/{beds.length}
            </Text>
          )}
          <Tag color={ROOM_TYPE_TAG[room.room_type].color} style={{ marginInlineEnd: 0 }}>
            {ROOM_TYPE_TAG[room.room_type].label}
          </Tag>
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
            gridTemplateColumns: `repeat(${bedsPerRow}, minmax(0, 1fr))`,
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
  bedsPerRow,
  onOpen,
}: {
  ward: Ward
  roomsPerRow: number
  bedsPerRow: number
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
              <RoomCard room={room} bedsPerRow={bedsPerRow} onOpen={onOpen} />
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
              bedsPerRow={layout.beds}
              onOpen={onOpen}
            />
          ))}
        </Space>
      )}
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function FacilityMapPage() {
  const antTheme = useAntTheme()
  const navigate = useNavigate()
  const [layout, setLayout] = useMapLayout()
  const [activeFloor, setActiveFloor] = useState<string>('all')

  const floorsQuery = useQuery({ queryKey: ['floors'], queryFn: getFloors })

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

  const openAdmission = (admissionId: number) => navigate(`/admissions/${admissionId}`)

  return (
    <ConfigProvider direction="rtl" theme={antTheme}>
      <style>{`
        .facility-bed-tile { transition: transform .15s ease, box-shadow .15s ease; }
        .facility-bed-tile:not(:disabled):hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,.14); }
        .facility-bed-tile:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
      `}</style>

      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Flex justify="space-between" align="flex-start" wrap="wrap" gap={12}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              خريطة الغرف والأسرّة
            </Title>
            <Text type="secondary">توزيع المرضى على الطوابق والأجنحة والأسرّة</Text>
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
            <SummaryBar beds={allBeds} />

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
    </ConfigProvider>
  )
}
