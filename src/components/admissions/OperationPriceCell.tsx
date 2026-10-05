import { useEffect, useState } from 'react'
import { TextField } from '@mui/material'
import type { Operation } from '@/types/admission'

interface OperationPriceCellProps {
  operation: Operation
  onCommit: (price: number | null) => void
  disabled?: boolean
}

/** Inline-editable price cell; commits on blur / Enter when the value changed. */
export function OperationPriceCell({ operation, onCommit, disabled = false }: OperationPriceCellProps) {
  const toNumber = (value: string | null) => (value != null ? Number(value) : null)
  const [draft, setDraft] = useState<number | null>(toNumber(operation.price))

  useEffect(() => {
    setDraft(toNumber(operation.price))
  }, [operation.price])

  function commit() {
    if (draft === toNumber(operation.price)) return
    onCommit(draft)
  }

  return (
    <TextField
      className="amount-input"
      type="number"
      size="small"
      disabled={disabled}
      placeholder="السعر"
      value={draft ?? ''}
      onChange={(e) => setDraft(e.target.value === '' ? null : Number(e.target.value))}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit()
      }}
      onClick={(e) => e.stopPropagation()}
      slotProps={{ htmlInput: { min: 0, step: 1000 } }}
      sx={{ width: 120 }}
    />
  )
}
