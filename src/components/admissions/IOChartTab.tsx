import { useState } from 'react'
import { Card, InputNumber, Button, Table, Typography, Flex, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { formatDateTime } from '@/lib/utils'
import type { IntakeOutputRecord } from '@/types/admission'

const { Text } = Typography

interface IOChartTabProps {
  records: IntakeOutputRecord[]
  onAdd: (payload: Partial<IntakeOutputRecord>) => void
  isSubmitting: boolean
}

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

export function IOChartTab({ records, onAdd, isSubmitting }: IOChartTabProps) {
  const [feeding, setFeeding] = useState<number | null>(null)
  const [ivFluid, setIvFluid] = useState<number | null>(null)
  const [maintenance, setMaintenance] = useState<number | null>(null)
  const [urineOutput, setUrineOutput] = useState<number | null>(null)
  const [insensibleLosses, setInsensibleLosses] = useState<number | null>(null)
  const [totalIntake, setTotalIntake] = useState<number | null>(null)
  const [totalOutput, setTotalOutput] = useState<number | null>(null)
  const [balance, setBalance] = useState<number | null>(null)

  function handleSubmit() {
    onAdd({
      feeding: feeding ?? undefined,
      iv_fluid: ivFluid ?? undefined,
      maintenance: maintenance ?? undefined,
      urine_output: urineOutput ?? undefined,
      insensible_losses: insensibleLosses ?? undefined,
      total_intake: totalIntake ?? undefined,
      total_output: totalOutput ?? undefined,
      balance: balance ?? undefined,
    })
    setFeeding(null)
    setIvFluid(null)
    setMaintenance(null)
    setUrineOutput(null)
    setInsensibleLosses(null)
    setTotalIntake(null)
    setTotalOutput(null)
    setBalance(null)
  }

  const columns: ColumnsType<IntakeOutputRecord> = [
    { title: 'الوقت', key: 'recorded_at', render: (_, r) => formatDateTime(r.recorded_at) },
    { title: 'التغذية', dataIndex: 'feeding', key: 'feeding', render: (v) => v ?? '—' },
    { title: 'سوائل IV', dataIndex: 'iv_fluid', key: 'iv_fluid', render: (v) => v ?? '—' },
    { title: 'المحافظ', dataIndex: 'maintenance', key: 'maintenance', render: (v) => v ?? '—' },
    { title: 'البول', dataIndex: 'urine_output', key: 'urine_output', render: (v) => v ?? '—' },
    { title: 'الفقد غير الملحوظ', dataIndex: 'insensible_losses', key: 'insensible_losses', render: (v) => v ?? '—' },
    { title: 'إجمالي الوارد', dataIndex: 'total_intake', key: 'total_intake', render: (v) => v ?? '—' },
    { title: 'إجمالي الصادر', dataIndex: 'total_output', key: 'total_output', render: (v) => v ?? '—' },
    { title: 'الميزان', dataIndex: 'balance', key: 'balance', render: (v) => v ?? '—' },
  ]

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card title="تسجيل سوائل جديد">
        <Flex wrap="wrap" align="flex-end" gap={12}>
          <FieldLabel label="التغذية">
            <InputNumber style={{ width: 96 }} value={feeding} onChange={setFeeding} />
          </FieldLabel>
          <FieldLabel label="سوائل IV">
            <InputNumber style={{ width: 96 }} value={ivFluid} onChange={setIvFluid} />
          </FieldLabel>
          <FieldLabel label="المحافظ">
            <InputNumber style={{ width: 96 }} value={maintenance} onChange={setMaintenance} />
          </FieldLabel>
          <FieldLabel label="البول">
            <InputNumber style={{ width: 96 }} value={urineOutput} onChange={setUrineOutput} />
          </FieldLabel>
          <FieldLabel label="الفقد غير الملحوظ">
            <InputNumber style={{ width: 96 }} value={insensibleLosses} onChange={setInsensibleLosses} />
          </FieldLabel>
          <FieldLabel label="إجمالي الوارد">
            <InputNumber style={{ width: 96 }} value={totalIntake} onChange={setTotalIntake} />
          </FieldLabel>
          <FieldLabel label="إجمالي الصادر">
            <InputNumber style={{ width: 96 }} value={totalOutput} onChange={setTotalOutput} />
          </FieldLabel>
          <FieldLabel label="الميزان">
            <InputNumber style={{ width: 96 }} value={balance} onChange={setBalance} />
          </FieldLabel>
          <Button type="primary" onClick={handleSubmit} loading={isSubmitting}>
            إضافة
          </Button>
        </Flex>
      </Card>

      <Card>
        <Table
          size="small"
          rowKey="id"
          columns={columns}
          dataSource={records}
          pagination={false}
          locale={{ emptyText: 'لا توجد تسجيلات بعد' }}
        />
      </Card>
    </Space>
  )
}
