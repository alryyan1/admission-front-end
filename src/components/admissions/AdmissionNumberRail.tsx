import { Card, Divider, Flex, Tooltip, theme as antdThemeApi } from 'antd'
import { DollarCircleFilled } from '@ant-design/icons'
import type { Admission, AdmissionStatus } from '@/types/admission'
import { formatNumber } from '@/lib/utils'
import dayjs from 'dayjs'

interface AdmissionNumberRailProps {
  admissions: Admission[]
  activeId: number | null
  onSelect: (id: number) => void
}

const ACTIVE_BORDER_COLOR = '#38bdf8'

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
      style={{ width: 96, flexShrink: 0, position: 'sticky', top: 16, height: 'calc(100vh - 160px)' }}
      styles={{ body: { padding: 8, height: '100%', overflowY: 'auto' } }}
    >
      <Flex vertical gap={8} align="center">
        {admissions.map((admission, index) => {
          const isActive = admission.id === activeId
          const statusColor = statusColors[admission.status]
          const balanceDue = admission.balance_due ?? 0
          const day = dayjs(admission.admission_date)
          const previousDay = index > 0 ? dayjs(admissions[index - 1].admission_date) : null
          const isNewDay = !previousDay || !day.isSame(previousDay, 'day')

          return (
            <div key={admission.id} style={{ width: '100%' }}>
              {isNewDay && (
                <Divider style={{ margin: '4px 0', fontSize: 11 }} plain>
                  {day.format('MM-DD')}
                </Divider>
              )}
              <div style={{ position: 'relative', width: 44, height: 44, margin: '0 auto' }}>
                <Tooltip title={admission.patient?.name} placement="left">
                  <div
                    onClick={() => onSelect(admission.id)}
                    style={{
                      cursor: 'pointer',
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `1px solid ${statusColor}`,
                      borderRadius: 8,
                      fontWeight: 600,
                      background: isActive ? statusColor : 'transparent',
                      color: isActive ? '#fff' : statusColor,
                      boxShadow: isActive ? `0 0 0 2px ${ACTIVE_BORDER_COLOR}` : undefined,
                      transition: 'background-color 0.2s, border-color 0.2s, color 0.2s, box-shadow 0.2s',
                    }}
                  >
                    {admission.admission_number ?? '—'}
                  </div>
                </Tooltip>
                {balanceDue !== 0 && (
                  <Tooltip title={`الرصيد المستحق: ${formatNumber(balanceDue)}`}>
                    <DollarCircleFilled
                      style={{
                        position: 'absolute',
                        top: -4,
                        insetInlineEnd: -4,
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
