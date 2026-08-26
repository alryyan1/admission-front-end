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
      <Select
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
