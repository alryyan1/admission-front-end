import { useEffect, useState } from 'react'
import { Input, InputNumber, Select } from 'antd'

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
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<FieldValue>(value)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setDraft(value)
  }, [value])

  if (!editable) {
    return <>{displayValue ?? value ?? '—'}</>
  }

  if (!editing) {
    return (
      <span
        onClick={() => setEditing(true)}
        style={{ cursor: 'pointer', borderBottom: '1px dashed #999' }}
      >
        {displayValue ?? value ?? '—'}
      </span>
    )
  }

  const cancel = () => {
    setDraft(value)
    setEditing(false)
  }

  const commit = async () => {
    const normalized = draft === '' ? null : draft
    if (normalized === value) {
      setEditing(false)
      return
    }
    setSaving(true)
    try {
      await onSave(normalized)
      setEditing(false)
    } catch {
      // keep field open for retry on failure
    } finally {
      setSaving(false)
    }
  }

  if (type === 'select') {
    return (
      <Select
        autoFocus
        defaultOpen
        value={draft ?? undefined}
        options={options}
        disabled={saving}
        onChange={(v) => setDraft(v)}
        onBlur={commit}
        style={{ minWidth: 140 }}
        size="small"
      />
    )
  }

  if (type === 'number') {
    return (
      <InputNumber
        autoFocus
        size="small"
        min={0}
        disabled={saving}
        value={draft as number | null}
        onChange={(v) => setDraft(v)}
        onBlur={commit}
        onPressEnter={commit}
        onKeyDown={(e) => {
          if (e.key === 'Escape') cancel()
        }}
        style={{ minWidth: 100 }}
      />
    )
  }

  if (type === 'textarea') {
    return (
      <Input.TextArea
        autoFocus
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
        autoSize={{ minRows: 1, maxRows: 4 }}
        style={{ minWidth: 200 }}
      />
    )
  }

  return (
    <Input
      autoFocus
      size="small"
      disabled={saving}
      value={(draft as string) ?? ''}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onPressEnter={commit}
      onKeyDown={(e) => {
        if (e.key === 'Escape') cancel()
      }}
      style={{ minWidth: 140 }}
    />
  )
}
