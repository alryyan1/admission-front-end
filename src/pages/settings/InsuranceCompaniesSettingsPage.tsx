import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Button,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import {
  getInsuranceCompanies,
  updateInsuranceCompany,
  deleteInsuranceCompany,
  type InsuranceCompanyPayload,
} from '@/services/insuranceCompanyService'
import { InlineEditableField } from '@/components/patients/InlineEditableField'
import { ConfirmRemoveButton } from '@/components/common/ConfirmRemoveButton'
import { InsuranceCompanyFormDialog } from '@/components/settings/InsuranceCompanyFormDialog'

export function InsuranceCompaniesSettingsPage() {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)

  const companiesQuery = useQuery({ queryKey: ['insurance-companies'], queryFn: getInsuranceCompanies })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['insurance-companies'] })
  }

  const updateCompanyMutation = useMutation({
    mutationFn: ({ id, ...payload }: { id: number } & InsuranceCompanyPayload) => updateInsuranceCompany(id, payload),
    onSuccess: invalidate,
  })

  const deleteCompanyMutation = useMutation({
    mutationFn: deleteInsuranceCompany,
    onSuccess: () => {
      toast.success('تم حذف شركة التأمين')
      invalidate()
    },
  })

  const companies = companiesQuery.data ?? []

  return (
    <>
      <Stack direction="row" sx={{ mb: 2, justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h1">
          شركات التأمين
        </Typography>
        <Button variant="contained" onClick={() => setFormOpen(true)}>
          إضافة شركة
        </Button>
      </Stack>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>الاسم</TableCell>
              <TableCell>الهاتف</TableCell>
              <TableCell>البريد الإلكتروني</TableCell>
              <TableCell>نسبة التحمل (%)</TableCell>
              <TableCell align="center">إجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {companies.map((company) => (
              <TableRow key={company.id} hover>
                <TableCell>
                  <InlineEditableField
                    editable
                    value={company.name}
                    onSave={async (v) => {
                      await updateCompanyMutation.mutateAsync({ id: company.id, name: String(v ?? '') })
                    }}
                  />
                </TableCell>
                <TableCell>
                  <InlineEditableField
                    editable
                    value={company.phone}
                    onSave={async (v) => {
                      await updateCompanyMutation.mutateAsync({ id: company.id, phone: v ? String(v) : null })
                    }}
                  />
                </TableCell>
                <TableCell>
                  <InlineEditableField
                    editable
                    value={company.email}
                    onSave={async (v) => {
                      await updateCompanyMutation.mutateAsync({ id: company.id, email: v ? String(v) : null })
                    }}
                  />
                </TableCell>
                <TableCell>
                  <InlineEditableField
                    editable
                    type="number"
                    value={company.coverage_percentage === null ? null : Number(company.coverage_percentage)}
                    onSave={async (v) => {
                      await updateCompanyMutation.mutateAsync({
                        id: company.id,
                        coverage_percentage: v === null || v === '' ? null : Number(v),
                      })
                    }}
                  />
                </TableCell>
                <TableCell align="center">
                  <ConfirmRemoveButton
                    label="حذف"
                    description="حذف شركة التأمين؟ لا يمكن التراجع عن هذا الإجراء."
                    loading={deleteCompanyMutation.isPending}
                    onConfirm={() => deleteCompanyMutation.mutate(company.id)}
                  />
                </TableCell>
              </TableRow>
            ))}
            {companies.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body2" color="text.secondary">
                    لا توجد شركات تأمين بعد
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <InsuranceCompanyFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </>
  )
}
