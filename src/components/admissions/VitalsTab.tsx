import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/utils'
import type { VitalSign } from '@/types/admission'

interface VitalsTabProps {
  vitals: VitalSign[]
  onAdd: (payload: Partial<VitalSign>) => void
  isSubmitting: boolean
}

export function VitalsTab({ vitals, onAdd, isSubmitting }: VitalsTabProps) {
  const [temperature, setTemperature] = useState('')
  const [pulse, setPulse] = useState('')
  const [respirationRate, setRespirationRate] = useState('')
  const [bloodPressure, setBloodPressure] = useState('')
  const [oxygenSaturation, setOxygenSaturation] = useState('')

  function handleSubmit() {
    onAdd({
      temperature: temperature || undefined,
      pulse: pulse ? Number(pulse) : undefined,
      respiration_rate: respirationRate ? Number(respirationRate) : undefined,
      blood_pressure: bloodPressure || undefined,
      oxygen_saturation: oxygenSaturation ? Number(oxygenSaturation) : undefined,
    })
    setTemperature('')
    setPulse('')
    setRespirationRate('')
    setBloodPressure('')
    setOxygenSaturation('')
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4">
        <h2 className="mb-2 text-sm font-semibold">تسجيل علامة حيوية جديدة</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="temperature">الحرارة (°C)</Label>
            <Input
              id="temperature"
              className="h-8 w-28"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="pulse">النبض</Label>
            <Input id="pulse" className="h-8 w-24" value={pulse} onChange={(e) => setPulse(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="respiration">التنفس</Label>
            <Input
              id="respiration"
              className="h-8 w-24"
              value={respirationRate}
              onChange={(e) => setRespirationRate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="bp">ضغط الدم</Label>
            <Input
              id="bp"
              className="h-8 w-28"
              placeholder="120/80"
              value={bloodPressure}
              onChange={(e) => setBloodPressure(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="o2">تشبع الأكسجين %</Label>
            <Input
              id="o2"
              className="h-8 w-28"
              value={oxygenSaturation}
              onChange={(e) => setOxygenSaturation(e.target.value)}
            />
          </div>
          <Button size="sm" onClick={handleSubmit} disabled={isSubmitting}>
            إضافة
          </Button>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الوقت</TableHead>
              <TableHead>الحرارة</TableHead>
              <TableHead>النبض</TableHead>
              <TableHead>التنفس</TableHead>
              <TableHead>ضغط الدم</TableHead>
              <TableHead>الأكسجين</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vitals.map((v) => (
              <TableRow key={v.id}>
                <TableCell>{formatDateTime(v.recorded_at)}</TableCell>
                <TableCell>{v.temperature ?? '—'}</TableCell>
                <TableCell>{v.pulse ?? '—'}</TableCell>
                <TableCell>{v.respiration_rate ?? '—'}</TableCell>
                <TableCell>{v.blood_pressure ?? '—'}</TableCell>
                <TableCell>{v.oxygen_saturation ?? '—'}</TableCell>
              </TableRow>
            ))}
            {vitals.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <p className="text-center text-sm text-muted-foreground">لا توجد تسجيلات بعد</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
