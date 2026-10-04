import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, Button, Table, Popconfirm, Space, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { getRoomTypes, deleteRoomType } from '@/services/roomTypeService'
import { RoomTypeFormDialog } from '@/components/settings/RoomTypeFormDialog'
import { getRoomTypeStyle } from '@/lib/roomTypes'
import type { RoomType } from '@/types/facility'

export function RoomTypesSettingsTab() {
  const queryClient = useQueryClient()
  const [dialog, setDialog] = useState<{ open: boolean; roomType: RoomType | null }>({ open: false, roomType: null })

  const roomTypesQuery = useQuery({ queryKey: ['room-types'], queryFn: getRoomTypes })

  const deleteMutation = useMutation({
    mutationFn: deleteRoomType,
    onSuccess: () => {
      toast.success('تم حذف نوع الغرفة')
      queryClient.invalidateQueries({ queryKey: ['room-types'] })
    },
  })

  const columns: ColumnsType<RoomType> = [
    {
      title: 'نوع الغرفة',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, roomType) => (
        <Tag color={getRoomTypeStyle(roomType.code).tagColor}>{name}</Tag>
      ),
    },
    {
      title: '',
      key: 'actions',
      render: (_, roomType) => (
        <Space size={4}>
          <Button size="small" onClick={() => setDialog({ open: true, roomType })}>
            تعديل
          </Button>
          <Popconfirm
            title="حذف نوع الغرفة؟"
            description="لا يمكن حذف النوع إذا كان مستخدماً في غرف."
            onConfirm={() => deleteMutation.mutate(roomType.id)}
          >
            <Button size="small" danger>
              حذف
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Card
      title="أنواع الغرف"
      extra={
        <Button type="primary" onClick={() => setDialog({ open: true, roomType: null })}>
          + نوع غرفة جديد
        </Button>
      }
    >
      <Table
        rowKey="id"
        loading={roomTypesQuery.isLoading}
        columns={columns}
        dataSource={roomTypesQuery.data ?? []}
        pagination={false}
      />

      {dialog.open && (
        <RoomTypeFormDialog
          open={dialog.open}
          onOpenChange={(open) => setDialog((s) => ({ ...s, open }))}
          roomType={dialog.roomType}
        />
      )}
    </Card>
  )
}
