import { useState } from 'react'
import { Card, Input, InputNumber, Button, Table, Typography, Flex, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { formatDateTime } from '@/lib/utils'
import type { VitalSign } from '@/types/admission'

const { Text } = Typography

interface VitalsTabProps {
  vitals: VitalSign[]
  onAdd: (payload: Partial<VitalSign>) => void
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

export function VitalsTab({ vitals, onAdd, isSubmitting }: VitalsTabProps) {
  const [temperature, setTemperature] = useState('')
  const [pulse, setPulse] = useState<number | null>(null)
  const [respirationRate, setRespirationRate] = useState<number | null>(null)
  const [bloodPressure, setBloodPressure] = useState('')
  const [oxygenSaturation, setOxygenSaturation] = useState<number | null>(null)

  function handleSubmit() {
    onAdd({
      temperature: temperature || undefined,
      pulse: pulse ?? undefined,
      respiration_rate: respirationRate ?? undefined,
      blood_pressure: bloodPressure || undefined,
      oxygen_saturation: oxygenSaturation ?? undefined,
    })
    setTemperature('')
    setPulse(null)
    setRespirationRate(null)
    setBloodPressure('')
    setOxygenSaturation(null)
  }

  const columns: ColumnsType<VitalSign> = [
    { title: 'الوقت', key: 'recorded_at', render: (_, v) => formatDateTime(v.recorded_at) },
    { title: 'الحرارة', dataIndex: 'temperature', key: 'temperature', render: (v) => v ?? '—' },
    { title: 'النبض', dataIndex: 'pulse', key: 'pulse', render: (v) => v ?? '—' },
    { title: 'التنفس', dataIndex: 'respiration_rate', key: 'respiration_rate', render: (v) => v ?? '—' },
    { title: 'ضغط الدم', dataIndex: 'blood_pressure', key: 'blood_pressure', render: (v) => v ?? '—' },
    { title: 'الأكسجين', dataIndex: 'oxygen_saturation', key: 'oxygen_saturation', render: (v) => v ?? '—' },
  ]

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card title="تسجيل علامة حيوية جديدة">
        <Flex wrap="wrap" align="flex-end" gap={12}>
          <FieldLabel label="الحرارة (°C)">
            <Input
              style={{ width: 112 }}
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
            />
          </FieldLabel>
          <FieldLabel label="النبض">
            <InputNumber style={{ width: 96 }} value={pulse} onChange={(v) => setPulse(v)} />
          </FieldLabel>
          <FieldLabel label="التنفس">
            <InputNumber style={{ width: 96 }} value={respirationRate} onChange={(v) => setRespirationRate(v)} />
          </FieldLabel>
          <FieldLabel label="ضغط الدم">
            <Input
              style={{ width: 112 }}
              placeholder="120/80"
              value={bloodPressure}
              onChange={(e) => setBloodPressure(e.target.value)}
            />
          </FieldLabel>
          <FieldLabel label="تشبع الأكسجين %">
            <InputNumber style={{ width: 112 }} value={oxygenSaturation} onChange={(v) => setOxygenSaturation(v)} />
          </FieldLabel>
          <Button type="primary" onClick={handleSubmit} loading={isSubmitting}>
            إضافة
          </Button>
        </Flex>
      </Card>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={vitals}
          pagination={false}
          locale={{ emptyText: 'لا توجد تسجيلات بعد' }}
        />
      </Card>
    </Space>
  )
}
