import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Autocomplete,
  Box,
  MenuItem,
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
import { getDoctorRevenueReport } from '@/services/reportService'
import { getDoctors } from '@/services/patientService'
import { formatNumber } from '@/lib/utils'
import type { Doctor } from '@/types/patient'
import type { DoctorRevenueRole } from '@/types/report'

const roleOptions: { value: DoctorRevenueRole; label: string }[] = [
  { value: 'admitting', label: 'الطبيب المعالج' },
  { value: 'referring', label: 'الطبيب المحول' },
]

export function DoctorRevenueReportPage() {
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [role, setRole] = useState<DoctorRevenueRole>('admitting')
  const [from, setFrom] = useState(() => dayjs().startOf('month').format('YYYY-MM-DD'))
  const [to, setTo] = useState(() => dayjs().endOf('month').format('YYYY-MM-DD'))

  const isRangeValid = !!from && !!to && !dayjs(to).isBefore(dayjs(from), 'day')

  const doctorsQuery = useQuery({
    queryKey: ['doctors-options'],
    queryFn: () => getDoctors(),
  })

  const reportQuery = useQuery({
    queryKey: ['reports', 'doctor-revenue', doctor?.id, role, from, to],
    queryFn: () => getDoctorRevenueReport({ doctor_id: doctor!.id, doctor_role: role, from, to }),
    enabled: !!doctor && isRangeValid,
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
            تقرير أداء الأطباء من ناحية الإيرادات
          </Typography>
          <Typography variant="caption" color="text.secondary">
            إجمالي إيراد الغرف حسب النوع، وإيراد العمليات، وإيراد الخدمات لمرضى الطبيب المحدد
          </Typography>
        </Box>
        <Stack direction="row" flexWrap="wrap" sx={{ gap: 1.5 }}>
          <Autocomplete<Doctor>
            size="small"
            sx={{ width: 220 }}
            options={doctorsQuery.data ?? []}
            getOptionLabel={(d) => d.name}
            isOptionEqualToValue={(o, v) => o.id === v.id}
            loading={doctorsQuery.isLoading}
            value={doctor}
            onChange={(_, value) => setDoctor(value)}
            renderInput={(params) => <TextField {...params} label="الطبيب" />}
          />
          <TextField
            select
            label="نوع الطبيب"
            size="small"
            value={role}
            onChange={(e) => setRole(e.target.value as DoctorRevenueRole)}
            sx={{ width: 170 }}
          >
            {roleOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
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

      {!doctor && (
        <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">اختر طبيبًا لعرض تقرير الإيرادات الخاص به</Typography>
        </Paper>
      )}

      {reportQuery.isLoading && <PageLoader />}

      {report && (
        <>
          <Stack direction="row" flexWrap="wrap" sx={{ gap: 1.5 }}>
            <Paper variant="outlined" sx={{ p: 1.5, minWidth: 160 }}>
              <Typography variant="caption" color="text.secondary">
                عدد المرضى
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {formatNumber(report.summary.patients_count)}
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 1.5, minWidth: 160 }}>
              <Typography variant="caption" color="text.secondary">
                عدد التنويمات
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {formatNumber(report.summary.admissions_count)}
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 1.5, minWidth: 160 }}>
              <Typography variant="caption" color="text.secondary">
                إيراد الغرف
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {formatNumber(report.summary.room_revenue)}
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 1.5, minWidth: 160 }}>
              <Typography variant="caption" color="text.secondary">
                إيراد الخدمات
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {formatNumber(report.summary.services_revenue)}
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 1.5, minWidth: 160 }}>
              <Typography variant="caption" color="text.secondary">
                إيراد العمليات
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {formatNumber(report.summary.operations_revenue)}
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 1.5, minWidth: 160 }}>
              <Typography variant="caption" color="text.secondary">
                الإجمالي
              </Typography>
              <Typography variant="h6" fontWeight={700} color="success.main">
                {formatNumber(report.summary.total_revenue)}
              </Typography>
            </Paper>
          </Stack>

          {report.room_revenue_by_type.length > 0 && (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>نوع الغرفة</TableCell>
                    <TableCell align="right">الإيراد</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {report.room_revenue_by_type.map((row) => (
                    <TableRow key={row.room_type_code ?? row.room_type_name} hover>
                      <TableCell>{row.room_type_name}</TableCell>
                      <TableCell align="right">{formatNumber(row.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>الإجمالي</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {formatNumber(report.summary.room_revenue)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </TableContainer>
          )}

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>تاريخ الدخول</TableCell>
                  <TableCell>المريض</TableCell>
                  <TableCell>نوع الغرفة</TableCell>
                  <TableCell align="right">إيراد الغرفة</TableCell>
                  <TableCell align="right">إيراد الخدمات</TableCell>
                  <TableCell align="right">إيراد العمليات</TableCell>
                  <TableCell align="right">الإجمالي</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.admissions.map((row) => (
                  <TableRow key={row.admission_id} hover>
                    <TableCell>{row.admission_date ? dayjs(row.admission_date).format('DD/MM/YYYY') : '—'}</TableCell>
                    <TableCell>{row.patient_name ?? '—'}</TableCell>
                    <TableCell>{row.room_type_name ?? '—'}</TableCell>
                    <TableCell align="right">{formatNumber(row.room_revenue)}</TableCell>
                    <TableCell align="right">{formatNumber(row.services_revenue)}</TableCell>
                    <TableCell align="right">{formatNumber(row.operations_revenue)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {formatNumber(row.total_revenue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3} sx={{ fontWeight: 700 }}>
                    الإجمالي
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {formatNumber(report.summary.room_revenue)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {formatNumber(report.summary.services_revenue)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {formatNumber(report.summary.operations_revenue)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {formatNumber(report.summary.total_revenue)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  )
}
