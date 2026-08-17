import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import type { DoctorOrder } from '@/types/admission'

interface OrdersTabProps {
  orders: DoctorOrder[]
  onAddOrder: (payload: { order_text: string; frequency?: string; route?: string }) => void
  onAddDose: (orderId: number, payload: { status?: 'given' | 'missed' | 'refused' }) => void
  isSubmittingOrder: boolean
}

export function OrdersTab({ orders, onAddOrder, onAddDose, isSubmittingOrder }: OrdersTabProps) {
  const [orderText, setOrderText] = useState('')
  const [frequency, setFrequency] = useState('')
  const [route, setRoute] = useState('')

  function handleSubmit() {
    if (!orderText.trim()) return
    onAddOrder({ order_text: orderText, frequency: frequency || undefined, route: route || undefined })
    setOrderText('')
    setFrequency('')
    setRoute('')
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4">
        <h2 className="mb-2 text-sm font-semibold">أمر طبي جديد</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="order-text">الأمر / الدواء</Label>
            <Input
              id="order-text"
              className="h-8 w-56"
              value={orderText}
              onChange={(e) => setOrderText(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="order-frequency">التكرار</Label>
            <Input
              id="order-frequency"
              className="h-8 w-32"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="order-route">طريقة الإعطاء</Label>
            <Input id="order-route" className="h-8 w-32" value={route} onChange={(e) => setRoute(e.target.value)} />
          </div>
          <Button size="sm" onClick={handleSubmit} disabled={isSubmittingOrder}>
            إضافة
          </Button>
        </div>
      </Card>

      <Card>
        <div>
          {orders.map((order, idx) => (
            <div key={order.id}>
              {idx > 0 && <Separator />}
              <div className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="text-sm">{order.order_text}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                    {[order.frequency, order.route].filter(Boolean).join(' · ')}
                    {order.doses && order.doses.length > 0 && (
                      <Badge variant="secondary">{order.doses.length} جرعة مسجّلة</Badge>
                    )}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => onAddDose(order.id, { status: 'given' })}>
                  تسجيل جرعة
                </Button>
              </div>
            </div>
          ))}
          {orders.length === 0 && <p className="p-4 text-sm text-muted-foreground">لا توجد أوامر طبية بعد</p>}
        </div>
      </Card>
    </div>
  )
}
