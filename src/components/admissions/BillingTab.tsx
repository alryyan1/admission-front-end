import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { formatDate, formatNumber } from '@/lib/utils'
import type { AdmissionDeposit, RequestedService } from '@/types/admission'

interface BillingTabProps {
  services: RequestedService[]
  deposits: AdmissionDeposit[]
  onAddService: (payload: { name: string; quantity?: number; unit_price: number }) => void
  onAddDeposit: (payload: { amount: number; method?: string }) => void
  isSubmittingService: boolean
  isSubmittingDeposit: boolean
}

export function BillingTab({
  services,
  deposits,
  onAddService,
  onAddDeposit,
  isSubmittingService,
  isSubmittingDeposit,
}: BillingTabProps) {
  const [serviceName, setServiceName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unitPrice, setUnitPrice] = useState('')

  const [depositAmount, setDepositAmount] = useState('')
  const [depositMethod, setDepositMethod] = useState('cash')

  function handleAddService() {
    if (!serviceName.trim() || !unitPrice) return
    onAddService({ name: serviceName, quantity: Number(quantity) || 1, unit_price: Number(unitPrice) })
    setServiceName('')
    setQuantity('1')
    setUnitPrice('')
  }

  function handleAddDeposit() {
    if (!depositAmount) return
    onAddDeposit({ amount: Number(depositAmount), method: depositMethod })
    setDepositAmount('')
  }

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 md:col-span-6">
        <Card className="p-4">
          <h2 className="mb-2 text-sm font-semibold">الخدمات المطلوبة</h2>
          <div className="mb-3 flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor="service-name">اسم الخدمة</Label>
              <Input
                id="service-name"
                className="h-8 w-40"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="service-qty">الكمية</Label>
              <Input
                id="service-qty"
                type="number"
                className="h-8 w-20"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="service-price">سعر الوحدة</Label>
              <Input
                id="service-price"
                type="number"
                className="h-8 w-28"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
              />
            </div>
            <Button size="sm" onClick={handleAddService} disabled={isSubmittingService}>
              إضافة
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الخدمة</TableHead>
                <TableHead>الكمية</TableHead>
                <TableHead>الإجمالي</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.quantity}</TableCell>
                  <TableCell>{formatNumber(s.total_price)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <div className="col-span-12 md:col-span-6">
        <Card className="p-4">
          <h2 className="mb-2 text-sm font-semibold">الدفعات</h2>
          <div className="mb-3 flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor="deposit-amount">المبلغ</Label>
              <Input
                id="deposit-amount"
                type="number"
                className="h-8 w-28"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>طريقة الدفع</Label>
              <Select value={depositMethod} onValueChange={setDepositMethod}>
                <SelectTrigger className="h-8 w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">نقدي</SelectItem>
                  <SelectItem value="card">بطاقة</SelectItem>
                  <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" onClick={handleAddDeposit} disabled={isSubmittingDeposit}>
              إضافة
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>التاريخ</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>الطريقة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deposits.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{formatDate(d.paid_at)}</TableCell>
                  <TableCell>{formatNumber(d.amount)}</TableCell>
                  <TableCell>{d.method}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  )
}
