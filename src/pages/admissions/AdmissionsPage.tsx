import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ConfigProvider, Card, Button, Typography, Tabs, Table, Tag, Flex, DatePicker, Input, Select } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useAntTheme } from '@/lib/antdTheme'
import { getAdmissions } from '@/services/admissionService'
import { getRooms, getBeds } from '@/services/facilityService'
import { NewAdmissionDialog } from '@/components/admissions/NewAdmissionDialog'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import type { Admission, AdmissionStatus } from '@/types/admission'
import dayjs, { type Dayjs } from 'dayjs'

const { Title } = Typography
const { RangePicker } = DatePicker

const STATUS_LABEL: Record<AdmissionStatus, string> = {
  admitted: 'نشطة',
  discharged: 'مخرّجة',
  cancelled: 'ملغاة',
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
          {!!admission.operations_count && <Tag color="volcano">عملية</Tag>}
        </Flex>
      ),
    },
    {
      title: 'السرير',
      key: 'bed',
      render: (_, admission) =>
        `${admission.bed?.room?.ward?.name ?? ''} — غرفة ${admission.bed?.room?.room_number ?? ''} — سرير ${admission.bed?.bed_number ?? ''}`,
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
      title: 'الحالة',
      key: 'status',
      render: (_, admission) => (
        <Tag color={admission.status === 'admitted' ? 'success' : 'default'}>
          {STATUS_LABEL[admission.status] ?? admission.status}
        </Tag>
      ),
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
            style={{ width: 200 }}
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
            options={(roomsQuery.data ?? []).map((room) => ({
              value: room.id,
              label: `${room.ward?.name ?? ''} — غرفة ${room.room_number}`,
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
