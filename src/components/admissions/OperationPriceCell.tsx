import { useEffect, useState } from 'react'
import { InputNumber } from 'antd'
import type { Operation } from '@/types/admission'

interface OperationPriceCellProps {
  operation: Operation
  onCommit: (price: number | null) => void
}

/** Inline-editable price cell; commits on blur / Enter when the value changed. */
export function OperationPriceCell({ operation, onCommit }: OperationPriceCellProps) {
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
    <InputNumber
      size="small"
      style={{ width: 120 }}
      min={0}
      step={1000}
      placeholder="السعر"
      value={draft}
      onChange={(v) => setDraft(typeof v === 'number' ? v : null)}
      onBlur={commit}
      onPressEnter={commit}
      onClick={(e) => e.stopPropagation()}
    />
  )
}
