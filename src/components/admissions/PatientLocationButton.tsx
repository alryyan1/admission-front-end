import { useQuery } from '@tanstack/react-query'
import { Popover, Button, Flex, Typography, Tag, theme as antdThemeApi } from 'antd'
import { BankOutlined, ApartmentOutlined, HomeOutlined, BorderOutlined, EnvironmentOutlined } from '@ant-design/icons'
import { getRoomTypes } from '@/services/roomTypeService'
import { getRoomTypeName, getRoomTypeStyle } from '@/lib/roomTypes'
import type { Bed } from '@/types/facility'

const { Text } = Typography

interface PatientLocationButtonProps {
  bed?: Bed | null
  size?: 'small' | 'middle'
  /** 'compact' shows just the room number with a small icon button that opens the full location popover. */
  variant?: 'button' | 'compact'
}

export function PatientLocationButton({ bed, size = 'small', variant = 'button' }: PatientLocationButtonProps) {
  const { token } = antdThemeApi.useToken()
  const roomTypesQuery = useQuery({ queryKey: ['room-types'], queryFn: getRoomTypes })

  const content = (
    <Flex vertical gap={6} style={{ minWidth: 200 }}>
      <Flex align="center" gap={6}>
        <BankOutlined style={{ color: token.colorPrimary }} />
        <Text style={{ fontSize: 13, fontWeight: 600 }}>{bed?.room?.ward?.floor?.name ?? '—'}</Text>
      </Flex>
      <Flex align="center" gap={6}>
        <ApartmentOutlined style={{ color: token.colorPrimary }} />
        <Text style={{ fontSize: 13, fontWeight: 600 }}>{bed?.room?.ward?.name ?? '—'}</Text>
      </Flex>
      <Flex align="center" gap={6} wrap="wrap">
        <HomeOutlined style={{ color: token.colorPrimary }} />
        <Text style={{ fontSize: 13, fontWeight: 600 }}>غرفة {bed?.room?.room_number ?? '—'}</Text>
        {bed?.room?.room_type && (
          <Tag color={getRoomTypeStyle(bed.room.room_type).tagColor} style={{ marginInlineEnd: 0 }}>
            {getRoomTypeName(roomTypesQuery.data, bed.room.room_type)}
          </Tag>
        )}
      </Flex>
      <Flex align="center" gap={6}>
        <BorderOutlined style={{ color: token.colorPrimary }} />
        <Text style={{ fontSize: 13, fontWeight: 600 }}>سرير {bed?.bed_number ?? '—'}</Text>
      </Flex>
    </Flex>
  )

  if (variant === 'compact') {
    return (
      <Flex align="center" gap={4}>
        <Text style={{ fontWeight: 600 }}>{bed?.room?.room_number ?? '—'}</Text>
        <Popover content={content} title="الموقع" trigger="click" placement="bottomLeft">
          <Button
            size="small"
            type="text"
            icon={<EnvironmentOutlined />}
            onClick={(e) => e.stopPropagation()}
          />
        </Popover>
      </Flex>
    )
  }

  return (
    <Popover content={content} title="الموقع" trigger="click" placement="bottomLeft">
      <Button size={size} icon={<EnvironmentOutlined />} onClick={(e) => e.stopPropagation()}>
        الموقع
      </Button>
    </Popover>
  )
}
