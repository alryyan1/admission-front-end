import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ConfigProvider, Card, Table, Tag, Typography, Row, Col, Select, Input, DatePicker, Button, Descriptions } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useAntTheme } from '@/lib/antdTheme'
import { getActivityLogs, getActivityLogSubjectTypes, getActivityLogCausers } from '@/services/activityLogService'
import type { ActivityLogEntry, ActivityLogFilters } from '@/types/activityLog'
import { formatDateTime } from '@/lib/utils'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

const SUBJECT_LABELS: Record<string, string> = {
  Admission: 'تنويم',
  Invoice: 'فاتورة',
  Operation: 'عملية',
  Patient: 'مريض',
  Service: 'خدمة',
  ServiceCategory: 'تصنيف خدمة',
  ChartOpeningServiceSetting: 'إعداد فتح الملف',
  ShortStayServiceSetting: 'إعداد الإقامة القصيرة',
  User: 'مستخدم',
  Bed: 'سرير',
  Ward: 'جناح',
  Room: 'غرفة',
  Floor: 'طابق',
  Doctor: 'طبيب',
  ProcedureCategory: 'تصنيف عملية',
  Procedure: 'نوع عملية',
}

const EVENT_LABELS: Record<string, { label: string; color: string }> = {
  created: { label: 'إنشاء', color: 'green' },
  updated: { label: 'تعديل', color: 'blue' },
  deleted: { label: 'حذف', color: 'red' },
}

function subjectLabel(subjectType: string | null): string {
  if (!subjectType) return '—'
  const basename = subjectType.split('\\').pop() ?? subjectType
  return SUBJECT_LABELS[basename] ?? basename
}

function describe(entry: ActivityLogEntry): string {
  if (entry.event && EVENT_LABELS[entry.event]) {
    return `${EVENT_LABELS[entry.event].label} ${subjectLabel(entry.subject_type)} #${entry.subject_id ?? ''}`
  }
  return entry.description
}

export function ActivityLogPage() {
  const antTheme = useAntTheme()
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const [causerId, setCauserId] = useState<number | undefined>()
  const [subjectType, setSubjectType] = useState<string | undefined>()
  const [event, setEvent] = useState<string | undefined>()
  const [search, setSearch] = useState('')
  const [dateRange, setDateRange] = useState<[string, string] | undefined>()

  const filters: ActivityLogFilters = {
    page,
    per_page: perPage,
    causer_id: causerId,
    subject_type: subjectType,
    event,
    search: search || undefined,
    date_from: dateRange?.[0],
    date_to: dateRange?.[1],
  }

  const logsQuery = useQuery({
    queryKey: ['activity-logs', filters],
    queryFn: () => getActivityLogs(filters),
  })

  const subjectTypesQuery = useQuery({ queryKey: ['activity-log-subject-types'], queryFn: getActivityLogSubjectTypes })
  const causersQuery = useQuery({ queryKey: ['activity-log-causers'], queryFn: getActivityLogCausers })

  function resetFilters() {
    setCauserId(undefined)
    setSubjectType(undefined)
    setEvent(undefined)
    setSearch('')
    setDateRange(undefined)
    setPage(1)
  }

  const columns: ColumnsType<ActivityLogEntry> = [
    {
      title: 'الوقت',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (v: string) => formatDateTime(v),
    },
    {
      title: 'المستخدم',
      key: 'causer',
      width: 160,
      render: (_, entry) => (entry.causer ? entry.causer.name : <Text type="secondary">النظام</Text>),
    },
    {
      title: 'الحدث',
      key: 'event',
      width: 100,
      render: (_, entry) =>
        entry.event && EVENT_LABELS[entry.event] ? (
          <Tag color={EVENT_LABELS[entry.event].color}>{EVENT_LABELS[entry.event].label}</Tag>
        ) : (
          <Tag>أخرى</Tag>
        ),
    },
    {
      title: 'العنصر',
      key: 'subject',
      width: 160,
      render: (_, entry) => (entry.subject_type ? `${subjectLabel(entry.subject_type)} #${entry.subject_id ?? ''}` : '—'),
    },
    {
      title: 'التفاصيل',
      key: 'description',
      render: (_, entry) => describe(entry),
    },
  ]

  return (
    <ConfigProvider direction="rtl" theme={antTheme}>
      <Title level={3} style={{ margin: '0 0 16px' }}>
        سجل النشاط
      </Title>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} md={5}>
            <Select
              allowClear
              placeholder="المستخدم"
              style={{ width: '100%' }}
              value={causerId}
              onChange={(v) => {
                setCauserId(v)
                setPage(1)
              }}
              options={(causersQuery.data ?? []).map((u) => ({ value: u.id, label: u.name }))}
            />
          </Col>
          <Col xs={24} md={5}>
            <Select
              allowClear
              placeholder="نوع العنصر"
              style={{ width: '100%' }}
              value={subjectType}
              onChange={(v) => {
                setSubjectType(v)
                setPage(1)
              }}
              options={(subjectTypesQuery.data ?? []).map((t) => ({
                value: t.value,
                label: SUBJECT_LABELS[t.label] ?? t.label,
              }))}
            />
          </Col>
          <Col xs={24} md={4}>
            <Select
              allowClear
              placeholder="الحدث"
              style={{ width: '100%' }}
              value={event}
              onChange={(v) => {
                setEvent(v)
                setPage(1)
              }}
              options={[
                { value: 'created', label: 'إنشاء' },
                { value: 'updated', label: 'تعديل' },
                { value: 'deleted', label: 'حذف' },
              ]}
            />
          </Col>
          <Col xs={24} md={5}>
            <RangePicker
              style={{ width: '100%' }}
              value={dateRange ? [dayjs(dateRange[0]), dayjs(dateRange[1])] : null}
              onChange={(values) => {
                if (!values || !values[0] || !values[1]) {
                  setDateRange(undefined)
                } else {
                  setDateRange([values[0].format('YYYY-MM-DD'), values[1].format('YYYY-MM-DD')])
                }
                setPage(1)
              }}
            />
          </Col>
          <Col xs={24} md={5}>
            <Input.Search
              allowClear
              placeholder="بحث في التفاصيل"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onSearch={() => setPage(1)}
            />
          </Col>
        </Row>
        <Row style={{ marginTop: 12 }}>
          <Button onClick={resetFilters}>إعادة تعيين الفلاتر</Button>
        </Row>
      </Card>

      <Card>
        <Table
          rowKey="id"
          loading={logsQuery.isLoading}
          columns={columns}
          dataSource={logsQuery.data?.data ?? []}
          pagination={{
            current: logsQuery.data?.current_page ?? page,
            pageSize: logsQuery.data?.per_page ?? perPage,
            total: logsQuery.data?.total ?? 0,
            showSizeChanger: true,
            onChange: (p, ps) => {
              setPage(p)
              setPerPage(ps)
            },
          }}
          expandable={{
            expandedRowRender: (entry) => <ActivityLogDetails entry={entry} />,
            rowExpandable: (entry) => Boolean(entry.properties?.attributes || entry.properties?.old),
          }}
        />
      </Card>
    </ConfigProvider>
  )
}

function ActivityLogDetails({ entry }: { entry: ActivityLogEntry }) {
  const attributes = entry.properties?.attributes ?? {}
  const old = entry.properties?.old ?? {}
  const keys = Array.from(new Set([...Object.keys(attributes), ...Object.keys(old)]))

  if (keys.length === 0) {
    return <Text type="secondary">لا توجد تفاصيل إضافية</Text>
  }

  return (
    <Descriptions size="small" column={1} bordered>
      {keys.map((key) => (
        <Descriptions.Item key={key} label={key}>
          {key in old ? (
            <>
              <Text delete type="secondary">
                {formatValue(old[key])}
              </Text>
              {' ← '}
              <Text strong>{formatValue(attributes[key])}</Text>
            </>
          ) : (
            formatValue(attributes[key])
          )}
        </Descriptions.Item>
      ))}
    </Descriptions>
  )
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'boolean') return value ? 'نعم' : 'لا'
  return String(value)
}
