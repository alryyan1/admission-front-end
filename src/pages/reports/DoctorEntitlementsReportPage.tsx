import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Box,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import dayjs from 'dayjs'
import { PageLoader } from '@/components/common/PageLoader'
import { getDoctorEntitlementsReport } from '@/services/reportService'
import { formatNumber } from '@/lib/utils'

export function DoctorEntitlementsReportPage() {
  const [from, setFrom] = useState(() => dayjs().startOf('month').format('YYYY-MM-DD'))
  const [to, setTo] = useState(() => dayjs().endOf('month').format('YYYY-MM-DD'))

  const isRangeValid = !!from && !!to && !dayjs(to).isBefore(dayjs(from), 'day')

  const reportQuery = useQuery({
    queryKey: ['reports', 'doctor-entitlements', from, to],
    queryFn: () => getDoctorEntitlementsReport({ from, to }),
    enabled: isRangeValid,
  })

  const report = reportQuery.data

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Paper
        variant="outlined"
        sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}
      >
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>
            استحقاقات الأطباء من العمليات
          </Typography>
          <Typography variant="caption" color="text.secondary">
            مبالغ استحقاقات أعضاء فريق العمليات حسب تاريخ العملية
          </Typography>
        </Box>
        <Stack direction="row" sx={{ gap: 1.5 }}>
          <TextField
            label="من"
            type="date"
            size="small"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: 170 }}
          />
          <TextField
            label="إلى"
            type="date"
            size="small"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            error={!isRangeValid}
            helperText={!isRangeValid ? 'تاريخ النهاية قبل البداية' : undefined}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: 170 }}
          />
        </Stack>
      </Paper>

      {reportQuery.isLoading && <PageLoader />}

      {report && (
        <>
          <Stack direction="row" flexWrap="wrap" sx={{ gap: 1.5 }}>
            <Paper variant="outlined" sx={{ p: 1.5, minWidth: 160 }}>
              <Typography variant="caption" color="text.secondary">
                عدد العمليات
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {formatNumber(report.summary.operations_count)}
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 1.5, minWidth: 160 }}>
              <Typography variant="caption" color="text.secondary">
                إجمالي الاستحقاقات
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {formatNumber(report.summary.total)}
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 1.5, minWidth: 160 }}>
              <Typography variant="caption" color="text.secondary">
                المدفوع
              </Typography>
              <Typography variant="h6" fontWeight={700} color="success.main">
                {formatNumber(report.summary.paid)}
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 1.5, minWidth: 160 }}>
              <Typography variant="caption" color="text.secondary">
                غير المدفوع
              </Typography>
              <Typography variant="h6" fontWeight={700} color="warning.main">
                {formatNumber(report.summary.unpaid)}
              </Typography>
            </Paper>
          </Stack>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>الطبيب</TableCell>
                  <TableCell>الدور</TableCell>
                  <TableCell align="center">عدد العمليات</TableCell>
                  <TableCell align="right">المدفوع</TableCell>
                  <TableCell align="right">غير المدفوع</TableCell>
                  <TableCell align="right">الإجمالي</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.doctors.map((doctor) => (
                  <TableRow key={doctor.name} hover>
                    <TableCell>{doctor.name}</TableCell>
                    <TableCell>{doctor.role ?? '—'}</TableCell>
                    <TableCell align="center">{formatNumber(doctor.operations_count)}</TableCell>
                    <TableCell align="right">{formatNumber(doctor.paid)}</TableCell>
                    <TableCell align="right">{formatNumber(doctor.unpaid)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {formatNumber(doctor.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={2} sx={{ fontWeight: 700 }}>
                    الإجمالي
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    {formatNumber(report.summary.operations_count)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {formatNumber(report.summary.paid)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {formatNumber(report.summary.unpaid)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {formatNumber(report.summary.total)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </TableContainer>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>تاريخ العملية</TableCell>
                  <TableCell>رقم العملية</TableCell>
                  <TableCell>المريض</TableCell>
                  <TableCell>الإجراء</TableCell>
                  <TableCell>الطبيب</TableCell>
                  <TableCell>الدور</TableCell>
                  <TableCell align="right">المبلغ</TableCell>
                  <TableCell>الحالة</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.entitlements.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.scheduled_at ? dayjs(row.scheduled_at).format('DD/MM/YYYY HH:mm') : '—'}</TableCell>
                    <TableCell>{row.operation_number ?? row.operation_id}</TableCell>
                    <TableCell>{row.patient_name ?? '—'}</TableCell>
                    <TableCell>{row.procedure_name ?? '—'}</TableCell>
                    <TableCell>{row.doctor_name}</TableCell>
                    <TableCell>{row.role ?? '—'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {formatNumber(row.amount)}
                    </TableCell>
                    <TableCell>
                      {row.paid_at ? (
                        <Chip size="small" color="success" variant="outlined" label={`مدفوع ${dayjs(row.paid_at).format('DD/MM/YYYY')}`} />
                      ) : (
                        <Chip size="small" color="warning" variant="outlined" label="غير مدفوع" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  )
}
