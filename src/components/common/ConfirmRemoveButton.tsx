import { useState } from 'react'
import { Button, Popover, Stack, Typography } from '@mui/material'

interface ConfirmRemoveButtonProps {
  label?: string
  confirmLabel?: string
  description?: string
  loading?: boolean
  disabled?: boolean
  onConfirm: () => void
}

/** MUI delete button that requires a confirming click inside a popover before firing. */
export function ConfirmRemoveButton({
  label = 'إزالة',
  confirmLabel = 'حذف',
  description = 'حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء.',
  loading,
  disabled,
  onConfirm,
}: ConfirmRemoveButtonProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  return (
    <>
      <Button size="small" color="error" loading={loading} disabled={disabled} onClick={(e) => setAnchorEl(e.currentTarget)}>
        {label}
      </Button>
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
