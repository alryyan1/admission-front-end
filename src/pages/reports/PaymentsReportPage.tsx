import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Autocomplete,
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { FileTextOutlined } from '@ant-design/icons'
import { PageLoader } from '@/components/common/PageLoader'
import { PdfPreviewModal } from '@/components/common/PdfPreviewModal'
import { usePdfPreview } from '@/hooks/usePdfPreview'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { getPaymentRecorders, getPaymentsReport, reportPdfPaths } from '@/services/reportService'
import { getPaymentMethods } from '@/services/paymentMethodService'
import { useAuth } from '@/contexts/AuthContext'
import { formatDateTime, formatNumber } from '@/lib/utils'
import type { PaymentMethod } from '@/types/paymentMethod'
import type { PaymentRecorder } from '@/types/report'

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10)
}

const now = new Date()
const DEFAULT_FROM = toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1))
const DEFAULT_TO = toDateInputValue(new Date(now.getFullYear(), now.getMonth() + 1, 0))

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <Paper variant="outlined" sx={{ px: 1.5, py: 0.75, minWidth: 110 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
        {label}
      </Typography>
      <Typography variant="subtitle2" fontWeight={700}>
        {value}
      </Typography>
    </Paper>
  )
}

export function PaymentsReportPage() {
  const [from, setFrom] = useState(DEFAULT_FROM)
  const [to, setTo] = useState(DEFAULT_TO)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const { user } = useAuth()
  const [recorder, setRecorder] = useState<PaymentRecorder | null>(() =>
    user ? { id: user.id, name: user.name } : null,
  )
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const pdf = usePdfPreview()

  const paymentMethodsQuery = useQuery({ queryKey: ['payment-methods'], queryFn: getPaymentMethods })
  const recordersQuery = useQuery({ queryKey: ['payments-recorders'], queryFn: getPaymentRecorders })

  const reportQuery = useQuery({
    queryKey: ['reports', 'payments', from, to, paymentMethod?.id, recorder?.id, debouncedSearch],
    queryFn: () =>
      getPaymentsReport({
        from,
        to,
        payment_method_id: paymentMethod?.id,
        paid_by_user_id: recorder?.id,
        search: debouncedSearch || undefined,
      }),
  })

  const payments = reportQuery.data?.payments ?? []
  const pagedPayments = payments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Paper
        variant="outlined"
        sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}
      >
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>
            تقرير المدفوعات
          </Typography>
          <Typography variant="caption" color="text.secondary">
            جميع الدفعات المسجّلة على التنويمات ضمن الفترة المحددة
          </Typography>
        </Box>
        <Button
          size="small"
          variant="outlined"
          startIcon={<FileTextOutlined />}
          loading={pdf.isLoading()}
          onClick={() => pdf.open(reportPdfPaths.payments(from, to, recorder?.id), 'معاينة تقرير المدفوعات')}
        >
          معاينة PDF
        </Button>
      </Paper>

      <Paper variant="outlined" sx={{ p: 1.25 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25, alignItems: 'center' }}>
          <TextField
            label="من تاريخ"
            type="date"
            size="small"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value)
              setPage(0)
            }}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: 150 }}
          />
          <TextField
            label="إلى تاريخ"
            type="date"
            size="small"
            value={to}
            onChange={(e) => {
              setTo(e.target.value)
              setPage(0)
            }}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: 150 }}
          />
          <Autocomplete<PaymentMethod>
            size="small"
            sx={{ width: 170 }}
            options={paymentMethodsQuery.data ?? []}
            getOptionLabel={(m) => m.name}
            isOptionEqualToValue={(o, v) => o.id === v.id}
            loading={paymentMethodsQuery.isLoading}
            value={paymentMethod}
            onChange={(_, value) => {
              setPaymentMethod(value)
              setPage(0)
            }}
            renderInput={(params) => <TextField {...params} label="طريقة الدفع" />}
          />
          <Autocomplete<PaymentRecorder>
            size="small"
            sx={{ width: 190 }}
            options={recordersQuery.data ?? []}
            getOptionLabel={(r) => r.name}
            isOptionEqualToValue={(o, v) => o.id === v.id}
            loading={recordersQuery.isLoading}
            value={recorder}
            onChange={(_, value) => {
              setRecorder(value)
              setPage(0)
            }}
            renderInput={(params) => <TextField {...params} label="المستلم" />}
          />
          <TextField
            label="اسم المريض"
            size="small"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
            sx={{ width: 190 }}
          />
        </Box>
      </Paper>

      {!reportQuery.data ? (
        <PageLoader />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <StatTile label="عدد المدفوعات" value={formatNumber(reportQuery.data.summary.count)} />
            <StatTile label="إجمالي المدفوعات" value={formatNumber(reportQuery.data.summary.total_amount)} />
            {reportQuery.data.by_method.map((row) => (
              <StatTile key={row.method} label={row.method} value={formatNumber(row.total)} />
            ))}
          </Box>

          <Paper variant="outlined">
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>التاريخ</TableCell>
                    <TableCell>المريض</TableCell>
                    <TableCell>رقم التنويم</TableCell>
                    <TableCell>طريقة الدفع</TableCell>
                    <TableCell>المبلغ</TableCell>
                    <TableCell>استلمها</TableCell>
                    <TableCell>ملاحظات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagedPayments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                        لا توجد مدفوعات ضمن الفترة المحددة
                      </TableCell>
                    </TableRow>
                  )}
                  {pagedPayments.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{row.paid_at ? formatDateTime(row.paid_at) : '—'}</TableCell>
                      <TableCell>{row.patient_name ?? '—'}</TableCell>
                      <TableCell>#{row.admission_id}</TableCell>
                      <TableCell>{row.payment_method ?? '—'}</TableCell>
                      <TableCell>{formatNumber(row.amount)}</TableCell>
                      <TableCell>{row.paid_by ?? '—'}</TableCell>
                      <TableCell>{row.comment ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={payments.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10))
                setPage(0)
              }}
              rowsPerPageOptions={[10, 20, 50]}
              labelRowsPerPage="عدد الصفوف"
            />
          </Paper>
        </Box>
      )}

      <PdfPreviewModal url={pdf.url} title={pdf.title} onClose={pdf.close} />
    </Box>
  )
}
