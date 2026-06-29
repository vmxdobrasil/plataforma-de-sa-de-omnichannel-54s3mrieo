import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus, Clock } from 'lucide-react'
import {
  getAvailabilitySlots,
  createAvailabilitySlot,
  deleteAvailabilitySlot,
} from '@/services/availability'
import { logAudit } from '@/services/clinic'
import { toast } from 'sonner'

const DAYS = [
  { v: '0', l: 'Domingo' },
  { v: '1', l: 'Segunda' },
  { v: '2', l: 'Terça' },
  { v: '3', l: 'Quarta' },
  { v: '4', l: 'Quinta' },
  { v: '5', l: 'Sexta' },
  { v: '6', l: 'Sábado' },
]

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  doctor: any
}

export function DoctorAvailabilityDialog({ open, onOpenChange, doctor }: Props) {
  const [slots, setSlots] = useState<any[]>([])
  const [day, setDay] = useState('1')
  const [start, setStart] = useState('08:00')
  const [end, setEnd] = useState('12:00')
  const [type, setType] = useState('Presencial')
  const [duration, setDuration] = useState('30')

  const load = async () => {
    if (!doctor?.id) return
    try {
      const data = await getAvailabilitySlots(doctor.id)
      setSlots(data)
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    if (open) load()
  }, [open, doctor?.id])

  const handleAdd = async () => {
    try {
      await createAvailabilitySlot({
        professional_id: doctor.id,
        day_of_week: day,
        start_time: start,
        end_time: end,
        slot_type: type,
        slot_duration: parseInt(duration),
      })
      await logAudit('create', 'availability_slots', doctor.id, { day, start, end, type })
      toast.success('Horário adicionado!')
      load()
    } catch (_) {
      toast.error('Erro ao adicionar.')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteAvailabilitySlot(id)
      await logAudit('delete', 'availability_slots', id, {})
      toast.success('Removido.')
      load()
    } catch (_) {
      toast.error('Erro ao remover.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Disponibilidade - {doctor?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3 p-4 border rounded-lg bg-muted/20">
            <div className="space-y-1">
              <Label className="text-xs">Dia</Label>
              <Select value={day} onValueChange={setDay}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => (
                    <SelectItem key={d.v} value={d.v}>
                      {d.l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Duração (min)</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['30', '45', '60'].map((d) => (
                    <SelectItem key={d} value={d}>
                      {d} min
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Início</Label>
              <Input
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fim</Label>
              <Input
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Presencial">Presencial</SelectItem>
                  <SelectItem value="Online">Online</SelectItem>
                  <SelectItem value="Domiciliar">Domiciliar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAdd} className="col-span-2" size="sm">
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          </div>
          <div className="space-y-3">
            {DAYS.map((d) => {
              const ds = slots.filter((s) => s.day_of_week === d.v)
              if (ds.length === 0) return null
              return (
                <div key={d.v}>
                  <h4 className="text-sm font-medium mb-2 border-b pb-1">{d.l}</h4>
                  <div className="space-y-2">
                    {ds.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between border p-2 rounded-lg bg-card"
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {s.start_time} - {s.end_time}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {s.slot_type}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {s.slot_duration || 30}min
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleDelete(s.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            {slots.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">
                Nenhum horário cadastrado.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
