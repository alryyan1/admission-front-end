import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ConfigProvider, Card, Table, Typography, Button, Popconfirm, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DatabaseBackup, Download, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAntTheme } from '@/lib/antdTheme'
import { getBackups, createBackup, downloadBackupBlob, deleteBackup } from '@/services/backupService'
import type { BackupFile } from '@/services/backupService'
import { formatDateTime } from '@/lib/utils'

const { Title, Text } = Typography

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} بايت`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} ك.ب`
  return `${(bytes / (1024 * 1024)).toFixed(1)} م.ب`
}

export function BackupPage() {
  const antTheme = useAntTheme()
  const queryClient = useQueryClient()
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null)

  const backupsQuery = useQuery({ queryKey: ['backups'], queryFn: getBackups })

  const createMutation = useMutation({
    mutationFn: createBackup,
    onSuccess: () => {
      toast.success('تم إنشاء نسخة احتياطية جديدة')
      queryClient.invalidateQueries({ queryKey: ['backups'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteBackup,
    onSuccess: () => {
      toast.success('تم حذف النسخة الاحتياطية')
      queryClient.invalidateQueries({ queryKey: ['backups'] })
    },
  })

  async function handleDownload(filename: string) {
    setDownloadingFile(filename)
    try {
      const blob = await downloadBackupBlob(filename)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('تعذر تنزيل النسخة الاحتياطية')
    } finally {
      setDownloadingFile(null)
    }
  }

  const columns: ColumnsType<BackupFile> = [
    {
      title: 'اسم الملف',
      dataIndex: 'filename',
      key: 'filename',
    },
    {
      title: 'الحجم',
      dataIndex: 'size',
      key: 'size',
      width: 120,
      render: (size: number) => formatFileSize(size),
    },
    {
      title: 'تاريخ الإنشاء',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (v: string) => formatDateTime(v),
    },
    {
      title: '',
      key: 'actions',
      width: 140,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<Download size={14} />}
            loading={downloadingFile === record.filename}
            onClick={() => handleDownload(record.filename)}
          >
            تنزيل
          </Button>
          <Popconfirm
            title="حذف النسخة الاحتياطية"
            description="هل أنت متأكد من حذف هذه النسخة؟ لا يمكن التراجع عن هذا الإجراء."
            okText="حذف"
            cancelText="إلغاء"
            okButtonProps={{ danger: true }}
            onConfirm={() => deleteMutation.mutate(record.filename)}
          >
            <Button size="small" danger icon={<Trash2 size={14} />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <ConfigProvider direction="rtl" theme={antTheme}>
      <Title level={3} style={{ margin: '0 0 16px' }}>
        النسخ الاحتياطي
      </Title>

      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <Text>
            يقوم النظام بإنشاء نسخة احتياطية من قاعدة البيانات فقط، ويمكن تنزيلها أو حذفها في أي وقت.
          </Text>
          <Button
            type="primary"
            icon={<DatabaseBackup size={16} />}
            loading={createMutation.isPending}
            onClick={() => createMutation.mutate()}
            style={{ marginTop: 8 }}
          >
            إنشاء نسخة احتياطية جديدة
          </Button>
        </Space>
      </Card>

      <Card>
        <Table
          rowKey="filename"
          loading={backupsQuery.isLoading}
          columns={columns}
          dataSource={backupsQuery.data ?? []}
          pagination={false}
          locale={{ emptyText: 'لا توجد نسخ احتياطية' }}
        />
      </Card>
    </ConfigProvider>
  )
}
