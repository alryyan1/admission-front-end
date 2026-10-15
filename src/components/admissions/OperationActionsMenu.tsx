import { useState } from 'react'
import {
  Box,
  IconButton,
  Badge,
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
import { EditOutlined, TeamOutlined, FileTextOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons'
import { usePdfPreview } from '@/hooks/usePdfPreview'
import { PdfPreviewModal } from '@/components/common/PdfPreviewModal'
import { admissionPdfPaths } from '@/services/admissionService'
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

  const close = () => setAnchorEl(null)
  const hasPrice = operation.price != null
  const priceTooltip = hasPrice ? '' : 'حدّد سعر العملية أولاً'

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={
            <Badge badgeContent={operation.team_members?.length ?? 0} color="primary">
              <TeamOutlined />
            </Badge>
          }
          onClick={(e) => {
            e.stopPropagation()
            onOpenTeam()
          }}
        >
          الفريق الطبي
        </Button>
        <Tooltip title="خيارات أخرى">
          <IconButton
            size="small"
            sx={{ border: '1px solid', borderColor: 'divider' }}
            onClick={(e) => {
              e.stopPropagation()
              setAnchorEl(e.currentTarget)
            }}
          >
            <MoreOutlined />
          </IconButton>
        </Tooltip>
      </Box>
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
