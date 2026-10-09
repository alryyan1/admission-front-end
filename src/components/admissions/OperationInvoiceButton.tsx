import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button, Tooltip } from '@mui/material'
import { FileTextOutlined, WhatsAppOutlined } from '@ant-design/icons'
import { usePdfPreview } from '@/hooks/usePdfPreview'
import { PdfPreviewModal } from '@/components/common/PdfPreviewModal'
import { admissionPdfPaths } from '@/services/admissionService'
import { sendOperationInvoicePdfWhatsApp } from '@/services/whatsappService'
import type { Operation } from '@/types/admission'

interface OperationInvoiceButtonProps {
  operation: Operation
  size?: 'small' | 'medium'
}

/** Prints or WhatsApps a preliminary invoice for a single operation (its price only). */
export function OperationInvoiceButton({ operation, size = 'small' }: OperationInvoiceButtonProps) {
  const pdf = usePdfPreview()

  const sendWhatsAppMutation = useMutation({
    mutationFn: () => sendOperationInvoicePdfWhatsApp(operation.id),
    onSuccess: ({ sent, message }) => {
      if (sent) {
        toast.success(message)
      } else {
        toast.warning(message)
      }
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'تعذر إرسال الفاتورة عبر واتساب'
      toast.error(message)
    },
  })

  return (
    <>
      <Tooltip title={operation.price == null ? 'حدّد سعر العملية أولاً' : ''}>
        <span>
          <Button
            size={size}
            variant="outlined"
            startIcon={<FileTextOutlined />}
            loading={pdf.isLoading()}
            disabled={operation.price == null}
            onClick={(e) => {
              e.stopPropagation()
              pdf.open(admissionPdfPaths.operationInvoice(operation.id), 'معاينة فاتورة العملية المبدئية')
            }}
          >
            فاتورة
          </Button>
        </span>
      </Tooltip>

      <Tooltip title={operation.price == null ? 'حدّد سعر العملية أولاً' : 'إرسال الفاتورة للمريض عبر واتساب'}>
        <span>
          <Button
            size={size}
            variant="outlined"
            startIcon={<WhatsAppOutlined />}
            loading={sendWhatsAppMutation.isPending}
            disabled={operation.price == null}
            onClick={(e) => {
              e.stopPropagation()
              sendWhatsAppMutation.mutate()
            }}
          >
            واتساب
          </Button>
        </span>
      </Tooltip>

      <PdfPreviewModal url={pdf.url} title={pdf.title} onClose={pdf.close} />
    </>
  )
}
