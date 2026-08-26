import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { SlidersHorizontal } from 'lucide-react'
import dayjs from 'dayjs'
import { ConfigProvider, Card, Tag, Typography, Row, Col, Flex, Space, Popover, Button, Segmented } from 'antd'
import { useAntTheme } from '@/lib/antdTheme'
import { PageLoader } from '@/components/common/PageLoader'
import { getFloors, getFloor } from '@/services/facilityService'
import type { BedStatus, Room } from '@/types/facility'

const { Title, Text } = Typography

const BED_STATUS_LABEL: Record<BedStatus, string> = {
  available: 'متاح',
  occupied: 'مشغول',
  maintenance: 'صيانة',
}

const ROOM_TYPE_TAG: Record<Room['room_type'], { label: string; color: string }> = {
  normal: { label: 'عادية', color: 'default' },
  vip: { label: 'VIP', color: 'warning' },
  operation: { label: 'عمليات', color: 'red' },
  ward: { label: 'عنبر', color: 'blue' },
}

const BED_STATUS_COLORS: Record<BedStatus, { border: string; background: string; color: string }> = {
  available: { border: '#16a34a80', background: '#16a34a1a', color: '#16a34a' },
  occupied: { border: '#dc262680', background: '#dc26261a', color: '#dc2626' },
  maintenance: { border: '#d9770680', background: '#d977061a', color: '#d97706' },
}

const GENDER_LABEL: Record<string, string> = {
  male: 'رجال',
  female: 'نساء',
  children: 'أطفال',
}

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
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout))
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
        <Segmented
          block
          value={layout.floors}
          onChange={(v) => onChange({ ...layout, floors: Number(v) })}
          options={[1, 2, 3]}
        />
      </div>
      <div>
        <Text style={{ fontSize: 12 }} type="secondary">
          الغرف في الصف
        </Text>
        <Segmented
          block
          value={layout.rooms}
          onChange={(v) => onChange({ ...layout, rooms: Number(v) })}
          options={[1, 2, 3, 4]}
        />
      </div>
      <div>
        <Text style={{ fontSize: 12 }} type="secondary">
          الأسرّة في الصف
        </Text>
        <Segmented
          block
          value={layout.beds}
          onChange={(v) => onChange({ ...layout, beds: Number(v) })}
          options={[2, 3, 4, 6]}
        />
      </div>
    </Space>
  )
}

export function FacilityMapPage() {
  const antTheme = useAntTheme()
  const navigate = useNavigate()
  const [layout, setLayout] = useMapLayout()

  const floorsQuery = useQuery({ queryKey: ['floors'], queryFn: getFloors })

  const floorDetailsQuery = useQuery({
    queryKey: ['floors', 'map', floorsQuery.data?.map((f) => f.id)],
    queryFn: async () => {
      const floors = floorsQuery.data ?? []
      return Promise.all(floors.map((f) => getFloor(f.id)))
    },
    enabled: !!floorsQuery.data && floorsQuery.data.length > 0,
  })

  const floors = floorDetailsQuery.data ?? []

  return (
    <ConfigProvider direction="rtl" theme={antTheme}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={12} style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          خريطة المستشفى
        </Title>
        <Flex align="center" gap={16}>
          <Space size={16}>
            {(Object.keys(BED_STATUS_LABEL) as BedStatus[]).map((status) => (
              <Space key={status} size={6}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 12,
                    height: 12,
                    borderRadius: 2,
                    border: `1px solid ${BED_STATUS_COLORS[status].border}`,
                    background: BED_STATUS_COLORS[status].background,
                  }}
                />
                <Text style={{ fontSize: 12 }}>{BED_STATUS_LABEL[status]}</Text>
              </Space>
            ))}
          </Space>
          <Popover
            trigger="click"
            placement="bottomLeft"
            title="طريقة العرض"
            content={<LayoutSettings layout={layout} onChange={setLayout} />}
          >
            <Button icon={<SlidersHorizontal size={14} />}>طريقة العرض</Button>
          </Popover>
        </Flex>
      </Flex>

      {floorDetailsQuery.isLoading && <PageLoader />}

      {!floorDetailsQuery.isLoading && floors.length === 0 && <Text type="secondary">لا يوجد طوابق بعد</Text>}

      <Row gutter={[24, 24]}>
        {floors.map((floor) => (
          <Col key={floor.id} xs={24} md={24 / layout.floors}>
            <Card title={floor.name} style={{ height: '100%' }}>
              {(floor.wards ?? []).length === 0 && <Text type="secondary">لا توجد أجنحة في هذا الطابق</Text>}

              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                {(floor.wards ?? []).map((ward) => (
                  <Card
                    key={ward.id}
                    type="inner"
                    size="small"
                    title={
                      <Space>
                        {ward.name}
                        {ward.gender && <Tag>{GENDER_LABEL[ward.gender] ?? ward.gender}</Tag>}
                      </Space>
                    }
                  >
                    <Row gutter={[12, 12]}>
                      {(ward.rooms ?? []).map((room) => (
                        <Col key={room.id} xs={24} md={24 / layout.rooms}>
                          <Card size="small" style={{ height: '100%' }}>
                            <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
                              <Text strong style={{ fontSize: 13 }}>
                                غرفة {room.room_number}
                              </Text>
                              <Tag color={ROOM_TYPE_TAG[room.room_type].color}>
                                {ROOM_TYPE_TAG[room.room_type].label}
                              </Tag>
                            </Flex>
                            {(room.beds ?? []).length === 0 ? (
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                لا توجد أسرّة
                              </Text>
                            ) : (
                              <div
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: `repeat(${layout.beds}, minmax(0, 1fr))`,
                                  gap: 8,
                                }}
                              >
                                {(room.beds ?? []).map((bed) => {
                                  const admission = bed.current_admission
                                  const colors = BED_STATUS_COLORS[bed.status]
                                  return (
                                    <button
                                      key={bed.id}
                                      type="button"
                                      disabled={!admission}
                                      onClick={() => admission && navigate(`/admissions/${admission.id}`)}
                                      style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'flex-start',
                                        gap: 2,
                                        borderRadius: 6,
                                        border: `1px solid ${colors.border}`,
                                        background: colors.background,
                                        color: colors.color,
                                        padding: '6px 8px',
                                        fontSize: 12,
                                        textAlign: 'start',
                                        cursor: admission ? 'pointer' : 'default',
                                        overflow: 'hidden',
                                      }}
                                    >
                                      <span style={{ fontWeight: 600 }}>سرير {bed.bed_number}</span>
                                      <span
                                        style={{
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          width: '100%',
                                        }}
                                      >
                                        {admission ? admission.patient.name : BED_STATUS_LABEL[bed.status]}
                                      </span>
                                      {admission && (
                                        <span style={{ fontSize: 11, opacity: 0.8 }}>
                                          {Math.max(0, dayjs().diff(dayjs(admission.admission_date), 'day')) + 1} يوم
                                        </span>
                                      )}
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </Card>
                ))}
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </ConfigProvider>
  )
}
