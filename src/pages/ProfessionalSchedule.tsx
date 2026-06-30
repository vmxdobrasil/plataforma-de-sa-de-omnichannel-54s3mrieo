import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/hooks/use-auth'
import {
  getAvailabilitySlots,
  createAvailabilitySlot,
  deleteAvailabilitySlot,
} from '@/services/availability'
import { getProfessionalAppointments } from '@/services/appointments'
import { useRealtime } from '@/hooks/use-realtime'
import { Calendar, Clock, Trash2, Plus, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import pb from '@/lib/pocketbase/client'

const DAYS = [
  { value: '0', label: 'Domingo' },
  { value: '1', label: 'Segunda-feira' },
  { value: '2', label: 'Terça-feira' },
  { value: '3', label: 'Quarta-feira' },
  { value: '4', label: 'Quinta-feira' },
  { value: '5', label: 'Sexta-feira' },
  { value: '6', label: 'Sábado' },
]

export default function ProfessionalSchedule() {
  const { user } = useAuth()
  const [slots, setSlots] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])

  const [day, setDay] = useState('1')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('12:00')
  const [type, setType] = useState('Presencial')

  const loadSlots = async () => {
    if (!user?.id) return
    try {
      const data = await getAvailabilitySlots(user.id)
      setSlots(data)
    } catch (e) {
      console.error(e)
    }
  }

  const loadAppointments = async () => {
    if (!user?.id) return
    try {
      const data = await getProfessionalAppointments(user.id)

      if (data.length > 0) {
        const apptIds = data.map((a: any) => `appointment_id="${a.id}"`).join(' || ')
        try {
          const txs = await pb.collection('benefit_transactions').getFullList({
            filter: apptIds,
          })
          const enriched = data.map((app: any) => {
            const appTxs = txs.filter((t) => t.appointment_id === app.id)
            const paidWithCorporate = appTxs.some(
              (t) =>
                t.description.includes('Benefício Corporativo') ||
                t.description.includes('Parte Corporativa') ||
                t.description.includes('Desconto em Folha'),
            )
            return { ...app, paidWithCorporate }
          })
          setAppointments(enriched)
          return
        } catch (err) {
          console.error(err)
        }
      }
      setAppointments(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadSlots()
    loadAppointments()
  }, [user?.id])

  useRealtime('appointments', () => {
    loadAppointments()
  })

  const handleAddSlot = async () => {
    if (!user?.id) return
    try {
      await createAvailabilitySlot({
        professional_id: user.id,
        day_of_week: day,
        start_time: startTime,
        end_time: endTime,
        slot_type: type,
      })
      toast.success('Horário adicionado com sucesso!')
      loadSlots()
    } catch (e) {
      toast.error('Erro ao adicionar horário.')
    }
  }

  const handleDeleteSlot = async (id: string) => {
    try {
      await deleteAvailabilitySlot(id)
      toast.success('Horário removido.')
      loadSlots()
    } catch (e) {
      toast.error('Erro ao remover horário.')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary" /> Minha Agenda
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie sua disponibilidade para agendamentos.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Adicionar Horário</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Dia da Semana</label>
              <Select value={day} onValueChange={setDay}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Início</label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Fim</label>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Atendimento</label>
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
            <Button className="w-full mt-4" onClick={handleAddSlot}>
              <Plus className="h-4 w-4 mr-2" /> Adicionar
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Horários Disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {DAYS.map((d) => {
                const daySlots = slots.filter((s) => s.day_of_week === d.value)
                if (daySlots.length === 0) return null

                return (
                  <div key={d.value}>
                    <h3 className="font-semibold text-sm mb-3 border-b pb-1">{d.label}</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {daySlots.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between border p-3 rounded-lg bg-muted/20"
                        >
                          <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">
                                {s.start_time} - {s.end_time}
                              </p>
                              <Badge variant="outline" className="text-[10px] mt-1">
                                {s.slot_type}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteSlot(s.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
              {slots.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">
                  Nenhum horário cadastrado.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" /> Agendamentos Confirmados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum agendamento confirmado.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {appointments.map((app) => {
                const isCorporate = !!app.expand?.patient_id?.company_id
                const typeBorder =
                  app.type === 'Presencial'
                    ? 'border-l-4 border-l-emerald-600'
                    : app.type === 'Online'
                      ? 'border-l-4 border-l-blue-500'
                      : 'border-l-4 border-l-orange-500'
                const typeBadgeClass =
                  app.type === 'Presencial'
                    ? 'border-emerald-600 text-emerald-600'
                    : app.type === 'Online'
                      ? 'border-blue-500 text-blue-500'
                      : 'border-orange-500 text-orange-500'
                return (
                  <div
                    key={app.id}
                    className={`border p-4 rounded-2xl flex flex-col gap-3 bg-card hover:shadow-md hover:scale-[1.02] transition-all ${typeBorder}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">
                          {app.expand?.patient_id?.name || 'Paciente'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(app.dateTime).toLocaleString([], {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </p>
                      </div>
                      <Badge
                        variant={isCorporate ? 'default' : 'secondary'}
                        className={isCorporate ? 'bg-primary hover:bg-primary/90' : ''}
                      >
                        {isCorporate ? 'Corporativo' : 'Particular'}
                      </Badge>
                    </div>
                    <div className="text-sm flex gap-2 flex-wrap">
                      <Badge variant="outline" className={typeBadgeClass}>
                        {app.type}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={
                          app.status === 'scheduled'
                            ? 'text-blue-600 border-blue-200 bg-blue-50'
                            : ''
                        }
                      >
                        {app.status === 'scheduled' ? 'Agendado' : app.status}
                      </Badge>
                      {app.paidWithCorporate && (
                        <Badge
                          variant="secondary"
                          className="bg-emerald-50 text-emerald-700 border-emerald-200"
                        >
                          Pago via Saldo Corporativo
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
