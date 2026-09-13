import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ConfigProvider, Card, Button, Typography, Table, Tag, Flex, DatePicker, Input, Select, Progress, Tooltip, theme as antdThemeApi } from 'antd'
import { CalendarOutlined, TeamOutlined, TableOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useAntTheme } from '@/lib/antdTheme'
import { getAdmissions } from '@/services/admissionService'
import { getRooms, getBeds } from '@/services/facilityService'
import { NewAdmissionDialog } from '@/components/admissions/NewAdmissionDialog'
import { AdmissionNumberRail } from '@/components/admissions/AdmissionNumberRail'
import { AdmissionWorkArea } from '@/components/admissions/AdmissionWorkArea'
import { AdmissionInfoPanel } from '@/components/admissions/AdmissionInfoPanel'
import { PatientLocationButton } from '@/components/admissions/PatientLocationButton'
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

const STATUS_COLOR: Record<AdmissionStatus, string> = {
  admitted: 'green',
  discharged: 'blue',
  cancelled: 'red',
}

const ARABIC_WEEKDAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

function formatArabicDayHeader(date: Dayjs): string {
  return `${ARABIC_WEEKDAYS[date.day()]}  - ${date.format('YYYY-MM-DD')}`
}

interface DayHeaderRow {
  isDayHeader: true
  key: string
  label: string
  count: number
}

type AdmissionRow = Admission | DayHeaderRow

function isDayHeaderRow(row: AdmissionRow): row is DayHeaderRow {
  return (row as DayHeaderRow).isDayHeader === true
}

function groupAdmissionsByDay(admissions: Admission[]): AdmissionRow[] {
  const sorted = [...admissions].sort(
    (a, b) => dayjs(b.admission_date).valueOf() - dayjs(a.admission_date).valueOf(),
  )

  const rows: AdmissionRow[] = []
  let currentGroup: DayHeaderRow | null = null

  for (const admission of sorted) {
    const day = dayjs(admission.admission_date)
    const dayKey = day.format('YYYY-MM-DD')
    if (currentGroup?.key !== `day-${dayKey}`) {
      currentGroup = { isDayHeader: true, key: `day-${dayKey}`, label: formatArabicDayHeader(day), count: 0 }
      rows.push(currentGroup)
    }
    currentGroup.count += 1
    rows.push(admission)
  }

  return rows
}

export function AdmissionsPage() {
  const antTheme = useAntTheme()
  const { token } = antdThemeApi.useToken()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeAdmissionId, setActiveAdmissionId] = useState<number | null>(null)
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ])
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [roomId, setRoomId] = useState<number | null>(null)
  const [bedId, setBedId] = useState<number | null>(null)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== '+') return
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
      setDialogOpen(true)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const from = dateRange?.[0]?.startOf('day').toISOString()
  const to = dateRange?.[1]?.endOf('day').toISOString()

  const roomsQuery = useQuery({ queryKey: ['rooms'], queryFn: () => getRooms() })
  const bedsQuery = useQuery({
    queryKey: ['beds', roomId],
    queryFn: () => getBeds(roomId ?? undefined),
    enabled: !!roomId,
  })

  const admissionsQuery = useQuery({
    queryKey: ['admissions', from, to, debouncedSearch, roomId, bedId],
    queryFn: () =>
      getAdmissions({
        from,
        to,
        search: debouncedSearch || undefined,
        room_id: roomId ?? undefined,
        bed_id: bedId ?? undefined,
      }),
  })

  const columnCount = 6

  const columns: ColumnsType<AdmissionRow> = [
    {
      title: 'رقم التنويم',
      dataIndex: 'admission_number',
      key: 'admission_number',
      render: (v, row) => {
        if (isDayHeaderRow(row)) {
          return {
            children: (
              <Flex align="center" gap={8}>
                <CalendarOutlined style={{ color: token.colorPrimary }} />
                <span style={{ fontWeight: 600, color: token.colorTextHeading }}>{row.label}</span>
                <Tag icon={<TeamOutlined />} color="blue" style={{ marginInlineStart: 'auto' }}>
                  {row.count} مريض
                </Tag>
              </Flex>
            ),
            props: { colSpan: columnCount },
          }
        }
        return {
          children: (
            <Flex
              align="center"
              justify="center"
              style={{
                width: 44,
                height: 44,
                border: `1px solid ${token.colorBorder}`,
                borderRadius: 8,
                fontWeight: 600,
              }}
            >
              {v ?? '—'}
            </Flex>
          ),
          props: {},
        }
      },
    },
    {
      title: 'المريض',
      key: 'patient',
      render: (_, row) => {
        if (isDayHeaderRow(row)) return { props: { colSpan: 0 } }
        return (
          <Flex align="center" gap={6}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>{row.patient?.name}</span>
            {!!row.operations_count && <Tag>عملية</Tag>}
          </Flex>
        )
      },
    },
    {
      title: 'الموقع',
      key: 'location',
      render: (_, row) => {
        if (isDayHeaderRow(row)) return { props: { colSpan: 0 } }
        return <PatientLocationButton bed={row.bed} />
      },
    },
    {
      title: 'الحالة',
      key: 'status',
      render: (_, row) => {
        if (isDayHeaderRow(row)) return { props: { colSpan: 0 } }
        return <Tag color={STATUS_COLOR[row.status]}>{STATUS_LABEL[row.status]}</Tag>
      },
    },
    {
      title: 'الطبيب المعالج',
      key: 'doctor',
      render: (_, row) => {
        if (isDayHeaderRow(row)) return { props: { colSpan: 0 } }
        return row.admitting_doctor?.name ?? '—'
      },
    },

    {
      title: 'عدد الأيام',
      key: 'days',
      render: (_, row) => {
        if (isDayHeaderRow(row)) return { props: { colSpan: 0 } }
        const end = row.discharge_date ? dayjs(row.discharge_date) : dayjs()
        const hoursElapsed = Math.max(0, end.diff(dayjs(row.admission_date), 'hour'))
        const days = Math.floor(hoursElapsed / 24)
        const remainingHours = hoursElapsed % 24
        const dayProgress = Math.round((remainingHours / 24) * 100)
        return (
          <Flex vertical gap={2} style={{ minWidth: 110 }}>
            <span>
              {days} يوم و {remainingHours} ساعة
            </span>
            <Tooltip title={`${hoursElapsed} ساعة إجمالاً — ${dayProgress}% من اليوم ${days + 1}`}>
              <Progress percent={dayProgress} size="small" showInfo={false} />
            </Tooltip>
          </Flex>
        )
      },
    },

  ]

  const tableData = groupAdmissionsByDay(admissionsQuery.data?.data ?? [])
  const sortedAdmissions = [...(admissionsQuery.data?.data ?? [])].sort(
    (a, b) => dayjs(b.admission_date).valueOf() - dayjs(a.admission_date).valueOf(),
  )
  const activeAdmission = sortedAdmissions.find((a) => a.id === activeAdmissionId) ?? null

  return (
    <ConfigProvider direction="rtl" theme={antTheme}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Flex align="center" gap={10}>
          <Title level={3} style={{ margin: 0 }}>
            المرضى المنومون
          </Title>
          <Tag color="blue">{admissionsQuery.data?.data.length ?? 0} حالة</Tag>
        </Flex>
        <Flex align="center" gap={8}>
          {activeAdmission && (
            <Button icon={<TableOutlined />} onClick={() => setActiveAdmissionId(null)}>
              العودة إلى الجدول
            </Button>
          )}
          <Button type="primary" onClick={() => setDialogOpen(true)}>
            + تنويم جديد
          </Button>
        </Flex>
      </Flex>

      <Flex justify="end" style={{marginBottom:'5px'}} align="center" gap={1}>
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

      {activeAdmission ? (
        <Flex align="start" gap={16} wrap="wrap">
          <AdmissionNumberRail
            admissions={sortedAdmissions}
            activeId={activeAdmissionId}
            onSelect={setActiveAdmissionId}
          />
          <div style={{ flex: '1 1 420px', minWidth: 0 }}>
            <AdmissionWorkArea admission={activeAdmission} />
          </div>
          <div style={{ flex: '0 1 340px', minWidth: 300 }}>
            <AdmissionInfoPanel admission={activeAdmission} onClear={() => setActiveAdmissionId(null)} />
          </div>
        </Flex>
      ) : (
        <Card>
          <Table<AdmissionRow>
            rowKey={(row) => (isDayHeaderRow(row) ? row.key : row.id)}
            loading={admissionsQuery.isLoading}
            columns={columns}
            dataSource={tableData}
            pagination={false}
            onRow={(row) =>
              isDayHeaderRow(row)
                ? {}
                : {
                    className: 'cursor-pointer',
                    onClick: () => setActiveAdmissionId(row.id),
                  }
            }
          />
        </Card>
      )}

      <NewAdmissionDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </ConfigProvider>
  )
}
