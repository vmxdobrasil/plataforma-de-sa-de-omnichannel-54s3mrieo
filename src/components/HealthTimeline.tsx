import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, FileText, Pill, Activity, Stethoscope } from 'lucide-react'
import { getPatientAppointments } from '@/services/appointments'
import { getPatientPrescriptions } from '@/services/prescriptions'
import { getRecentDocuments } from '@/services/documents'
import pb from '@/lib/pocketbase/client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useRealtime } from '@/hooks/use-realtime'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function HealthTimeline({ patientId }: { patientId: string }) {
  const [events, setEvents] = useState<any[]>([])
  const [filter, setFilter] = useState('all')

  const loadData = async () => {
    if (!patientId) return
    try {
      const [appts, pxs, docs, records] = await Promise.all([
        getPatientAppointments(patientId),
        getPatientPrescriptions(patientId),
        getRecentDocuments(patientId),
        pb
          .collection('health_records')
          .getFullList({ filter: `patient_id = "${patientId}"`, expand: 'professional_id' }),
      ])

      const timeline: any[] = []

      appts.forEach((a: any) =>
        timeline.push({
          id: `apt_${a.id}`,
          type: 'appointment',
          date: a.dateTime,
          title: `Consulta ${a.type}`,
          description: `Com ${a.expand?.professional_id?.name || 'Profissional'}`,
          icon: Calendar,
          color: 'text-blue-500',
          bg: 'bg-blue-50',
        }),
      )

      pxs.forEach((p: any) =>
        timeline.push({
          id: `px_${p.id}`,
          type: 'prescription',
          date: p.created,
          title: 'Nova Receita Médica',
          description: `Por ${p.expand?.professional_id?.name || 'Profissional'}`,
          icon: Pill,
          color: 'text-purple-500',
          bg: 'bg-purple-50',
        }),
      )

      docs.forEach((d: any) =>
        timeline.push({
          id: `doc_${d.id}`,
          type: 'document',
          date: d.created,
          title: `Documento: ${d.title}`,
          description: d.type === 'exam' ? 'Exame anexado' : 'Documento adicionado',
          icon: FileText,
          color: 'text-amber-500',
          bg: 'bg-amber-50',
        }),
      )

      records.forEach((r: any) =>
        timeline.push({
          id: `rec_${r.id}`,
          type: 'record',
          date: r.created,
          title: 'Prontuário Atualizado',
          description: `Por ${r.expand?.professional_id?.name || 'Profissional'}`,
          icon: Activity,
          color: 'text-emerald-500',
          bg: 'bg-emerald-50',
        }),
      )

      timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setEvents(timeline)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    loadData()
  }, [patientId])

  useRealtime('appointments', () => loadData())
  useRealtime('prescriptions', () => loadData())
  useRealtime('documents', () => loadData())
  useRealtime('health_records', () => loadData())

  const filteredEvents = events.filter((e) => filter === 'all' || e.type === filter)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-primary" /> Linha do Tempo de Saúde
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" value={filter} onValueChange={setFilter} className="mb-6">
          <TabsList className="grid grid-cols-4 w-full h-auto">
            <TabsTrigger value="all" className="text-xs py-2">
              Tudo
            </TabsTrigger>
            <TabsTrigger value="appointment" className="text-xs py-2">
              Consultas
            </TabsTrigger>
            <TabsTrigger value="prescription" className="text-xs py-2">
              Receitas
            </TabsTrigger>
            <TabsTrigger value="document" className="text-xs py-2">
              Exames
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
          {filteredEvents.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              Nenhum evento encontrado.
            </p>
          ) : (
            filteredEvents.map((event) => {
              const Icon = event.icon
              return (
                <div
                  key={event.id}
                  className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                >
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white ${event.bg} ${event.color} shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                      <h4 className="font-bold text-sm text-foreground">{event.title}</h4>
                      <time className="text-[10px] font-medium text-muted-foreground uppercase bg-muted px-2 py-0.5 rounded-full w-fit">
                        {format(new Date(event.date), 'dd MMM yyyy, HH:mm', { locale: ptBR })}
                      </time>
                    </div>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
