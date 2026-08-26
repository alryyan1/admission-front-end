import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ConfigProvider, Card, Button, Table, Popconfirm, Typography, Flex, Space, DatePicker, Select, Input } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import { useAntTheme } from '@/lib/antdTheme'
import { formatDate, formatNumber } from '@/lib/utils'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { StatTile } from '@/components/statistics/StatTile'
import { getExpenses, createExpense, updateExpense, deleteExpense, type ExpensePayload } from '@/services/expenseService'
import { ExpenseFormModal, EXPENSE_CATEGORIES } from '@/components/expenses/ExpenseFormModal'
import type { Expense } from '@/types/expense'

const { Title } = Typography
const { RangePicker } = DatePicker

export function ExpensesPage() {
  const antTheme = useAntTheme()
  const queryClient = useQueryClient()

  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([dayjs().startOf('month'), dayjs().endOf('month')])
  const [category, setCategory] = useState<string | undefined>(undefined)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [expenseModal, setExpenseModal] = useState<{ open: boolean; expense: Expense | null }>({
    open: false,
    expense: null,
  })

  const dateFrom = dateRange[0].format('YYYY-MM-DD')
  const dateTo = dateRange[1].format('YYYY-MM-DD')

  const expensesQuery = useQuery({
    queryKey: ['expenses', dateFrom, dateTo, category, debouncedSearch],
    queryFn: () => getExpenses({ date_from: dateFrom, date_to: dateTo, category, search: debouncedSearch || undefined }),
  })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['expenses'] })
  }

  const saveExpenseMutation = useMutation({
    mutationFn: (payload: ExpensePayload & { id?: number }) => {
      const { id, ...data } = payload
      return id ? updateExpense(id, data) : createExpense(data)
    },
    onSuccess: () => {
      toast.success('تم حفظ المصروف')
      invalidate()
      setExpenseModal({ open: false, expense: null })
    },
  })

  const deleteExpenseMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      toast.success('تم حذف المصروف')
      invalidate()
    },
  })

  const expenses = expensesQuery.data ?? []
  const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

  const columns: ColumnsType<Expense> = [
    { title: 'التاريخ', key: 'expense_date', render: (_, e) => formatDate(e.expense_date), width: 120 },
    { title: 'التصنيف', dataIndex: 'category', key: 'category' },
    { title: 'الوصف', key: 'description', render: (_, e) => e.description ?? '—' },
    { title: 'طريقة الدفع', key: 'payment_method', render: (_, e) => e.payment_method?.name ?? '—' },
    { title: 'سجّله', key: 'recorded_by', render: (_, e) => e.recorded_by?.name ?? '—' },
    { title: 'المبلغ', key: 'amount', align: 'end', render: (_, e) => <strong>{formatNumber(e.amount)}</strong> },
    {
      title: '',
      key: 'actions',
      render: (_, e) => (
        <Space size={4}>
          <Button size="small" onClick={() => setExpenseModal({ open: true, expense: e })}>
            تعديل
          </Button>
          <Popconfirm
            title="حذف المصروف؟"
            description="لا يمكن التراجع عن هذا الإجراء."
            onConfirm={() => deleteExpenseMutation.mutate(e.id)}
          >
            <Button size="small" danger>
              حذف
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <ConfigProvider direction="rtl" theme={antTheme}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }} wrap="wrap" gap={12}>
        <Title level={3} style={{ margin: 0 }}>
          المصروفات
        </Title>
        <Space wrap>
          <RangePicker
            value={dateRange}
            onChange={(values) => {
              if (values && values[0] && values[1]) {
                setDateRange([values[0], values[1]])
              }
            }}
            allowClear={false}
            format="YYYY-MM-DD"
          />
          <Select
            style={{ minWidth: 160 }}
            allowClear
            placeholder="كل التصنيفات"
            value={category}
            onChange={(v) => setCategory(v ?? undefined)}
            options={EXPENSE_CATEGORIES.map((c) => ({ label: c, value: c }))}
          />
          <Input
            style={{ maxWidth: 220 }}
            placeholder="بحث في الوصف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />
          <Button type="primary" onClick={() => setExpenseModal({ open: true, expense: null })}>
            + مصروف جديد
          </Button>
        </Space>
      </Flex>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4" style={{ marginBottom: 16 }}>
        <StatTile label="عدد المصروفات" value={String(expenses.length)} />
        <StatTile label="إجمالي المصروفات" value={formatNumber(totalAmount)} />
      </div>

      <Card>
        <Table
          rowKey="id"
          loading={expensesQuery.isLoading}
          columns={columns}
          dataSource={expenses}
          pagination={{ pageSize: 20 }}
          locale={{ emptyText: 'لا توجد مصروفات في هذه الفترة' }}
        />
      </Card>

      <ExpenseFormModal
        open={expenseModal.open}
        onClose={() => setExpenseModal({ open: false, expense: null })}
        expense={expenseModal.expense}
        onSubmit={(payload) => saveExpenseMutation.mutate({ ...payload, id: expenseModal.expense?.id })}
        isSubmitting={saveExpenseMutation.isPending}
      />
    </ConfigProvider>
  )
}
