import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Popover, Popconfirm, Button, Flex, Typography, Tag, theme as antdThemeApi } from 'antd'
import { BankOutlined, ApartmentOutlined, HomeOutlined, BorderOutlined, EnvironmentOutlined } from '@ant-design/icons'
import { toast } from 'sonner'
import { getRoomTypes } from '@/services/roomTypeService'
import { releaseAdmissionBed } from '@/services/admissionService'
import { getRoomTypeName, getRoomTypeStyle } from '@/lib/roomTypes'
import { AssignBedDialog } from '@/components/admissions/AssignBedDialog'
import type { Bed } from '@/types/facility'

const { Text } = Typography

interface PatientLocationButtonProps {
  bed?: Bed | null
  size?: 'small' | 'middle'
  /** 'compact' shows just the room number with a small icon button that opens the full location popover. */
  variant?: 'button' | 'compact'
  /**
   * Set only for an active admission. With no bed, shows a "تعيين سرير" button that opens the bed picker.
   * With a bed, the location popover offers "إلغاء السرير" to clear it.
   */
  bedAdmissionId?: number
}

export function PatientLocationButton({
  bed,
  size = 'small',
  variant = 'button',
  bedAdmissionId,
}: PatientLocationButtonProps) {
  const { token } = antdThemeApi.useToken()
  const queryClient = useQueryClient()
  const roomTypesQuery = useQuery({ queryKey: ['room-types'], queryFn: getRoomTypes })
  const [assignBedOpen, setAssignBedOpen] = useState(false)

  const releaseMutation = useMutation({
    mutationFn: (admissionId: number) => releaseAdmissionBed(admissionId),
    onSuccess: () => {
      toast.success('تم إلغاء السرير')
      queryClient.invalidateQueries({ queryKey: ['admissions'] })
      queryClient.invalidateQueries({ queryKey: ['floors'] })
    },
  })

  if (!bed && bedAdmissionId !== undefined) {
    return (
      // The dialog is portalled, but React events still bubble through it to the table row, so stop them here.
      <Flex align="center" gap={4} onClick={(e) => e.stopPropagation()}>
        <Button size={size} type="primary" icon={<EnvironmentOutlined />} onClick={() => setAssignBedOpen(true)}>
          تعيين سرير
        </Button>
        {assignBedOpen && (
          <AssignBedDialog open admissionId={bedAdmissionId} onClose={() => setAssignBedOpen(false)} />
        )}
      </Flex>
    )
  }

  const content = (
    // Popover content is portalled too, so stop clicks here from reaching the table row.
    <Flex vertical gap={6} style={{ minWidth: 200 }} onClick={(e) => e.stopPropagation()}>
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
      {bed && bedAdmissionId !== undefined && (
        <Popconfirm
          title="إلغاء السرير؟"
          description="سيصبح السرير متاحاً، ويبقى التنويم بدون سرير."
          okText="نعم، إلغاء"
          cancelText="تراجع"
          onConfirm={() => releaseMutation.mutate(bedAdmissionId)}
        >
          <Button danger size="small" loading={releaseMutation.isPending}>
            إلغاء السرير
          </Button>
        </Popconfirm>
      )}
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
