import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Box,
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
import { PageLoader } from '@/components/common/PageLoader'
import { getAdmissionRevenueReport } from '@/services/reportService'
import { formatDate, formatNumber } from '@/lib/utils'

function toDateInputValue(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function getCurrentMonthRange(): { from: string; to: string } {
  const now = new Date()
  return {
    from: toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: toDateInputValue(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  }
}

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

/** Room/ward/incubator accommodation revenue, broken down by room type over a chosen period. */
export function AdmissionRevenueReportPage() {
  const [from, setFrom] = useState(() => getCurrentMonthRange().from)
  const [to, setTo] = useState(() => getCurrentMonthRange().to)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(20)

  const reportQuery = useQuery({
    queryKey: ['reports', 'admission-revenue', from, to],
    queryFn: () => getAdmissionRevenueReport({ from, to }),
  })

  const admissions = reportQuery.data?.admissions ?? []
  const pagedAdmissions = admissions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Typography variant="subtitle1" fontWeight={700}>
          تقرير إيرادات التنويم
        </Typography>
        <Typography variant="caption" color="text.secondary">
          إيرادات الغرف الخاصة والعنابر وغيرها، مقسمة حسب نوع الغرفة ضمن الفترة المحددة. لإضافة قسم جديد (مثل
          الحضانة) كبند منفصل، أضف نوع غرفة له من إعدادات الغرف وخصص غرفه له.
        </Typography>
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
        </Box>
      </Paper>

      {!reportQuery.data ? (
        <PageLoader />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <StatTile label="عدد التنويمات" value={formatNumber(reportQuery.data.summary.admissions_count)} />
            <StatTile label="إجمالي إيرادات الغرف" value={formatNumber(reportQuery.data.summary.room_revenue)} />
            {reportQuery.data.by_room_type.map((row) => (
              <StatTile
                key={row.room_type_code ?? 'unknown'}
                label={`${row.room_type_name} (${row.admissions_count})`}
                value={formatNumber(row.total)}
              />
            ))}
          </Box>

          <Paper variant="outlined">
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>تاريخ الدخول</TableCell>
                    <TableCell>المريض</TableCell>
                    <TableCell>القسم</TableCell>
                    <TableCell>نوع الغرفة</TableCell>
                    <TableCell>الغرفة</TableCell>
                    <TableCell>إيراد الإقامة</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagedAdmissions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                        لا توجد إيرادات غرف ضمن الفترة المحددة
                      </TableCell>
                    </TableRow>
                  )}
                  {pagedAdmissions.map((row) => (
                    <TableRow key={row.admission_id} hover>
                      <TableCell>{row.admission_date ? formatDate(row.admission_date) : '—'}</TableCell>
                      <TableCell>{row.patient_name ?? '—'}</TableCell>
                      <TableCell>{row.ward_name ?? '—'}</TableCell>
                      <TableCell>{row.room_type_name}</TableCell>
                      <TableCell>{row.room_number ?? '—'}</TableCell>
                      <TableCell>{formatNumber(row.room_revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={admissions.length}
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
    </Box>
  )
}
