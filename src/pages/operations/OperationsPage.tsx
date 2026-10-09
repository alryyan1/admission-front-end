import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ConfigProvider, Card, Input, Table, Typography, Flex, Space, Button, Badge, Tooltip } from 'antd'
import { FileTextOutlined, FileExcelOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import { useAntTheme } from '@/lib/antdTheme'
import { formatDateTime, formatNumber } from '@/lib/utils'
import { getAllOperations } from '@/services/operationService'
import { usePdfPreview } from '@/hooks/usePdfPreview'
import { PdfPreviewModal } from '@/components/common/PdfPreviewModal'
import { OperationTeamModal } from '@/components/admissions/OperationTeamModal'
import apiClient from '@/services/api'
import type { Operation } from '@/types/admission'

const { Title, Text } = Typography

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Space direction="vertical" size={4}>
      <Text style={{ fontSize: 12 }} type="secondary">
        {label}
      </Text>
      {children}
    </Space>
  )
}

export function OperationsPage() {
  const antTheme = useAntTheme()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [teamOperationId, setTeamOperationId] = useState<number | null>(null)
  const [date, setDate] = useState('')
  const [dateFrom, setDateFrom] = useState(dayjs().startOf('month').format('YYYY-MM-DD'))
  const [dateTo, setDateTo] = useState(dayjs().endOf('month').format('YYYY-MM-DD'))
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(15)
  const [excelLoading, setExcelLoading] = useState(false)
  const pdf = usePdfPreview()

  function reportQuery(): string {
    const params = new URLSearchParams()
    if (date) params.set('date', date)
    if (dateFrom) params.set('date_from', dateFrom)
    if (dateTo) params.set('date_to', dateTo)
    if (search) params.set('search', search)
    return params.toString()
  }

  async function downloadExcel() {
    setExcelLoading(true)
    try {
      const { data } = await apiClient.get<Blob>(`/operations/report.xlsx?${reportQuery()}`, {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.download = `operations-report-${dayjs().format('YYYY-MM-DD')}.xlsx`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('تعذر تنزيل ملف الإكسل')
    } finally {
      setExcelLoading(false)
    }
  }

  const operationsQuery = useQuery({
    queryKey: ['operations', date, dateFrom, dateTo, search, page, perPage],
    queryFn: () =>
      getAllOperations({
        date: date || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        search: search || undefined,
        page,
        per_page: perPage,
      }),
  })

  const teamOperation =
    teamOperationId != null
      ? (operationsQuery.data?.data ?? []).find((op) => op.id === teamOperationId) ?? null
      : null

  function invalidateOperations() {
    queryClient.invalidateQueries({ queryKey: ['operations'] })
  }

  const columns: ColumnsType<Operation> = [
    { title: 'رقم العملية', dataIndex: 'operation_number', key: 'operation_number', render: (v) => v ?? '—' },
    { title: 'المريض', key: 'patient', render: (_, op) => op.admission?.patient?.name ?? '—' },
    {
      title: 'الإجراء',
      key: 'procedure',
      render: (_, op) => (
        <Space
          size={4}
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation()
            setTeamOperationId(op.id)
          }}
        >
          <Text underline>{op.procedure?.name_ar ?? '—'}</Text>
          <Tooltip title="عدد أعضاء الفريق الطبي">
            <Badge count={op.team_members?.length ?? 0} showZero size="small" color="blue" />
          </Tooltip>
        </Space>
      ),
    },
    { title: 'الجراح', key: 'surgeon', render: (_, op) => op.surgeon?.name ?? '—' },
    { title: 'السعر', key: 'price', render: (_, op) => (op.price != null ? formatNumber(op.price) : '—') },
    {
      title: 'صافي المركز',
      key: 'net_price',
      render: (_, op) => {
        if (op.price == null) return '—'

        const entitlementsTotal = (op.team_members ?? []).reduce(
          (sum, member) => sum + (member.entitlement_amount != null ? Number(member.entitlement_amount) : 0),
          0,
        )

        return formatNumber(Number(op.price) - entitlementsTotal)
      },
    },
    { title: 'تاريخ العملية', key: 'scheduled_at', render: (_, op) => formatDateTime(op.scheduled_at) },
    { title: 'تاريخ الإنشاء', key: 'created_at', render: (_, op) => formatDateTime(op.created_at) },
  ]

  return (
    <ConfigProvider direction="rtl" theme={antTheme}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={12} style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          قائمه العمليات {operationsQuery.data?.total ?? 0}
        </Title>
        <Space>
          <Button
            icon={<FileTextOutlined />}
            loading={pdf.isLoading()}
            onClick={() => pdf.open(`/operations/report.pdf?${reportQuery()}`, 'معاينة تقرير العمليات')}
          >
            PDF
          </Button>
          <Button icon={<FileExcelOutlined />} loading={excelLoading} onClick={downloadExcel}>
            Excel
          </Button>
        </Space>
      </Flex>

      <Card style={{ marginBottom: 16 }}>
        <Flex wrap="wrap" gap={12}>
          <FieldLabel label="تاريخ العملية">
            <Input
              type="date"
              style={{ width: 160 }}
              value={date}
              onChange={(e) => {
                setDate(e.target.value)
                setPage(1)
              }}
            />
          </FieldLabel>
          <FieldLabel label="تاريخ الإنشاء من">
            <Input
              type="date"
              style={{ width: 160 }}
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value)
                setPage(1)
              }}
            />
          </FieldLabel>
          <FieldLabel label="تاريخ الإنشاء إلى">
            <Input
              type="date"
              style={{ width: 160 }}
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value)
                setPage(1)
              }}
            />
          </FieldLabel>
          <FieldLabel label="بحث">
            <Input
              style={{ width: 192 }}
              placeholder="اسم المريض أو الإجراء"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </FieldLabel>
        </Flex>
      </Card>

      <Card>
        <Table
          rowKey="id"
          loading={operationsQuery.isLoading}
          columns={columns}
          dataSource={[...(operationsQuery.data?.data ?? [])].sort((a, b) => b.id - a.id)}
          pagination={{
            current: operationsQuery.data?.current_page ?? page,
            pageSize: operationsQuery.data?.per_page ?? perPage,
            total: operationsQuery.data?.total ?? 0,
            showSizeChanger: true,
            onChange: (p, ps) => {
              setPage(p)
              setPerPage(ps)
            },
          }}
          onRow={(op) => ({
            className: 'cursor-pointer',
            onClick: () => navigate(`/admissions/${op.admission_id}`),
          })}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={4}>
                  <Text strong>الإجمالي</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4}>
                  <Text strong>{formatNumber(operationsQuery.data?.price_total ?? 0)}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5}>
                  <Text strong>{formatNumber(operationsQuery.data?.net_total ?? 0)}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6} colSpan={2} />
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>

      <PdfPreviewModal url={pdf.url} title={pdf.title} onClose={pdf.close} />

      {teamOperation && (
        <OperationTeamModal
          open={!!teamOperation}
          onClose={() => setTeamOperationId(null)}
          operationId={teamOperation.id}
          existingMembers={teamOperation.team_members ?? []}
          operationPrice={teamOperation.price}
          operationName={teamOperation.procedure?.name_ar}
          onAdded={invalidateOperations}
        />
      )}
    </ConfigProvider>
  )
}
