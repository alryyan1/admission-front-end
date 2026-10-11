import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material'
import { EditOutlined, TeamOutlined, FileTextOutlined, WhatsAppOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons'
import { usePdfPreview } from '@/hooks/usePdfPreview'
import { PdfPreviewModal } from '@/components/common/PdfPreviewModal'
import { admissionPdfPaths } from '@/services/admissionService'
import { sendOperationInvoicePdfWhatsApp } from '@/services/whatsappService'
import type { Operation } from '@/types/admission'

interface OperationActionsMenuProps {
  operation: Operation
  readOnly?: boolean
  isDeleting?: boolean
  onEdit: () => void
  onOpenTeam: () => void
  onDelete: () => void
}

/** Row actions for {@link OperationsTab}, collapsed into a single dropdown menu. */
export function OperationActionsMenu({ operation, readOnly = false, isDeleting, onEdit, onOpenTeam, onDelete }: OperationActionsMenuProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
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

  const close = () => setAnchorEl(null)
  const hasPrice = operation.price != null
  const priceTooltip = hasPrice ? '' : 'حدّد سعر العملية أولاً'

  return (
    <>
      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation()
          setAnchorEl(e.currentTarget)
        }}
      >
        <MoreOutlined />
      </IconButton>
      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={close} onClick={(e) => e.stopPropagation()}>
        {!readOnly && (
          <MenuItem
            onClick={() => {
              close()
              onEdit()
            }}
          >
            <ListItemIcon>
              <EditOutlined />
            </ListItemIcon>
            <ListItemText>تعديل</ListItemText>
          </MenuItem>
        )}
        <Tooltip title={priceTooltip} placement="right">
          <span>
            <MenuItem
              disabled={!hasPrice}
              onClick={() => {
                close()
                pdf.open(admissionPdfPaths.operationInvoice(operation.id), 'معاينة فاتورة العملية المبدئية')
              }}
            >
              <ListItemIcon>
                <FileTextOutlined />
              </ListItemIcon>
              <ListItemText>فاتورة</ListItemText>
            </MenuItem>
          </span>
        </Tooltip>
        <Tooltip title={priceTooltip} placement="right">
          <span>
            <MenuItem
              disabled={!hasPrice}
              onClick={() => {
                close()
                sendWhatsAppMutation.mutate()
              }}
            >
              <ListItemIcon>
                <WhatsAppOutlined />
              </ListItemIcon>
              <ListItemText>إرسال الفاتورة عبر واتساب</ListItemText>
            </MenuItem>
          </span>
        </Tooltip>
        <MenuItem
          onClick={() => {
            close()
            onOpenTeam()
          }}
        >
          <ListItemIcon>
            <TeamOutlined />
          </ListItemIcon>
          <ListItemText>الفريق الطبي ({operation.team_members?.length ?? 0})</ListItemText>
        </MenuItem>
        {!readOnly && <Divider />}
        {!readOnly && (
          <MenuItem
            sx={{ color: 'error.main' }}
            onClick={() => {
              close()
              setConfirmDeleteOpen(true)
            }}
          >
            <ListItemIcon sx={{ color: 'error.main' }}>
              <DeleteOutlined />
            </ListItemIcon>
            <ListItemText>حذف</ListItemText>
          </MenuItem>
        )}
      </Menu>

      <PdfPreviewModal url={pdf.url} title={pdf.title} onClose={pdf.close} />

      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
        <DialogTitle>حذف العملية</DialogTitle>
        <DialogContent>
          <DialogContentText>حذف هذه العملية؟ لا يمكن التراجع عن هذا الإجراء.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)}>تراجع</Button>
          <Button
            color="error"
            variant="contained"
            loading={isDeleting}
            onClick={() => {
              onDelete()
              setConfirmDeleteOpen(false)
            }}
          >
            حذف
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
