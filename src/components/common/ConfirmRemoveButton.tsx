import { useState } from 'react'
import { Button, IconButton, Popover, Stack, Tooltip, Typography, type ButtonProps } from '@mui/material'
import { CloseOutlined } from '@ant-design/icons'

interface ConfirmRemoveButtonProps {
  label?: string
  confirmLabel?: string
  description?: string
  loading?: boolean
  disabled?: boolean
  variant?: ButtonProps['variant']
  /** Render as a small red cross icon button (tooltip shows `label`) instead of a labeled button. */
  iconOnly?: boolean
  onConfirm: () => void
}

/** MUI delete button that requires a confirming click inside a popover before firing. */
export function ConfirmRemoveButton({
  label = 'إزالة',
  confirmLabel = 'حذف',
  description = 'حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء.',
  loading,
  disabled,
  variant = 'text',
  iconOnly = false,
  onConfirm,
}: ConfirmRemoveButtonProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  return (
    <>
      {iconOnly ? (
        <Tooltip title={label}>
          <span>
            <IconButton
              size="small"
              color="error"
              disabled={disabled || loading}
              onClick={(e) => setAnchorEl(e.currentTarget)}
            >
              <CloseOutlined />
            </IconButton>
          </span>
        </Tooltip>
      ) : (
        <Button
          size="small"
          color="error"
          variant={variant}
          loading={loading}
          disabled={disabled}
          onClick={(e) => setAnchorEl(e.currentTarget)}
        >
          {label}
        </Button>
      )}
      <Popover
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Stack spacing={1} sx={{ p: 1.5, maxWidth: 220 }}>
          <Typography variant="body2">{description}</Typography>
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button size="small" onClick={() => setAnchorEl(null)}>
              تراجع
            </Button>
            <Button
              size="small"
              color="error"
              variant="contained"
              disabled={loading}
              onClick={() => {
                onConfirm()
                setAnchorEl(null)
              }}
            >
              {confirmLabel}
            </Button>
          </Stack>
        </Stack>
      </Popover>
    </>
  )
}
