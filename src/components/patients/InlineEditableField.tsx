import { useEffect, useState } from 'react'
import { MenuItem, TextField } from '@mui/material'

type FieldValue = string | number | null

interface InlineEditableFieldProps {
  value: FieldValue
  displayValue?: React.ReactNode
  onSave: (value: FieldValue) => Promise<void>
  editable: boolean
  type?: 'text' | 'number' | 'textarea' | 'select'
  options?: { label: string; value: string }[]
}

export function InlineEditableField({
  value,
  displayValue,
  onSave,
  editable,
  type = 'text',
  options,
}: InlineEditableFieldProps) {
  const [draft, setDraft] = useState<FieldValue>(value)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setDraft(value)
  }, [value])

  if (!editable) {
    return <>{displayValue ?? value ?? '—'}</>
  }

  const cancel = () => {
    setDraft(value)
  }

  const commit = async () => {
    const normalized = draft === '' ? null : draft
    if (normalized === value) {
      return
    }
    setSaving(true)
    try {
      await onSave(normalized)
    } catch {
      // keep draft for retry on failure
    } finally {
      setSaving(false)
    }
  }

  if (type === 'select') {
    return (
      <TextField
        select
        fullWidth
        size="small"
        value={draft ?? ''}
        disabled={saving}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        sx={{ minWidth: 140 }}
      >
        {options?.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
    )
  }

  if (type === 'number') {
    return (
      <TextField
        type="number"
        fullWidth
        size="small"
        disabled={saving}
        value={draft ?? ''}
        onChange={(e) => setDraft(e.target.value === '' ? null : Number(e.target.value))}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') cancel()
        }}
        slotProps={{ htmlInput: { min: 0 } }}
        sx={{ minWidth: 100 }}
      />
    )
  }

  if (type === 'textarea') {
    return (
      <TextField
        multiline
        fullWidth
        minRows={1}
        maxRows={4}
        size="small"
        disabled={saving}
        value={(draft as string) ?? ''}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Escape') cancel()
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            commit()
          }
        }}
        sx={{ minWidth: 200 }}
      />
    )
  }

  return (
    <TextField
      fullWidth
      size="small"
      disabled={saving}
      value={(draft as string) ?? ''}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit()
        if (e.key === 'Escape') cancel()
      }}
      sx={{ minWidth: 140 }}
    />
  )
}
