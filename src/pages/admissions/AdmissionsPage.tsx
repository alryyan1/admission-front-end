import { useEffect, useState } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ConfigProvider, Button, Typography, Table, Tag, Flex, Progress, Segmented, Switch, Tooltip, theme as antdThemeApi } from 'antd'
import { CalendarOutlined, TeamOutlined, TableOutlined, CalculatorOutlined, WhatsAppOutlined, FileTextOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useAntTheme } from '@/lib/antdTheme'
import { formatNumber } from '@/lib/utils'
import { usePdfPreview } from '@/hooks/usePdfPreview'
import { PdfPreviewModal } from '@/components/common/PdfPreviewModal'
import { getAdmissions, admissionPdfPaths } from '@/services/admissionService'
import { RegisterPatientDialog } from '@/components/admissions/RegisterPatientDialog'
import { RevenueCalculatorDialog } from '@/components/admissions/RevenueCalculatorDialog'
import {
  ADMISSION_SQUARE_SIZE,
  AdmissionBalanceBadge,
  AdmissionInsuranceBadge,
  AdmissionNumberRail,
  getAdmissionSquareStyle,
} from '@/components/admissions/AdmissionNumberRail'
import { AdmissionWorkArea } from '@/components/admissions/AdmissionWorkArea'
import { AdmissionInfoPanel } from '@/components/admissions/AdmissionInfoPanel'
import { PatientLocationButton } from '@/components/admissions/PatientLocationButton'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import type { AdmissionsFiltersContext } from '@/components/layout/AppLayout'
import type { Admission, AdmissionStatus } from '@/types/admission'
import dayjs, { type Dayjs } from 'dayjs'

const { Title } = Typography

const STATUS_LABEL: Record<AdmissionStatus, string> = {
  admitted: 'نشطة',
  discharged: 'مخرّجة',
  cancelled: 'ملغاة',
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

function defaultDateRange(): [Dayjs, Dayjs] {
  return [dayjs().startOf('month'), dayjs().endOf('month')]
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
  const { dateRange, setDateRange, dateRangeClearedBySearch, setDateRangeClearedBySearch, roomId, bedId } =
    useOutletContext<AdmissionsFiltersContext>()
  const [searchParams, setSearchParams] = useSearchParams()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [calculatorOpen, setCalculatorOpen] = useState(false)
  const [activeAdmissionId, setActiveAdmissionId] = useState<number | null>(null)
  const [operationsFocusToken, setOperationsFocusToken] = useState(0)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [admissionIdFilter, setAdmissionIdFilter] = useState<number | undefined>(undefined)
  const [balanceDueOnly, setBalanceDueOnly] = useState(false)
  const [unapprovedOperationsOnly, setUnapprovedOperationsOnly] = useState(false)
  const [statusFilter, setStatusFilter] = useState<AdmissionStatus | 'all'>('admitted')
  const pdf = usePdfPreview()

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

  // Consumes a one-shot ?search=/?admission_id= from the top app bar's global search,
  // clearing the default date range so the match isn't hidden outside the current month.
  useEffect(() => {
    const urlSearch = searchParams.get('search')
    const urlAdmissionId = searchParams.get('admission_id')
    if (urlSearch === null && urlAdmissionId === null) return

    setDateRange(null)
    setDateRangeClearedBySearch(true)
    if (urlSearch !== null) {
      setSearch(urlSearch)
      setAdmissionIdFilter(undefined)
    } else if (urlAdmissionId !== null) {
      const parsed = Number(urlAdmissionId)
      setAdmissionIdFilter(Number.isNaN(parsed) ? undefined : parsed)
      setActiveAdmissionId(Number.isNaN(parsed) ? null : parsed)
      setSearch('')
    }
    setSearchParams({}, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Once the search that cleared the date range is itself cleared, restore the
  // default "this month" view instead of silently staying on all-time results.
  useEffect(() => {
    if (!dateRangeClearedBySearch || dateRange !== null) return
    if (search.trim() === '' && admissionIdFilter === undefined) {
      setDateRange(defaultDateRange())
      setDateRangeClearedBySearch(false)
    }
  }, [search, admissionIdFilter, dateRangeClearedBySearch, dateRange, setDateRange, setDateRangeClearedBySearch])

  const from = dateRange?.[0]?.startOf('day').toISOString()
  const to = dateRange?.[1]?.endOf('day').toISOString()

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

  const columnCount = 9

  const hasUnapprovedOperations = (row: Admission): boolean =>
    (row.operations ?? []).some((operation) => !operation.entitlements_approved)

  const getStayDuration = (row: Admission) => {
    const end = row.discharge_date ? dayjs(row.discharge_date) : dayjs()
    const hoursElapsed = Math.max(0, end.diff(dayjs(row.admission_date), 'hour'))
    const days = Math.floor(hoursElapsed / 24)
    const remainingHours = hoursElapsed % 24
    const dayProgress = Math.round((remainingHours / 24) * 100)
    return { hoursElapsed, days, remainingHours, dayProgress }
  }

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
            <div style={{ position: 'relative', width: ADMISSION_SQUARE_SIZE, height: ADMISSION_SQUARE_SIZE }}>
              <Tooltip title={STATUS_LABEL[row.status]}>
                <Flex style={getAdmissionSquareStyle(token, row.status)}>{v ?? '—'}</Flex>
              </Tooltip>
              <AdmissionBalanceBadge admission={row} />
              <AdmissionInsuranceBadge admission={row} />
            </div>
          ),
          props: {},
        }
      },
    },
    {
      title: 'الملف',
      key: 'id',
      render: (_, row) => {
        if (isDayHeaderRow(row)) return { props: { colSpan: 0 } }
        return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{row.id}</span>
      },
    },
    {
      title: 'المريض',
      key: 'patient',
      render: (_, row) => {
        if (isDayHeaderRow(row)) return { props: { colSpan: 0 } }
        return (
          <Flex vertical gap={4} style={{ minWidth: 180 }}>
            <Flex align="center" gap={6}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>{row.patient?.name}</span>
              {row.status === 'discharged' && <Tag color="purple">تم الخروج</Tag>}
              {!!row.operations_count && (
                <Tag
                  color={hasUnapprovedOperations(row) ? 'red' : 'green'}
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveAdmissionId(row.id)
                    setOperationsFocusToken((t) => t + 1)
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  عملية {hasUnapprovedOperations(row) ? '(غير معتمدة)' : '(معتمدة)'}
                </Tag>
              )}
            </Flex>
            {row.status === 'admitted' &&
              (() => {
                const { hoursElapsed, days, dayProgress } = getStayDuration(row)
                return (
                  <Tooltip title={`${hoursElapsed} ساعة إجمالاً — ${dayProgress}% من اليوم ${days + 1}`}>
                    <Progress percent={dayProgress} size="small" showInfo={false} />
                  </Tooltip>
                )
              })()}
          </Flex>
        )
      },
    },
    {
      title: 'الموقع',
      key: 'location',
      render: (_, row) => {
        if (isDayHeaderRow(row)) return { props: { colSpan: 0 } }
        return (
          <PatientLocationButton
            bed={row.bed}
            bedAdmissionId={row.status === 'admitted' ? row.id : undefined}
          />
        )
      },
    },
    {
      title: 'الطبيب المعالج',
      key: 'doctor',
      render: (_, row) => {
        if (isDayHeaderRow(row)) return { props: { colSpan: 0 } }
        return row.patient?.admitting_doctor?.name ?? '—'
      },
    },
    {
      title: 'محول من',
      key: 'referred_by_doctor',
      render: (_, row) => {
        if (isDayHeaderRow(row)) return { props: { colSpan: 0 } }
        const doctorName = row.patient?.referred_by_doctor?.name
        if (!doctorName) return '—'
        return (
          <Flex align="center" gap={6}>
            {doctorName}
            {row.doctor_notice_sent_at && (
              <Tooltip title="تم إرسال إشعار واتساب للطبيب">
                <WhatsAppOutlined style={{ color: token.colorSuccess }} />
              </Tooltip>
            )}
          </Flex>
        )
      },
    },

    {
      title: 'الإجمالي',
      key: 'total_charges',
      render: (_, row) => {
        if (isDayHeaderRow(row)) return { props: { colSpan: 0 } }
        return formatNumber(row.total_charges ?? 0)
      },
    },
    {
      title: 'المدفوع',
      key: 'paid_total',
      render: (_, row) => {
        if (isDayHeaderRow(row)) return { props: { colSpan: 0 } }
        return formatNumber(row.paid_total ?? 0)
      },
    },
    {
      title: 'المتبقي',
      key: 'balance_due',
      render: (_, row) => {
        if (isDayHeaderRow(row)) return { props: { colSpan: 0 } }
        const balance = row.balance_due ?? 0
        return <Tag color={balance > 0 ? 'red' : 'green'}>{formatNumber(balance)}</Tag>
      },
    },
  ]

  const filteredAdmissions = (admissionsQuery.data?.data ?? []).filter(
    (a) =>
      (statusFilter === 'all' || a.status === statusFilter) &&
      (!balanceDueOnly || (a.balance_due ?? 0) > 0) &&
      (!unapprovedOperationsOnly || hasUnapprovedOperations(a)),
  )
  const tableData = groupAdmissionsByDay(filteredAdmissions)
  const sortedAdmissions = [...filteredAdmissions].sort(
    (a, b) => dayjs(b.admission_date).valueOf() - dayjs(a.admission_date).valueOf(),
  )
  const activeAdmission = sortedAdmissions.find((a) => a.id === activeAdmissionId) ?? null

  return (
    <ConfigProvider direction="rtl" theme={antTheme}>
      <div style={{ userSelect: 'none' }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Flex align="center" gap={10}>
          <Tag color="blue">{filteredAdmissions.length} حالة</Tag>
          <Segmented
          type='primary'
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as AdmissionStatus | 'all')}
            options={[
              { label: 'الكل', value: 'all' },
              {
                label: (
                  <span
                    style={{
                      color: statusFilter === 'admitted' ? token.colorSuccess : undefined,
                      fontWeight: statusFilter === 'admitted' ? 600 : undefined,
                    }}
                  >
                    {STATUS_LABEL.admitted}
                  </span>
                ),
                value: 'admitted',
              },
              { label: STATUS_LABEL.discharged, value: 'discharged' },
              { label: STATUS_LABEL.cancelled, value: 'cancelled' },
            ]}
          />
          <Flex align="center" gap={6}>
            <Switch checked={balanceDueOnly} onChange={setBalanceDueOnly} size="small" />
            <Typography.Text>متبقي فقط</Typography.Text>
          </Flex>
          <Flex align="center" gap={6}>
            <Switch checked={unapprovedOperationsOnly} onChange={setUnapprovedOperationsOnly} size="small" />
            <Typography.Text>عمليات غير معتمدة فقط</Typography.Text>
          </Flex>
        </Flex>
        <Flex align="center" gap={8}>
          {activeAdmission && (
            <Button
              icon={<TableOutlined />}
              onClick={() => {
                setActiveAdmissionId(null)
                if (admissionIdFilter !== undefined) {
                  setAdmissionIdFilter(undefined)
                  if (search.trim() === '') {
                    setDateRange(defaultDateRange())
                    setDateRangeClearedBySearch(false)
                  }
                }
              }}
            >
              العودة إلى الجدول
            </Button>
          )}
          <Button
            icon={<FileTextOutlined />}
            loading={pdf.isLoading()}
            onClick={() =>
              pdf.open(
                admissionPdfPaths.admissionsPaymentsReport({
                  from,
                  to,
                  search: debouncedSearch || undefined,
                  room_id: roomId ?? undefined,
                  bed_id: bedId ?? undefined,
                }),
                'معاينة تقرير بيانات التنويم والمدفوعات',
              )
            }
          >
            طباعة PDF
          </Button>
          <Button icon={<CalculatorOutlined />} onClick={() => setCalculatorOpen(true)}>
            الحاسبة
          </Button>
          <Button type="primary" onClick={() => setDialogOpen(true)}>
            + تسجيل جديد
          </Button>
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
            <AdmissionWorkArea admission={activeAdmission} focusOperationsToken={operationsFocusToken} />
          </div>
          <div style={{ flex: '0 1 340px', minWidth: 300 }}>
            <AdmissionInfoPanel admission={activeAdmission} onClear={() => setActiveAdmissionId(null)} />
          </div>
        </Flex>
      ) : (
          <Table<AdmissionRow>
            size="small"
            rowKey={(row) => (isDayHeaderRow(row) ? row.key : row.id)}
            loading={admissionsQuery.isLoading}
            columns={columns}
            dataSource={tableData}
            pagination={false}
            onRow={(row) =>
              isDayHeaderRow(row)
                ? { style: { backgroundColor: '' } }
                : {
                    className: 'cursor-pointer',
                    onClick: () => setActiveAdmissionId(row.id),
                  }
            }
          />
      )}

      {dialogOpen && <RegisterPatientDialog open onClose={() => setDialogOpen(false)} />}
      <RevenueCalculatorDialog open={calculatorOpen} onClose={() => setCalculatorOpen(false)} />
      <PdfPreviewModal url={pdf.url} title={pdf.title} onClose={pdf.close} />
      </div>
    </ConfigProvider>
  )
}
