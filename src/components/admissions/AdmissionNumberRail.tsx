import type { CSSProperties } from 'react'
import { Card, Flex, Tooltip, Typography, theme as antdThemeApi } from 'antd'
import type { GlobalToken } from 'antd/es/theme/interface'
import { CheckCircleFilled, DollarCircleFilled, HeartFilled } from '@ant-design/icons'
import type { Admission, AdmissionStatus } from '@/types/admission'
import { formatNumber } from '@/lib/utils'
import dayjs from 'dayjs'

const { Text } = Typography

interface AdmissionNumberRailProps {
  admissions: Admission[]
  activeId: number | null
  onSelect: (id: number) => void
}

export const ADMISSION_SQUARE_SIZE = 44

const STATUS_LABEL: Record<AdmissionStatus, string> = {
  admitted: 'نشطة',
  discharged: 'مخرّجة',
  cancelled: 'ملغاة',
}

function getStatusColor(token: GlobalToken, status: AdmissionStatus): string {
  const colors: Record<AdmissionStatus, string> = {
    admitted: token.colorSuccess,
    discharged: token.colorInfo,
    cancelled: token.colorError,
  }

  return colors[status]
}

/** Shared look of an admission-number square (rail and admissions table). */
export function getAdmissionSquareStyle(token: GlobalToken, status: AdmissionStatus, isActive = false): CSSProperties {
  const statusColor = getStatusColor(token, status)

  return {
    boxSizing: 'border-box',
    width: ADMISSION_SQUARE_SIZE,
    height: ADMISSION_SQUARE_SIZE,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: token.borderRadiusLG,
    border: `${isActive ? 2 : 1}px solid ${isActive ? token.colorPrimary : statusColor}`,
    background: isActive ? `${statusColor}1a` : token.colorBgContainer,
    color: token.colorText,
    fontWeight: isActive ? 700 : 600,
    fontVariantNumeric: 'tabular-nums',
  }
}

/** Green check when the admission is paid in full, otherwise a dollar badge for an outstanding or credit balance. */
export function AdmissionBalanceBadge({ admission }: { admission: Admission }) {
  const { token } = antdThemeApi.useToken()
  const balanceDue = admission.balance_due ?? 0
  const isPaidInFull = (admission.total_charges ?? 0) > 0 && balanceDue <= 0

  if (isPaidInFull) {
    return (
      <Tooltip title="مدفوع بالكامل">
        <CheckCircleFilled
          style={{
            position: 'absolute',
            top: -5,
            insetInlineEnd: -5,
            fontSize: 14,
            color: token.colorSuccess,
            background: token.colorBgContainer,
            borderRadius: '50%',
          }}
        />
      </Tooltip>
    )
  }

  if (balanceDue === 0) return null

  return (
    <Tooltip title={`الرصيد المستحق: ${formatNumber(balanceDue)}`}>
      <DollarCircleFilled
        style={{
          position: 'absolute',
          top: -5,
          insetInlineEnd: -5,
          fontSize: 14,
          color: balanceDue > 0 ? token.colorError : token.colorSuccess,
          background: token.colorBgContainer,
          borderRadius: '50%',
        }}
      />
    </Tooltip>
  )
}

/** Red heart on the opposite corner of the square when the patient is covered by an insurance company. */
export function AdmissionInsuranceBadge({ admission }: { admission: Admission }) {
  const { token } = antdThemeApi.useToken()
  const insuranceCompanyId = admission.patient?.insurance_company_id
  if (!insuranceCompanyId) return null

  const companyName = admission.patient?.insurance_company?.name
  return (
    <Tooltip title={companyName ? `تأمين: ${companyName}` : 'مريض تأمين'}>
      <HeartFilled
        style={{
          position: 'absolute',
          top: -5,
          insetInlineStart: -5,
          fontSize: 14,
          color: token.colorError,
          background: token.colorBgContainer,
          borderRadius: '50%',
        }}
      />
    </Tooltip>
  )
}

/** Right-column compact rail of admission-number squares on {@link AdmissionsPage}. */
export function AdmissionNumberRail({ admissions, activeId, onSelect }: AdmissionNumberRailProps) {
  const { token } = antdThemeApi.useToken()

  return (
    <Card
      size="small"
      style={{
        width: 96,
        flexShrink: 0,
        position: 'sticky',
        top: 16,
        height: 'calc(100vh - 160px)',
      }}
      styles={{ body: { padding: 8, height: '100%', overflowY: 'auto' } }}
    >
      <Flex vertical gap={6} align="center">
        {admissions.map((admission, index) => {
          const isActive = admission.id === activeId
          const day = dayjs(admission.admission_date)
          const previousDay = index > 0 ? dayjs(admissions[index - 1].admission_date) : null
          const isNewDay = !previousDay || !day.isSame(previousDay, 'day')

          return (
            <div key={admission.id} style={{ width: '100%' }}>
              {isNewDay && (
                <Text
                  type="secondary"
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    fontSize: 11,
                    fontVariantNumeric: 'tabular-nums',
                    margin: index === 0 ? '0 0 4px' : '10px 0 4px',
                  }}
                >
                  {day.format('MM-DD')}
                </Text>
              )}
              <div
                style={{
                  position: 'relative',
                  width: ADMISSION_SQUARE_SIZE,
                  height: ADMISSION_SQUARE_SIZE,
                  margin: '0 auto',
                }}
              >
                <Tooltip
                  placement="left"
                  title={
                    <Flex vertical gap={2}>
                      <Text strong style={{ color: 'inherit' }}>
                        {admission.patient?.name ?? '—'}
                      </Text>
                      <Text style={{ color: 'inherit', opacity: 0.75, fontSize: 12 }}>
                        {STATUS_LABEL[admission.status]}
                      </Text>
                    </Flex>
                  }
                >
                  <button
                    type="button"
                    aria-pressed={isActive}
                    aria-label={`ملف ${admission.admission_number ?? admission.id}`}
                    onClick={() => onSelect(admission.id)}
                    style={{
                      all: 'unset',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s, border-color 0.2s',
                      ...getAdmissionSquareStyle(token, admission.status, isActive),
                    }}
                  >
                    {admission.admission_number ?? '—'}
                  </button>
                </Tooltip>
                <AdmissionBalanceBadge admission={admission} />
                <AdmissionInsuranceBadge admission={admission} />
              </div>
            </div>
          )
        })}
      </Flex>
    </Card>
  )
}
