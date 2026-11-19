import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { pdf } from '@react-pdf/renderer'
import {
  ConfigProvider,
  Card,
  Typography,
  Flex,
  Space,
  Button,
  Table,
  Select,
  AutoComplete,
  Input,
  InputNumber,
  Modal,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, DeleteOutlined, PrinterOutlined } from '@ant-design/icons'
import { useAntTheme } from '@/lib/antdTheme'
import { formatNumber } from '@/lib/utils'
import { getServices } from '@/services/serviceService'
import { getProcedures } from '@/services/procedureService'
import { useFacilityPdfAssets } from '@/hooks/useFacilityPdfAssets'
import {
  PreliminaryInvoicePdfDocument,
  type PreliminaryInvoiceLineItem,
} from '@/components/billing/PreliminaryInvoicePdfDocument'

const { Title, Text } = Typography

export function PreliminaryInvoicePage() {
  const antTheme = useAntTheme()
  const { assets: pdfAssets } = useFacilityPdfAssets()

  const [patientName, setPatientName] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<PreliminaryInvoiceLineItem[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [procedureSearch, setProcedureSearch] = useState('')

  const servicesQuery = useQuery({
    queryKey: ['services', { active_only: true }],
    queryFn: () => getServices({ active_only: true }),
  })

  const proceduresQuery = useQuery({
    queryKey: ['procedures', { active_only: true }],
    queryFn: () => getProcedures({ active_only: true }),
  })

  function addServiceItem(serviceId: number) {
    const service = (servicesQuery.data ?? []).find((s) => s.id === serviceId)
    if (!service) return
    setItems((prev) => [
      ...prev,
      {
        key: `svc-${service.id}-${Date.now()}`,
        name: service.name_ar,
        unitPrice: Number(service.price),
        quantity: 1,
      },
    ])
  }

  function addProcedureItem(procedureId: number) {
    const procedure = (proceduresQuery.data ?? []).find((p) => p.id === procedureId)
    if (!procedure) return
    setItems((prev) => [
      ...prev,
      {
        key: `proc-${procedure.id}-${Date.now()}`,
        name: procedure.name_ar,
        unitPrice: procedure.base_price != null ? Number(procedure.base_price) : 0,
        quantity: 1,
      },
    ])
    setProcedureSearch('')
  }

  function addBlankItem() {
    setItems((prev) => [...prev, { key: `manual-${Date.now()}`, name: '', unitPrice: 0, quantity: 1 }])
  }

  function updateItem(key: string, patch: Partial<PreliminaryInvoiceLineItem>) {
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, ...patch } : item)))
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((item) => item.key !== key))
  }

  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)

  async function handlePreview() {
    if (items.length === 0) {
      toast.error('أضف بندًا واحدًا على الأقل')
      return
    }
    setIsGenerating(true)
    try {
      const blob = await pdf(
        <PreliminaryInvoicePdfDocument assets={pdfAssets} patientName={patientName} notes={notes} items={items} total={total} />,
      ).toBlob()
      setPreviewUrl(URL.createObjectURL(blob))
    } catch {
      toast.error('تعذر إنشاء ملف PDF')
    } finally {
      setIsGenerating(false)
    }
  }

  function handleClosePreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
  }

  const columns: ColumnsType<PreliminaryInvoiceLineItem> = [
    {
      title: 'البند',
      dataIndex: 'name',
      render: (_, item) => (
        <Input
          value={item.name}
          placeholder="اسم الخدمة أو البند"
          onChange={(e) => {
            updateItem(item.key, { name: e.target.value })
          }}
        />
      ),
    },
    {
      title: 'السعر',
      width: 140,
      render: (_, item) => (
        <InputNumber
          style={{ width: '100%' }}
          min={0}
          value={item.unitPrice}
          onChange={(value) => {
            updateItem(item.key, { unitPrice: value ?? 0 })
          }}
        />
      ),
    },
    {
      title: 'الكمية',
      width: 100,
      render: (_, item) => (
        <InputNumber
          style={{ width: '100%' }}
          min={1}
          value={item.quantity}
          onChange={(value) => {
            updateItem(item.key, { quantity: value ?? 1 })
          }}
        />
      ),
    },
    {
      title: 'الإجمالي',
      width: 120,
      render: (_, item) => formatNumber(item.unitPrice * item.quantity),
    },
    {
      title: '',
      width: 50,
      render: (_, item) => (
        <Button
          danger
          type="text"
          icon={<DeleteOutlined />}
          onClick={() => {
            removeItem(item.key)
          }}
        />
      ),
    },
  ]

  return (
    <ConfigProvider direction="rtl" theme={antTheme}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={12} style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          فاتورة مبدئية
        </Title>
        <Text type="secondary">حساب وطباعة فاتورة مبدئية فقط — لا يتم حفظ أي بيانات في النظام</Text>
      </Flex>

      <Card style={{ marginBottom: 16 }}>
        <Flex wrap="wrap" gap={12}>
          <Space direction="vertical" size={4} style={{ minWidth: 220 }}>
            <Text style={{ fontSize: 12 }} type="secondary">
              اسم المريض (اختياري)
            </Text>
            <Input value={patientName} onChange={(e) => setPatientName(e.target.value)} />
          </Space>
          <Space direction="vertical" size={4} style={{ minWidth: 280, flex: 1 }}>
            <Text style={{ fontSize: 12 }} type="secondary">
              ملاحظات (اختياري)
            </Text>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Space>
        </Flex>
      </Card>

      <Card
        style={{ marginBottom: 16 }}
        title="البنود"
        extra={
          <Space>
            <Select
              style={{ width: 260 }}
              placeholder="إضافة خدمة من الكتالوج"
              showSearch
              optionFilterProp="label"
              loading={servicesQuery.isLoading}
              value={null}
              onSelect={(value: number) => addServiceItem(value)}
              options={(servicesQuery.data ?? []).map((s) => ({
                label: `${s.name_ar} (${formatNumber(s.price)})`,
                value: s.id,
              }))}
            />
            <AutoComplete
              style={{ width: 260 }}
              placeholder="إضافة إجراء من الكتالوج"
              value={procedureSearch}
              onSearch={setProcedureSearch}
              onSelect={(value: string) => addProcedureItem(Number(value))}
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              options={(proceduresQuery.data ?? []).map((p) => ({
                label: `${p.name_ar}${p.base_price != null ? ` (${formatNumber(p.base_price)})` : ''}`,
                value: String(p.id),
              }))}
            />
            <Button icon={<PlusOutlined />} onClick={addBlankItem}>
              بند يدوي
            </Button>
          </Space>
        }
      >
        <Table
          size="small"
          rowKey="key"
          columns={columns}
          dataSource={items}
          pagination={false}
          locale={{ emptyText: 'لا توجد بنود مضافة بعد' }}
          summary={() =>
            items.length > 0 ? (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={3}>
                    <Text strong>الإجمالي الكلي</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <Text strong>{formatNumber(total)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} />
                </Table.Summary.Row>
              </Table.Summary>
            ) : null
          }
        />
      </Card>

      <Flex justify="flex-end">
        <Button type="primary" icon={<PrinterOutlined />} loading={isGenerating} onClick={handlePreview}>
          معاينة وطباعة
        </Button>
      </Flex>

      <Modal
        open={!!previewUrl}
        onCancel={handleClosePreview}
        width={860}
        title="معاينة الفاتورة المبدئية"
        footer={[
          <Button key="close" onClick={handleClosePreview}>
            إغلاق
          </Button>,
          <Button
            key="print"
            type="primary"
            icon={<PrinterOutlined />}
            onClick={() => {
              const iframe = document.getElementById('preliminary-invoice-preview') as HTMLIFrameElement | null
              iframe?.contentWindow?.print()
            }}
          >
            طباعة
          </Button>,
        ]}
      >
        {previewUrl && (
          <iframe
            id="preliminary-invoice-preview"
            src={previewUrl}
            title="معاينة الفاتورة المبدئية"
            style={{ width: '100%', height: 640, border: 'none' }}
          />
        )}
      </Modal>
    </ConfigProvider>
  )
}
