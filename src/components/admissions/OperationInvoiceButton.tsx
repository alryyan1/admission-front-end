import { Button, Tooltip } from '@mui/material'
import { FileTextOutlined } from '@ant-design/icons'
import { usePdfPreview } from '@/hooks/usePdfPreview'
import { PdfPreviewModal } from '@/components/common/PdfPreviewModal'
import { admissionPdfPaths } from '@/services/admissionService'
import type { Operation } from '@/types/admission'

interface OperationInvoiceButtonProps {
  operation: Operation
  size?: 'small' | 'medium'
}

/** Prints a preliminary invoice for a single operation (its price only). */
export function OperationInvoiceButton({ operation, size = 'small' }: OperationInvoiceButtonProps) {
  const pdf = usePdfPreview()

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

      <PdfPreviewModal url={pdf.url} title={pdf.title} onClose={pdf.close} />
    </>
  )
}
