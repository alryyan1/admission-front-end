import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Box,
  Paper,
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
import { getDailyRevenueReport } from '@/services/reportService'
import { formatNumber } from '@/lib/utils'

export function DailyRevenueReportPage() {
  const [month, setMonth] = useState(() => dayjs().format('YYYY-MM'))

  const reportQuery = useQuery({
    queryKey: ['reports', 'daily-revenue', month],
    queryFn: () => getDailyRevenueReport(month),
    enabled: !!month,
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
            الإيراد اليومي
          </Typography>
          <Typography variant="caption" color="text.secondary">
            المدفوعات لكل يوم من أيام الشهر مقسمة حسب طريقة الدفع
          </Typography>
        </Box>
        <TextField
          label="الشهر"
          type="month"
          size="small"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ width: 180 }}
        />
      </Paper>

      {reportQuery.isLoading && <PageLoader />}

      {report && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>التاريخ</TableCell>
                {report.payment_methods.map((method) => (
                  <TableCell key={method.key} align="right">
                    {method.name}
                  </TableCell>
                ))}
                <TableCell align="right">الإجمالي</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {report.days.map((day) => (
                <TableRow key={day.date} hover>
                  <TableCell>{dayjs(day.date).format('DD/MM/YYYY')}</TableCell>
                  {report.payment_methods.map((method) => (
                    <TableCell key={method.key} align="right">
                      {formatNumber(day.amounts[method.key] ?? 0)}
                    </TableCell>
                  ))}
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {formatNumber(day.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>إجمالي الشهر</TableCell>
                {report.payment_methods.map((method) => (
                  <TableCell key={method.key} align="right" sx={{ fontWeight: 700 }}>
                    {formatNumber(report.totals.amounts[method.key] ?? 0)}
                  </TableCell>
                ))}
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  {formatNumber(report.totals.total)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}
