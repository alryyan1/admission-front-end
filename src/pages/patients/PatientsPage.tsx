import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ConfigProvider, Card, Input, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useAntTheme } from '@/lib/antdTheme'
import { searchLocalPatients } from '@/services/patientService'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import type { Patient } from '@/types/patient'

const { Title } = Typography

const GENDER_LABEL: Record<string, string> = { male: 'ذكر', female: 'أنثى' }

export function PatientsPage() {
  const antTheme = useAntTheme()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)

  const patientsQuery = useQuery({
    queryKey: ['patients', debouncedSearch],
    queryFn: () => searchLocalPatients(debouncedSearch),
  })

  const columns: ColumnsType<Patient> = [
    { title: 'رقم الملف', dataIndex: 'id', key: 'id' },
    { title: 'الاسم', dataIndex: 'name', key: 'name' },
    { title: 'الهاتف', dataIndex: 'phone', key: 'phone', render: (v) => v ?? '—' },
    {
      title: 'الجنس',
      key: 'gender',
      render: (_, patient) => (patient.gender ? GENDER_LABEL[patient.gender] ?? patient.gender : '—'),
    },
    { title: 'العنوان', dataIndex: 'address', key: 'address', render: (v) => v ?? '—' },
  ]

  return (
    <ConfigProvider direction="rtl" theme={antTheme}>
      <Title level={3} style={{ margin: '0 0 16px' }}>
        المرضى
      </Title>

      <Input
        style={{ marginBottom: 16, maxWidth: 384 }}
        placeholder="بحث بالاسم أو رقم الهاتف..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Card>
        <Table
          rowKey="id"
          loading={patientsQuery.isLoading}
          columns={columns}
          dataSource={patientsQuery.data ?? []}
          pagination={false}
          onRow={(patient) => ({
            className: 'cursor-pointer',
            onClick: () => navigate(`/patients/${patient.id}`),
          })}
        />
      </Card>
    </ConfigProvider>
  )
}
