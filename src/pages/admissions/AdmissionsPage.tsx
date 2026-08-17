import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import { PageLoader } from '@/components/common/PageLoader'
import { getAdmissions } from '@/services/admissionService'
import { NewAdmissionDialog } from '@/components/admissions/NewAdmissionDialog'
import { formatDateTime } from '@/lib/utils'
import type { AdmissionStatus } from '@/types/admission'

export function AdmissionsPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<AdmissionStatus>('admitted')
  const [dialogOpen, setDialogOpen] = useState(false)

  const admissionsQuery = useQuery({
    queryKey: ['admissions', status],
    queryFn: () => getAdmissions(status),
  })

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">حالات التنويم</h1>
        <Button onClick={() => setDialogOpen(true)}>+ تنويم جديد</Button>
      </div>

      <Tabs value={status} onValueChange={(v) => setStatus(v as AdmissionStatus)} className="mb-4">
        <TabsList>
          <TabsTrigger value="admitted">نشطة</TabsTrigger>
          <TabsTrigger value="discharged">مخرّجة</TabsTrigger>
          <TabsTrigger value="cancelled">ملغاة</TabsTrigger>
        </TabsList>
      </Tabs>

      {admissionsQuery.isLoading ? (
        <PageLoader />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم التنويم</TableHead>
                <TableHead>المريض</TableHead>
                <TableHead>السرير</TableHead>
                <TableHead>الطبيب المعالج</TableHead>
                <TableHead>تاريخ الدخول</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admissionsQuery.data?.data.map((admission) => (
                <TableRow
                  key={admission.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/admissions/${admission.id}`)}
                >
                  <TableCell>{admission.admission_number ?? '—'}</TableCell>
                  <TableCell>{admission.patient?.name}</TableCell>
                  <TableCell>
                    {admission.bed?.room?.ward?.name} — غرفة {admission.bed?.room?.room_number} — سرير{' '}
                    {admission.bed?.bed_number}
                  </TableCell>
                  <TableCell>{admission.admitting_doctor?.name ?? '—'}</TableCell>
                  <TableCell>{formatDateTime(admission.admission_date)}</TableCell>
                  <TableCell>
                    <Badge variant={admission.status === 'admitted' ? 'success' : 'secondary'}>
                      {admission.status === 'admitted' ? 'نشطة' : admission.status === 'discharged' ? 'مخرّجة' : 'ملغاة'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <NewAdmissionDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  )
}
