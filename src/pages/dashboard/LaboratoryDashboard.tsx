import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { TestTube, FileText, Calendar, Download, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function LaboratoryDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [documents, setDocuments] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && user.role !== 'laboratory') {
      navigate('/forbidden')
    }
  }, [user, navigate])

  const loadData = useCallback(async () => {
    if (!user?.id) return
    try {
      const [docs, appts] = await Promise.all([
        pb.collection('documents').getFullList({
          filter: `professional_id = "${user.id}" && type = "exam"`,
          sort: '-created',
          expand: 'patient_id',
        }),
        pb.collection('appointments').getFullList({
          filter: `professional_id = "${user.id}" && status = "scheduled"`,
          sort: 'dateTime',
          expand: 'patient_id',
        }),
      ])
      setDocuments(docs)
      setAppointments(appts)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime('documents', () => loadData())
  useRealtime('appointments', () => loadData())

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <TestTube className="h-8 w-8 text-emerald-600" /> Portal do Laboratório
        </h1>
        <p className="text-muted-foreground mt-1">Gerencie exames e agendamentos.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-emerald-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Exames Realizados</p>
              <p className="text-2xl font-bold text-emerald-700">{documents.length}</p>
            </div>
            <FileText className="h-8 w-8 text-emerald-600" />
          </CardContent>
        </Card>
        <Card className="border-emerald-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Agendamentos Pendentes</p>
              <p className="text-2xl font-bold text-emerald-700">{appointments.length}</p>
            </div>
            <Calendar className="h-8 w-8 text-emerald-600" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agendamentos Pendentes</CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Nenhum agendamento pendente.</p>
          ) : (
            <div className="space-y-2">
              {appointments.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="font-medium">{a.expand?.patient_id?.name || 'Paciente'}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(a.dateTime), "dd 'de' MMMM, yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                    {a.type}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documentos de Exames</CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Nenhum exame registrado.</p>
          ) : (
            <div className="space-y-2">
              {documents.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="font-medium">{d.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.expand?.patient_id?.name || 'Paciente'} •{' '}
                        {format(new Date(d.created), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={pb.files.getURL(d, d.file)} target="_blank" rel="noreferrer" download>
                      <Download className="h-4 w-4 mr-1" /> Baixar
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
