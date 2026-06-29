import { useEffect, useState } from 'react'
import { Users, Stethoscope, Calendar, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getClinicStats } from '@/services/clinic'
import { useRealtime } from '@/hooks/use-realtime'
import pb from '@/lib/pocketbase/client'

export default function ClinicDashboard() {
  const [stats, setStats] = useState({ patients: 0, doctors: 0, apptsToday: 0, pending: 0 })
  const [todayAppts, setTodayAppts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const data = await getClinicStats()
      setStats(data)
      const today = new Date().toISOString().split('T')[0]
      const res = await pb.collection('appointments').getList(1, 10, {
        filter: `dateTime >= "${today} 00:00:00" && dateTime <= "${today} 23:59:59"`,
        sort: 'dateTime',
        expand: 'patient_id,professional_id',
      })
      setTodayAppts(res.items)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('appointments', () => loadData())
  useRealtime('users', () => loadData())

  const metrics = [
    {
      label: 'Total de Pacientes',
      value: stats.patients,
      icon: Users,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Médicos Ativos',
      value: stats.doctors,
      icon: Stethoscope,
      color: 'text-green-600 bg-green-50',
    },
    {
      label: 'Consultas Hoje',
      value: stats.apptsToday,
      icon: Calendar,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      label: 'Agendamentos Pendentes',
      value: stats.pending,
      icon: Clock,
      color: 'text-amber-600 bg-amber-50',
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold">Clínica</h1>
        <p className="text-muted-foreground mt-1">Visão geral das operações da clínica</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{m.label}</p>
                  <p className="text-2xl font-bold mt-1">{loading ? '...' : m.value}</p>
                </div>
                <div className={`p-3 rounded-full ${m.color}`}>
                  <m.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Consultas de Hoje</CardTitle>
        </CardHeader>
        <CardContent>
          {todayAppts.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              Nenhuma consulta agendada para hoje.
            </p>
          ) : (
            <div className="space-y-3">
              {todayAppts.map((a) => (
                <div key={a.id} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{a.expand?.patient_id?.name || 'Paciente'}</p>
                    <p className="text-sm text-muted-foreground">
                      {a.expand?.professional_id?.name || 'Médico'} - {a.type}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {new Date(a.dateTime).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Badge>
                  <Badge
                    variant={
                      a.status === 'scheduled'
                        ? 'secondary'
                        : a.status === 'completed'
                          ? 'default'
                          : 'destructive'
                    }
                  >
                    {a.status === 'scheduled'
                      ? 'Agendado'
                      : a.status === 'completed'
                        ? 'Concluído'
                        : a.status === 'cancelled'
                          ? 'Cancelado'
                          : a.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
