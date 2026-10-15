import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ConfigProvider, Card, Input, Table, Typography, Button, Flex } from 'antd'
import { EyeOutlined, HistoryOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useAntTheme } from '@/lib/antdTheme'
import { searchLocalPatients } from '@/services/patientService'
import { getAdmissions } from '@/services/admissionService'
import { AdmissionHistoryTab } from '@/components/patients/AdmissionHistoryTab'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import type { Patient } from '@/types/patient'

const { Title } = Typography

const GENDER_LABEL: Record<string, string> = { male: 'ذكر', female: 'أنثى' }

export function PatientsPage() {
  const antTheme = useAntTheme()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [expandedPatientIds, setExpandedPatientIds] = useState<number[]>([])

  const patientsQuery = useQuery({
    queryKey: ['patients', debouncedSearch],
    queryFn: () => searchLocalPatients(debouncedSearch),
  })

  const columns: ColumnsType<Patient> = [
    { title: 'رقم الملف', dataIndex: 'id', key: 'id' },
    { title: 'الاسم', dataIndex: 'name', key: 'name' },
    { title: 'الهاتف', dataIndex: 'phone', key: 'phone', render: (v) => v ?? '—' },
    {
      title: 'النوع',
      key: 'gender',
      render: (_, patient) => (patient.gender ? GENDER_LABEL[patient.gender] ?? patient.gender : '—'),
    },
    { title: 'العنوان', dataIndex: 'address', key: 'address', render: (v) => v ?? '—' },
    {
      title: 'شركة التأمين',
      key: 'insurance_company',
      render: (_, patient) => patient.insurance_company?.name ?? '—',
    },
    {
      title: 'رقم البطاقة',
      key: 'insurance_card_number',
      render: (_, patient) => patient.insurance_card_number ?? '—',
    },
    {
      title: '',
      key: 'actions',
      render: (_, patient) => (
        <Flex gap={8}>
          <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/patients/${patient.id}`)}>
            عرض الملف
          </Button>
          <Button
            size="small"
            icon={<HistoryOutlined />}
            onClick={() =>
              setExpandedPatientIds((ids) =>
                ids.includes(patient.id) ? ids.filter((id) => id !== patient.id) : [...ids, patient.id],
              )
            }
          >
            سجل التنويم
          </Button>
        </Flex>
      ),
    },
  ]

  return (
    <ConfigProvider direction="rtl" theme={antTheme}>
      <Title level={3} style={{ margin: '0 0 16px' }}>
        سجل المرضى
      </Title>

      <Input
        style={{ marginBottom: 16, maxWidth: 384 }}
        placeholder="بحث بالاسم أو رقم الهاتف..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Card>
        <Table
          size="small"
          rowKey="id"
          loading={patientsQuery.isLoading}
          columns={columns}
          dataSource={patientsQuery.data ?? []}
          pagination={false}
          expandable={{
            expandedRowRender: (patient) => <PatientAdmissionHistory patientId={patient.id} />,
            expandedRowKeys: expandedPatientIds,
            showExpandColumn: false,
          }}
        />
      </Card>
    </ConfigProvider>
  )
}

/** Lazily loads and shows a patient's admission history inline when their row is expanded. */
function PatientAdmissionHistory({ patientId }: { patientId: number }) {
  const admissionsQuery = useQuery({
    queryKey: ['patient', patientId, 'admissions'],
    queryFn: () => getAdmissions({ patient_id: patientId }),
  })

  return (
    <AdmissionHistoryTab
      patientId={patientId}
      admissions={admissionsQuery.data?.data}
      isLoading={admissionsQuery.isLoading}
    />
  )
}
