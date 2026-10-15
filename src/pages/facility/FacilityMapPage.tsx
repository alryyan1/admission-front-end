import { ConfigProvider } from 'antd'
import { useAntTheme } from '@/lib/antdTheme'
import { FacilityOccupancyMap } from '@/components/facility/FacilityOccupancyMap'

export function FacilityMapPage() {
  const antTheme = useAntTheme()

  return (
    <ConfigProvider direction="rtl" theme={antTheme}>
      <FacilityOccupancyMap />
    </ConfigProvider>
  )
}
