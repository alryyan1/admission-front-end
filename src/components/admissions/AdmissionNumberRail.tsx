import { Card, Flex, Tooltip, Typography, theme as antdThemeApi } from 'antd'
import { CheckCircleFilled, DollarCircleFilled } from '@ant-design/icons'
import type { Admission, AdmissionStatus } from '@/types/admission'
import { formatNumber } from '@/lib/utils'
import dayjs from 'dayjs'

const { Text } = Typography

interface AdmissionNumberRailProps {
  admissions: Admission[]
  activeId: number | null
  onSelect: (id: number) => void
}

const SQUARE_SIZE = 44

const STATUS_LABEL: Record<AdmissionStatus, string> = {
  admitted: 'نشطة',
  discharged: 'مخرّجة',
  cancelled: 'ملغاة',
}

/** Right-column compact rail of admission-number squares on {@link AdmissionsPage}. */
export function AdmissionNumberRail({ admissions, activeId, onSelect }: AdmissionNumberRailProps) {
  const { token } = antdThemeApi.useToken()

  const statusColors: Record<AdmissionStatus, string> = {
    admitted: token.colorSuccess,
    discharged: token.colorInfo,
    cancelled: token.colorError,
  }

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
          const statusColor = statusColors[admission.status]
          const balanceDue = admission.balance_due ?? 0
          const isPaidInFull = (admission.total_charges ?? 0) > 0 && balanceDue <= 0
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
                  width: SQUARE_SIZE,
                  height: SQUARE_SIZE,
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
                      <Text
                        style={{
                          color: 'inherit',
                          opacity: 0.75,
                          fontSize: 12,
                        }}
                      >
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
                      boxSizing: 'border-box',
                      cursor: 'pointer',
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: token.borderRadiusLG,
                      border: `${isActive ? 2 : 1}px solid ${isActive ? token.colorPrimary : token.colorBorderSecondary}`,
                      borderInlineStart: `3px solid ${statusColor}`,
                      background: isActive ? `${statusColor}1a` : token.colorBgContainer,
                      color: token.colorText,
                      fontWeight: isActive ? 700 : 600,
                      fontVariantNumeric: 'tabular-nums',
                      transition: 'background-color 0.2s, border-color 0.2s',
                    }}
                  >
                    {admission.admission_number ?? '—'}
                  </button>
                </Tooltip>
                {isPaidInFull && (
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
                )}
                {!isPaidInFull && balanceDue !== 0 && (
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
                )}
              </div>
            </div>
          )
        })}
      </Flex>
    </Card>
  )
}
