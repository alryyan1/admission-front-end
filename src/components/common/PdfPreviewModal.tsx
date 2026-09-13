import { useRef } from 'react'
import { Button, Modal } from 'antd'
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
    <Modal
      open={!!url}
      onCancel={onClose}
      width={860}
      title={title}
      destroyOnHidden
      footer={[
        <Button key="close" onClick={onClose}>
          إغلاق
        </Button>,
        <Button
          key="print"
          type="primary"
          icon={<PrinterOutlined />}
          onClick={() => iframeRef.current?.contentWindow?.print()}
        >
          طباعة
        </Button>,
      ]}
    >
      {url && (
        <iframe
          ref={iframeRef}
          src={url}
          title={title}
          style={{ width: '100%', height: 640, border: 'none' }}
        />
      )}
    </Modal>
  )
}
