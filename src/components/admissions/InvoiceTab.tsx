import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { cn, formatDate, formatNumber } from '@/lib/utils'
import type { AdmissionInvoice, Invoice, InvoiceStatus } from '@/types/admission'

interface InvoiceTabProps {
  invoice: AdmissionInvoice | undefined
  isLoading: boolean
  persistedInvoices: Invoice[]
  onGenerateInvoice: () => void
  onMarkPaid: (invoiceId: number) => void
  isGenerating: boolean
}

const statusLabels: Record<InvoiceStatus, string> = {
  draft: 'مسودة',
  issued: 'صادرة',
  paid: 'محصّلة',
  cancelled: 'ملغاة',
}

export function InvoiceTab({
  invoice,
  isLoading,
  persistedInvoices,
  onGenerateInvoice,
  onMarkPaid,
  isGenerating,
}: InvoiceTabProps) {
  if (isLoading || !invoice) {
    return <p>جارٍ تحميل الفاتورة...</p>
  }

  return (
    <div className="flex max-w-xl flex-col gap-4">
      <Card className="p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">فاتورة التنويم — {invoice.patient.name}</h2>
          <Button size="sm" onClick={onGenerateInvoice} disabled={isGenerating}>
            إصدار فاتورة
          </Button>
        </div>

        {invoice.billing_mode === 'short_stay' ? (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">مدة الإقامة القصيرة</span>
            <span>{invoice.admission_duration_hours} ساعة</span>
          </div>
        ) : (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">عدد الليالي</span>
              <span>{invoice.nights_stayed}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">سعر اليوم</span>
              <span>{invoice.price_per_day != null ? formatNumber(invoice.price_per_day) : null}</span>
            </div>
          </>
        )}
        <div className="flex justify-between text-sm font-bold">
          <span>تكلفة الإقامة</span>
          <span>{formatNumber(invoice.bed_charges)}</span>
        </div>

        <Separator className="my-3" />

        <h3 className="mb-2 text-sm font-semibold">الخدمات</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الخدمة</TableHead>
              <TableHead className="text-end">الإجمالي</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoice.requested_services.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  {s.name} × {s.quantity}
                </TableCell>
                <TableCell className="text-end">{formatNumber(s.total_price)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="mt-2 flex justify-between text-sm font-bold">
          <span>إجمالي الخدمات</span>
          <span>{formatNumber(invoice.services_total)}</span>
        </div>

        <Separator className="my-3" />

        <div className="flex justify-between text-lg font-bold">
          <span>الإجمالي الكلي</span>
          <span>{formatNumber(invoice.total)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">الدفعات المسددة</span>
          <span className="text-emerald-600">{formatNumber(invoice.deposits_total)}</span>
        </div>
        <div className="flex justify-between text-sm font-bold">
          <span>المبلغ المتبقي</span>
          <span className={cn(invoice.balance_due > 0 ? 'text-destructive' : 'text-emerald-600')}>
            {formatNumber(invoice.balance_due)}
          </span>
        </div>
      </Card>

      {persistedInvoices.length > 0 && (
        <Card className="p-6">
          <h3 className="mb-2 text-sm font-semibold">الفواتير الصادرة</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الفاتورة</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>الإجمالي</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {persistedInvoices.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>{i.invoice_number}</TableCell>
                  <TableCell>{i.issued_at ? formatDate(i.issued_at) : '—'}</TableCell>
                  <TableCell>{formatNumber(i.total)}</TableCell>
                  <TableCell>
                    <Badge variant={i.status === 'paid' ? 'success' : 'secondary'}>{statusLabels[i.status]}</Badge>
                  </TableCell>
                  <TableCell>
                    {i.status === 'issued' && (
                      <Button size="sm" variant="outline" onClick={() => onMarkPaid(i.id)}>
                        تحصيل
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
