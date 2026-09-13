import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Avatar,
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import { CloseOutlined, ContactsOutlined, MedicineBoxOutlined, SolutionOutlined, UserOutlined } from '@ant-design/icons'
import { getPatient } from '@/services/patientService'
import { useAuth } from '@/contexts/AuthContext'
import { PageLoader } from '@/components/common/PageLoader'
import { OverviewTab } from '@/components/patients/OverviewTab'
import { EmergencyContactTab } from '@/components/patients/EmergencyContactTab'
import { MedicalInfoTab } from '@/components/patients/MedicalInfoTab'
import { AdmissionDetailsTab } from '@/components/admissions/AdmissionDetailsTab'
import type { Admission } from '@/types/admission'

interface PatientEditDialogProps {
  patientId: number | null
  onClose: () => void
  /** When provided, also shows/edits the admitting/referring doctor, diagnosis, and admission notes for this admission. */
  admission?: Admission | null
}

type SectionKey = 'admission' | 'overview' | 'emergency' | 'medical'

/** Modal wrapper around the patient's editable overview/emergency/medical tabs, plus the current admission's details when given one. */
export function PatientEditDialog({ patientId, onClose, admission }: PatientEditDialogProps) {
  const { user } = useAuth()
  const canEdit = user?.role === 'admin' || user?.role === 'admission_clerk'
  const canEditAdmission = canEdit || user?.role === 'doctor'

  const [section, setSection] = useState<SectionKey>(admission ? 'admission' : 'overview')

  // Reset the active tab only when the dialog opens for a (possibly different) patient — not on
  // every `admission` refetch, since saving any field invalidates the admissions query and would
  // otherwise yank focus back to the default tab mid-edit.
  const admissionRef = useRef(admission)
  admissionRef.current = admission
  useEffect(() => {
    if (patientId) setSection(admissionRef.current ? 'admission' : 'overview')
  }, [patientId])

  const patientQuery = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => getPatient(patientId!),
    enabled: !!patientId,
  })

  const patient = patientQuery.data

  return (
    <Dialog open={!!patientId} onClose={onClose} fullWidth maxWidth="md" scroll="paper">
      <DialogTitle sx={{ p: 0 }}>
        <Stack
          direction="row"
          sx={{ alignItems: 'center', justifyContent: 'space-between', pl: 1.5, pr: 3, py: 2 }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44 }}>
              <UserOutlined />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                {patient?.name ?? 'تعديل بيانات المريض'}
              </Typography>
            </Box>
          </Stack>
          <IconButton size="small" onClick={onClose} aria-label="إغلاق">
            <CloseOutlined style={{ fontSize: 16 }} />
          </IconButton>
        </Stack>
        <Divider />
        <Tabs
          value={section}
          onChange={(_, value: SectionKey) => setSection(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: 2, minHeight: 46 }}
        >
          {admission && (
            <Tab
              value="admission"
              label="بيانات التنويم"
              icon={<SolutionOutlined />}
              iconPosition="start"
              sx={{ minHeight: 46, py: 1.5 }}
            />
          )}
          <Tab
            value="overview"
            label="البيانات الأساسية"
            icon={<UserOutlined />}
            iconPosition="start"
            sx={{ minHeight: 46, py: 1.5 }}
          />
          <Tab
            value="emergency"
            label="جهة الطوارئ"
            icon={<ContactsOutlined />}
            iconPosition="start"
            sx={{ minHeight: 46, py: 1.5 }}
          />
          <Tab
            value="medical"
            label="البيانات الطبية"
            icon={<MedicineBoxOutlined />}
            iconPosition="start"
            sx={{ minHeight: 46, py: 1.5 }}
          />
        </Tabs>
      </DialogTitle>
      <DialogContent sx={{ bgcolor: 'grey.50', pt: 3 ,mb:1,mt:2}}>
        {patient ? (
          <Box>
            {section === 'admission' && admission && (
              <AdmissionDetailsTab admission={admission} editable={canEditAdmission} />
            )}
            {section === 'overview' && <OverviewTab patient={patient} editable={canEdit} />}
            {section === 'emergency' && <EmergencyContactTab patient={patient} editable={canEdit} />}
            {section === 'medical' && <MedicalInfoTab patient={patient} editable={canEdit} />}
          </Box>
        ) : (
          <PageLoader />
        )}
      </DialogContent>
    </Dialog>
  )
}
