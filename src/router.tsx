import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { RequireRole } from '@/components/layout/RequireRole'
import { LoginPage } from '@/pages/auth/LoginPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { FacilitySettingsPage } from '@/pages/settings/FacilitySettingsPage'
import { ProcedureCatalogSettingsPage } from '@/pages/settings/ProcedureCatalogSettingsPage'
import { ServiceCatalogSettingsPage } from '@/pages/settings/ServiceCatalogSettingsPage'
import { DoctorsSettingsPage } from '@/pages/settings/DoctorsSettingsPage'
import { TeamRolesSettingsPage } from '@/pages/settings/TeamRolesSettingsPage'
import { SessionsSettingsPage } from '@/pages/settings/SessionsSettingsPage'
import { ActivityLogPage } from '@/pages/settings/ActivityLogPage'
import { UsersSettingsPage } from '@/pages/settings/UsersSettingsPage'
import { RolesPermissionsPage } from '@/pages/settings/RolesPermissionsPage'
import { FacilityMapPage } from '@/pages/facility/FacilityMapPage'
import { AdmissionsPage } from '@/pages/admissions/AdmissionsPage'
import { AdmissionDetailPage } from '@/pages/admissions/AdmissionDetailPage'
import { PatientsPage } from '@/pages/patients/PatientsPage'
import { PatientDetailPage } from '@/pages/patients/PatientDetailPage'
import { OperationsPage } from '@/pages/operations/OperationsPage'
import { OperationDetailPage } from '@/pages/operations/OperationDetailPage'
import { StatisticsPage } from '@/pages/statistics/StatisticsPage'
import { CashierPage } from '@/pages/cashier/CashierPage'
import { ErrorPage } from '@/pages/errors/ErrorPage'

export const router = createBrowserRouter([
  {
    errorElement: <ErrorPage />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: '/', element: <DashboardPage /> },
              { path: '/admissions', element: <AdmissionsPage /> },
              { path: '/facility-map', element: <FacilityMapPage /> },
              { path: '/admissions/:admissionId', element: <AdmissionDetailPage /> },
              { path: '/patients', element: <PatientsPage /> },
              { path: '/patients/:patientId', element: <PatientDetailPage /> },
              { path: '/operations', element: <OperationsPage /> },
              { path: '/operations/:operationId', element: <OperationDetailPage /> },
              { path: '/statistics', element: <StatisticsPage /> },
              {
                element: <RequireRole roles={['admin', 'cashier']} />,
                children: [{ path: '/cashier', element: <CashierPage /> }],
              },
              {
                element: <RequireRole roles={['admin']} />,
                children: [
                  { path: '/settings/facility', element: <FacilitySettingsPage /> },
                  { path: '/settings/procedures', element: <ProcedureCatalogSettingsPage /> },
                  { path: '/settings/services', element: <ServiceCatalogSettingsPage /> },
                  { path: '/settings/doctors', element: <DoctorsSettingsPage /> },
                  { path: '/settings/team-roles', element: <TeamRolesSettingsPage /> },
                  { path: '/settings/users', element: <UsersSettingsPage /> },
                  { path: '/settings/roles-permissions', element: <RolesPermissionsPage /> },
                  { path: '/settings/sessions', element: <SessionsSettingsPage /> },
                  { path: '/settings/activity-log', element: <ActivityLogPage /> },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
])
