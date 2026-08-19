import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { PageLoader } from '@/components/common/PageLoader'
import { searchLocalPatients } from '@/services/patientService'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'

const GENDER_LABEL: Record<string, string> = { male: 'ذكر', female: 'أنثى' }

export function PatientsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)

  const patientsQuery = useQuery({
    queryKey: ['patients', debouncedSearch],
    queryFn: () => searchLocalPatients(debouncedSearch),
  })

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">المرضى</h1>
      </div>

      <Input
        className="mb-4 max-w-sm"
        placeholder="بحث بالاسم أو رقم الهاتف..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {patientsQuery.isLoading ? (
        <PageLoader />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الملف</TableHead>
                <TableHead>الاسم</TableHead>
                <TableHead>الهاتف</TableHead>
                <TableHead>الجنس</TableHead>
                <TableHead>العنوان</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patientsQuery.data?.map((patient) => (
                <TableRow
                  key={patient.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/patients/${patient.id}`)}
                >
                  <TableCell>{patient.id}</TableCell>
                  <TableCell>{patient.name}</TableCell>
                  <TableCell>{patient.phone ?? '—'}</TableCell>
                  <TableCell>{patient.gender ? GENDER_LABEL[patient.gender] ?? patient.gender : '—'}</TableCell>
                  <TableCell>{patient.address ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
