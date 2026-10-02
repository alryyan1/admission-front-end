import { useRef } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material'
import { PrinterOutlined } from '@ant-design/icons'

interface PdfPreviewModalProps {
  url: string | null
  title: string
  onClose: () => void
}

/** Inline PDF preview with a print action, fed by {@link usePdfPreview}. */
export function PdfPreviewModal({ url, title, onClose }: PdfPreviewModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  return (
    <Dialog open={!!url} onClose={onClose} maxWidth="md" fullWidth keepMounted={false}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        {url && (
          <iframe
            ref={iframeRef}
            src={url}
            title={title}
            style={{ width: '100%', height: 640, border: 'none', display: 'block' }}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>إغلاق</Button>
        <Button
          variant="contained"
          startIcon={<PrinterOutlined />}
          onClick={() => iframeRef.current?.contentWindow?.print()}
        >
          طباعة
        </Button>
      </DialogActions>
    </Dialog>
  )
}
