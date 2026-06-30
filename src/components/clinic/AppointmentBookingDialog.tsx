import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Clock } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { getAvailabilitySlots, checkDoubleBooking, logAudit } from '@/services/clinic'
import { createAppointment } from '@/services/appointments'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  onSuccess: () => void
}

export function AppointmentBookingDialog({ open, onOpenChange, onSuccess }: Props) {
  const [patients, setPatients] = useState<any[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  const [patientId, setPatientId] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [date, setDate] = useState('')
  const [type, setType] = useState('Presencial')
  const [classification, setClassification] = useState('first_visit')
  const [slots, setSlots] = useState<string[]>([])
  const [selectedTime, setSelectedTime] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      pb.collection('users')
        .getFullList({
          filter: 'role = "patient" && registration_status = "approved"',
          sort: 'name',
        })
        .then(setPatients)
        .catch(() => {})
      pb.collection('users')
        .getFullList({
          filter: 'role = "professional" && professional_status = "active"',
          sort: 'name',
        })
        .then(setDoctors)
        .catch(() => {})
    }
  }, [open])

  useEffect(() => {
    if (!doctorId || !date) return
    const dayOfWeek = new Date(date + 'T00:00:00').getDay().toString()
    Promise.all([
      getAvailabilitySlots(doctorId),
      pb.collection('appointments').getFullList({
        filter: `professional_id = "${doctorId}" && dateTime >= "${date} 00:00:00" && dateTime <= "${date} 23:59:59" && status != "cancelled"`,
      }),
    ])
      .then(([allSlots, booked]) => {
        const daySlots = allSlots.filter(
          (s: any) => s.day_of_week === dayOfWeek && s.slot_type === type,
        )
        const bookedTimes = booked.map((b: any) => {
          const d = new Date(b.dateTime)
          return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
        })
        const generated: string[] = []
        daySlots.forEach((s: any) => {
          const [sh, sm] = s.start_time.split(':').map(Number)
          const [eh, em] = s.end_time.split(':').map(Number)
          const dur = s.slot_duration || 30
          let cur = sh * 60 + sm
          const end = eh * 60 + em
          while (cur + dur <= end) {
            const h = Math.floor(cur / 60)
              .toString()
              .padStart(2, '0')
            const m = (cur % 60).toString().padStart(2, '0')
            const ts = `${h}:${m}`
            if (!bookedTimes.includes(ts)) generated.push(ts)
            cur += dur
          }
        })
        setSlots(generated)
        setSelectedTime('')
      })
      .catch(() => {
        setSlots([])
      })
  }, [doctorId, date, type])

  const handleSubmit = async () => {
    if (!patientId || !doctorId || !date || !selectedTime) {
      toast.error('Preencha todos os campos.')
      return
    }
    const [h, m] = selectedTime.split(':')
    const dt = new Date(date + 'T00:00:00')
    dt.setHours(parseInt(h), parseInt(m), 0, 0)
    const isoStr = dt.toISOString()
    if (await checkDoubleBooking(doctorId, isoStr)) {
      toast.error('Já existe um agendamento neste horário.')
      return
    }
    setLoading(true)
    try {
      const appt = await createAppointment({
        patient_id: patientId,
        professional_id: doctorId,
        dateTime: isoStr,
        type,
        status: 'scheduled',
        notes,
      })
      await pb.collection('appointments').update(appt.id, { classification })
      await logAudit('create', 'appointments', appt.id, { patientId, doctorId, classification })
      toast.success('Agendamento criado!')
      onOpenChange(false)
      onSuccess()
    } catch (e: any) {
      toast.error('Erro ao criar agendamento.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Agendamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Paciente *</Label>
            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Médico *</Label>
            <Select value={doctorId} onValueChange={setDoctorId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name} - {d.specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Data *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Presencial">Presencial</SelectItem>
                  <SelectItem value="Online">Online</SelectItem>
                  <SelectItem value="Domiciliar">Domiciliar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Classificação *</Label>
            <Select value={classification} onValueChange={setClassification}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="first_visit">Primeira Consulta</SelectItem>
                <SelectItem value="follow_up">Retorno</SelectItem>
                <SelectItem value="emergency">Emergência</SelectItem>
                <SelectItem value="telemedicine">Telemedicina</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {date && doctorId && (
            <div className="space-y-2">
              <Label>Horários Disponíveis *</Label>
              {slots.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {slots.map((t) => (
                    <Button
                      key={t}
                      variant={selectedTime === t ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedTime(t)}
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      {t}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhum horário disponível para esta data/tipo.
                </p>
              )}
            </div>
          )}
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Agendando...' : 'Confirmar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
