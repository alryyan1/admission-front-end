import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ConfigProvider, Card, Button, Typography, Tabs, Table, Tag, Flex, DatePicker, Input, Select, Progress, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useAntTheme } from '@/lib/antdTheme'
import { getAdmissions } from '@/services/admissionService'
import { getRooms, getBeds } from '@/services/facilityService'
import { NewAdmissionDialog } from '@/components/admissions/NewAdmissionDialog'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import type { Admission, AdmissionStatus } from '@/types/admission'
import type { Room } from '@/types/facility'
import dayjs, { type Dayjs } from 'dayjs'

const { Title } = Typography
const { RangePicker } = DatePicker

const STATUS_LABEL: Record<AdmissionStatus, string> = {
  admitted: 'نشطة',
  discharged: 'مخرّجة',
  cancelled: 'ملغاة',
}

const ROOM_TYPE_LABEL: Record<Room['room_type'], string> = {
  normal: 'عادية',
  vip: 'VIP',
  operation: 'عمليات',
  ward: 'عنبر',
}

const STATUS_TABS: { key: AdmissionStatus; label: string }[] = [
  { key: 'admitted', label: 'نشطة' },
  { key: 'discharged', label: 'مخرّجة' },
  { key: 'cancelled', label: 'ملغاة' },
]

export function AdmissionsPage() {
  const antTheme = useAntTheme()
  const navigate = useNavigate()
  const [status, setStatus] = useState<AdmissionStatus>('admitted')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ])
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [roomId, setRoomId] = useState<number | null>(null)
  const [bedId, setBedId] = useState<number | null>(null)

  const from = dateRange?.[0]?.startOf('day').toISOString()
  const to = dateRange?.[1]?.endOf('day').toISOString()

  const roomsQuery = useQuery({ queryKey: ['rooms'], queryFn: () => getRooms() })
  const bedsQuery = useQuery({
    queryKey: ['beds', roomId],
    queryFn: () => getBeds(roomId ?? undefined),
    enabled: !!roomId,
  })

  const admissionsQuery = useQuery({
    queryKey: ['admissions', status, from, to, debouncedSearch, roomId, bedId],
    queryFn: () =>
      getAdmissions({
        status,
        from,
        to,
        search: debouncedSearch || undefined,
        room_id: roomId ?? undefined,
        bed_id: bedId ?? undefined,
      }),
  })

  const columns: ColumnsType<Admission> = [
    { title: 'رقم التنويم', dataIndex: 'id', key: 'id', render: (v) => v ?? '—' },
    {
      title: 'المريض',
      key: 'patient',
      render: (_, admission) => (
        <Flex align="center" gap={6}>
          {admission.patient?.name}
          {!!admission.operations_count && <Tag>عملية</Tag>}
        </Flex>
      ),
    },
    {
      title: 'الطابق',
      key: 'floor',
      render: (_, admission) => admission.bed?.room?.ward?.floor?.name ?? '—',
    },
    {
      title: 'الجناح',
      key: 'ward',
      render: (_, admission) => admission.bed?.room?.ward?.name ?? '—',
    },
    {
      title: 'نوع الغرفة',
      key: 'room_type',
      render: (_, admission) =>
        admission.bed?.room?.room_type ? ROOM_TYPE_LABEL[admission.bed.room.room_type] : '—',
    },
    {
      title: 'الغرفة / السرير',
      key: 'bed',
      render: (_, admission) => {
        const roomNumber = admission.bed?.room?.room_number
        const bedNumber = admission.bed?.bed_number
        if (!roomNumber && !bedNumber) return '—'
        return [roomNumber && `غرفة ${roomNumber}`, bedNumber && `سرير ${bedNumber}`].filter(Boolean).join(' / ')
      },
    },
    {
      title: 'الطبيب المعالج',
      key: 'doctor',
      render: (_, admission) => admission.admitting_doctor?.name ?? '—',
    },
    {
      title: 'تاريخ الدخول',
      key: 'admission_date',
      render: (_, admission) => dayjs(admission.admission_date).format('YYYY-MM-DD HH:mm A'),
    },
    {
      title: 'عدد الأيام',
      key: 'days',
      render: (_, admission) => {
        const isShortStay = admission.bed?.room?.is_short_stay
        if (isShortStay) {
          return 'إقامة قصيرة'
        }
        console.log('isShortStay', isShortStay, admission.bed?.room?.is_short_stay)
        const end = admission.discharge_date ? dayjs(admission.discharge_date) : dayjs()
        const hoursElapsed = Math.max(0, end.diff(dayjs(admission.admission_date), 'hour'))
        const days = Math.floor(hoursElapsed / 24)
        const dayProgress = Math.round(((hoursElapsed % 24) / 24) * 100)
        return (
          <Flex vertical gap={2} style={{ minWidth: 110 }}>
            <span>{days} يوم</span>
            <Tooltip title={`${dayProgress}% من اليوم ${days + 1}`}>
              <Progress percent={dayProgress} size="small" showInfo={false} />
            </Tooltip>
          </Flex>
        )
      },
    },

  ]

  return (
    <ConfigProvider direction="rtl" theme={antTheme}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Flex align="center" gap={10}>
          <Title level={3} style={{ margin: 0 }}>
            حالات التنويم
          </Title>
          <Tag color="blue">{admissionsQuery.data?.data.length ?? 0} حالة</Tag>
        </Flex>
        <Button type="primary" onClick={() => setDialogOpen(true)}>
          + تنويم جديد
        </Button>
      </Flex>

      <Flex justify="space-between" align="center" gap={1}>
        <Tabs
          activeKey={status}
          onChange={(key) => setStatus(key as AdmissionStatus)}
          items={STATUS_TABS.map((tab) => ({ key: tab.key, label: tab.label }))}
        />
        <Flex align="center" gap={5} wrap="nowrap">
          <Input
            style={{ maxWidth: 240 }}
            placeholder="بحث باسم المريض..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />
          <RangePicker
            value={dateRange}
            onChange={(values) => setDateRange(values as [Dayjs, Dayjs] | null)}
            format="YYYY-MM-DD"
            allowClear
            placeholder={['من تاريخ', 'إلى تاريخ']}
          />
          <Select
            style={{ width: 400 }}
            placeholder="الغرفة"
            allowClear
            showSearch
            optionFilterProp="label"
            loading={roomsQuery.isLoading}
            value={roomId ?? undefined}
            onChange={(value) => {
              setRoomId(value ?? null)
              setBedId(null)
            }}
            options={[...(roomsQuery.data ?? [])]
              .sort((a, b) => {
                const floorCompare = (a.ward?.floor?.id ?? 0) - (b.ward?.floor?.id ?? 0)
                if (floorCompare !== 0) return floorCompare
                const wardCompare = (a.ward?.id ?? 0) - (b.ward?.id ?? 0)
                if (wardCompare !== 0) return wardCompare
                return a.room_number.localeCompare(b.room_number)
              })
              .map((room) => ({
                value: room.id,
                label: [room.ward?.floor?.name, room.ward?.name, `غرفة ${room.room_number}`]
                  .filter(Boolean)
                  .join(' — '),
              }))}
          />
          <Select
            style={{ width: 160 }}
            placeholder="السرير"
            allowClear
            disabled={!roomId}
            loading={bedsQuery.isLoading}
            value={bedId ?? undefined}
            onChange={(value) => setBedId(value ?? null)}
            options={(bedsQuery.data ?? []).map((bed) => ({
              value: bed.id,
              label: `سرير ${bed.bed_number}`,
            }))}
          />
        </Flex>
      </Flex>

      <Card>
        <Table
          rowKey="id"
          loading={admissionsQuery.isLoading}
          columns={columns}
          dataSource={admissionsQuery.data?.data ?? []}
          pagination={false}
          onRow={(admission) => ({
            className: 'cursor-pointer',
            onClick: () => navigate(`/admissions/${admission.id}`),
          })}
        />
      </Card>

      <NewAdmissionDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </ConfigProvider>
  )
}
