import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Autocomplete,
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
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { getExpensesReport } from '@/services/reportService'
import { EXPENSE_CATEGORIES } from '@/components/expenses/ExpenseFormModal'
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

export function ExpensesReportPage() {
  const [from, setFrom] = useState(() => getCurrentMonthRange().from)
  const [to, setTo] = useState(() => getCurrentMonthRange().to)
  const [category, setCategory] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(20)

  const reportQuery = useQuery({
    queryKey: ['reports', 'expenses', from, to, category, debouncedSearch],
    queryFn: () => getExpensesReport({ from, to, category: category ?? undefined, search: debouncedSearch || undefined }),
  })

  const expenses = reportQuery.data?.expenses ?? []
  const pagedExpenses = expenses.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Typography variant="subtitle1" fontWeight={700}>
          تقرير المصروفات
        </Typography>
        <Typography variant="caption" color="text.secondary">
          إجمالي المصروفات مقسمة حسب التصنيف وطريقة الدفع ضمن الفترة المحددة
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
          <Autocomplete<string>
            size="small"
            sx={{ width: 190 }}
            options={EXPENSE_CATEGORIES}
            value={category}
            onChange={(_, value) => {
              setCategory(value)
              setPage(0)
            }}
            renderInput={(params) => <TextField {...params} label="التصنيف" />}
          />
          <TextField
            label="الوصف"
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
            <StatTile label="عدد المصروفات" value={formatNumber(reportQuery.data.summary.count)} />
            <StatTile label="إجمالي المصروفات" value={formatNumber(reportQuery.data.summary.total_amount)} />
            {reportQuery.data.by_category.map((row) => (
              <StatTile key={row.category} label={row.category} value={formatNumber(row.total)} />
            ))}
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {reportQuery.data.by_method.map((row) => (
              <StatTile key={row.method} label={`طريقة الدفع: ${row.method}`} value={formatNumber(row.total)} />
            ))}
          </Box>

          <Paper variant="outlined">
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>التاريخ</TableCell>
                    <TableCell>التصنيف</TableCell>
                    <TableCell>الوصف</TableCell>
                    <TableCell>طريقة الدفع</TableCell>
                    <TableCell>سجّله</TableCell>
                    <TableCell>المبلغ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagedExpenses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                        لا توجد مصروفات ضمن الفترة المحددة
                      </TableCell>
                    </TableRow>
                  )}
                  {pagedExpenses.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{formatDate(row.expense_date)}</TableCell>
                      <TableCell>{row.category}</TableCell>
                      <TableCell>{row.description ?? '—'}</TableCell>
                      <TableCell>{row.payment_method ?? '—'}</TableCell>
                      <TableCell>{row.recorded_by ?? '—'}</TableCell>
                      <TableCell>{formatNumber(row.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={expenses.length}
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
