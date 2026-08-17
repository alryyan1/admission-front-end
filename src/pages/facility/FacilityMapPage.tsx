import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageLoader } from '@/components/common/PageLoader'
import { getFloors, getFloor } from '@/services/facilityService'
import { cn } from '@/lib/utils'
import type { BedStatus } from '@/types/facility'

const BED_STATUS_LABEL: Record<BedStatus, string> = {
  available: 'متاح',
  occupied: 'مشغول',
  maintenance: 'صيانة',
}

const BED_STATUS_CLASSES: Record<BedStatus, string> = {
  available: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  occupied: 'border-destructive/50 bg-destructive/10 text-destructive',
  maintenance: 'border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400',
}

const GENDER_LABEL: Record<string, string> = {
  male: 'رجال',
  female: 'نساء',
  children: 'أطفال',
}

export function FacilityMapPage() {
  const navigate = useNavigate()

  const floorsQuery = useQuery({ queryKey: ['floors'], queryFn: getFloors })

  const floorDetailsQuery = useQuery({
    queryKey: ['floors', 'map', floorsQuery.data?.map((f) => f.id)],
    queryFn: async () => {
      const floors = floorsQuery.data ?? []
      return Promise.all(floors.map((f) => getFloor(f.id)))
    },
    enabled: !!floorsQuery.data && floorsQuery.data.length > 0,
  })

  const floors = floorDetailsQuery.data ?? []

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">خريطة المستشفى</h1>
        <div className="flex items-center gap-3 text-xs">
          {(Object.keys(BED_STATUS_LABEL) as BedStatus[]).map((status) => (
            <div key={status} className="flex items-center gap-1.5">
              <span className={cn('h-3 w-3 rounded-sm border', BED_STATUS_CLASSES[status])} />
              {BED_STATUS_LABEL[status]}
            </div>
          ))}
        </div>
      </div>

      {floorDetailsQuery.isLoading && <PageLoader />}

      {!floorDetailsQuery.isLoading && floors.length === 0 && (
        <p className="text-sm text-muted-foreground">لا يوجد طوابق بعد</p>
      )}

      <div className="flex flex-col gap-6">
        {floors.map((floor) => (
          <Card key={floor.id} className="p-4">
            <h2 className="mb-3 text-base font-semibold">{floor.name}</h2>

            {(floor.wards ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">لا توجد أجنحة في هذا الطابق</p>
            )}

            <div className="flex flex-col gap-4">
              {(floor.wards ?? []).map((ward) => (
                <div key={ward.id} className="rounded-lg border p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <h3 className="text-sm font-semibold">{ward.name}</h3>
                    {ward.gender && <Badge variant="secondary">{GENDER_LABEL[ward.gender] ?? ward.gender}</Badge>}
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {(ward.rooms ?? []).map((room) => (
                      <div key={room.id} className="rounded-md border p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-medium">غرفة {room.room_number}</span>
                          <Badge variant={room.room_type === 'vip' ? 'warning' : 'secondary'}>
                            {room.room_type === 'vip' ? 'VIP' : 'عادية'}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(room.beds ?? []).map((bed) => {
                            const admission = bed.current_admission
                            return (
                              <button
                                key={bed.id}
                                type="button"
                                disabled={!admission}
                                onClick={() => admission && navigate(`/admissions/${admission.id}`)}
                                className={cn(
                                  'flex min-w-24 flex-col items-start gap-0.5 rounded-md border px-2 py-1.5 text-start text-xs transition-colors',
                                  BED_STATUS_CLASSES[bed.status],
                                  admission && 'cursor-pointer hover:brightness-95',
                                )}
                              >
                                <span className="font-semibold">سرير {bed.bed_number}</span>
                                <span>{admission ? admission.patient.name : BED_STATUS_LABEL[bed.status]}</span>
                              </button>
                            )
                          })}
                          {(room.beds ?? []).length === 0 && (
                            <span className="text-xs text-muted-foreground">لا توجد أسرّة</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
