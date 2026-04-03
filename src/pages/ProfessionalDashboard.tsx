import { useEffect, useState } from 'react'
import {
  Users,
  DollarSign,
  Calendar as CalIcon,
  TrendingUp,
  Video,
  FileText,
  Upload,
  Plus,
  CheckCircle2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/hooks/use-auth'
import { getProfessionalAppointments, updateAppointmentStatus } from '@/services/appointments'
import { createPrescription } from '@/services/prescriptions'
import { getTreatmentPlans, updateTreatmentPlanStatus } from '@/services/treatment_plans'
import { createHealthRecord } from '@/services/health_records'
import { useRealtime } from '@/hooks/use-realtime'
import { format } from 'date-fns'
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'

const templates = [
  {
    id: '1',
    name: 'Consulta de Rotina',
    content:
      'Paciente apresenta estado geral bom. Queixas principais: nenhuma. Exame físico normal.',
  },
  {
    id: '2',
    name: 'Acompanhamento Crônico',
    content:
      'Paciente em acompanhamento. Pressão arterial: ___/___ mmHg. Medicamentos em uso: ___. Evolução: ___.',
  },
]

export default function ProfessionalDashboard() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<any[]>([])
  const [treatmentPlans, setTreatmentPlans] = useState<any[]>([])

  const [activeAppt, setActiveAppt] = useState<any>(null)
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [notes, setNotes] = useState('')
  const [meds, setMeds] = useState('')
  const [insts, setInsts] = useState('')

  const loadData = async () => {
    if (!user?.id) return
    try {
      const appts = await getProfessionalAppointments(user.id)
      const validAppts = appts.filter(
        (a) => new Date(a.dateTime).getTime() >= Date.now() - 86400000,
      )
      setAppointments(validAppts)
      if (!activeAppt && validAppts.length > 0) {
        setActiveAppt(validAppts[0])
      }
    } catch (e) {
      console.error(e)
    }
  }

  const loadPlans = async (patientId: string) => {
    try {
      const plans = await getTreatmentPlans(patientId)
      setTreatmentPlans(plans)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [user?.id])
  useEffect(() => {
    if (activeAppt?.patient_id) loadPlans(activeAppt.patient_id)
  }, [activeAppt])

  useRealtime('appointments', () => loadData())
  useRealtime('treatment_plans', () => {
    if (activeAppt) loadPlans(activeAppt.patient_id)
  })

  useEffect(() => {
    if (selectedTemplate) {
      const t = templates.find((x) => x.id === selectedTemplate)
      if (t) setNotes(t.content)
    }
  }, [selectedTemplate])

  const handleStartConsultation = async (appt: any) => {
    setActiveAppt(appt)
  }

  const handleSaveNotes = async () => {
    if (!activeAppt?.patient_id || !user?.id || !notes) return
    try {
      await createHealthRecord({
        patient_id: activeAppt.patient_id,
        professional_id: user.id,
        content: notes,
        type: 'clinical',
      })
      await updateAppointmentStatus(activeAppt.id, 'completed')
      toast.success('Prontuário salvo e consulta finalizada.')
      setNotes('')
    } catch (e) {
      toast.error('Erro ao salvar prontuário.')
    }
  }

  const handleCreatePrescription = async () => {
    if (!activeAppt?.patient_id || !user?.id || !meds) return
    try {
      await createPrescription({
        patient_id: activeAppt.patient_id,
        professional_id: user.id,
        medications: meds,
        pharmacy_instructions: insts,
      })
      toast.success('Receita criada com sucesso.')
      setMeds('')
      setInsts('')
    } catch (e) {
      toast.error('Erro ao criar receita.')
    }
  }

  const handleCompletePlan = async (id: string) => {
    try {
      await updateTreatmentPlanStatus(id, 'completed')
      toast.success('Plano concluído! Pontos de fidelidade atribuídos ao paciente.')
    } catch (e) {
      toast.error('Erro ao concluir plano.')
    }
  }

  const todayAppts = appointments.filter((a) => {
    const d = new Date(a.dateTime)
    const today = new Date()
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Clínico</h1>
          <p className="text-muted-foreground mt-1">Bem-vindo, {user?.name}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Hoje</p>
              <h3 className="text-2xl font-bold">{todayAppts.length}</h3>
            </div>
            <div className="p-3 bg-primary/10 rounded-full text-primary">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Aguardando</p>
              <h3 className="text-2xl font-bold">
                {appointments.filter((a) => a.status === 'checked_in').length}
              </h3>
            </div>
            <div className="p-3 bg-amber-100 rounded-full text-amber-600">
              <CalIcon className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div
        className="grid lg:grid-cols-3 gap-6 animate-fade-in-up"
        style={{ animationDelay: '0.1s' }}
      >
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Agenda</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="divide-y max-h-[500px] overflow-y-auto">
              {appointments.map((apt) => (
                <div
                  key={apt.id}
                  onClick={() => handleStartConsultation(apt)}
                  className={`p-4 flex flex-col gap-2 hover:bg-muted/50 transition-colors cursor-pointer ${activeAppt?.id === apt.id ? 'bg-muted/80 border-l-4 border-primary' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center font-medium w-12 text-sm">
                      {format(new Date(apt.dateTime), 'HH:mm')}
                    </div>
                    <Avatar className="h-10 w-10 border">
                      <AvatarImage
                        src={
                          apt.expand?.patient_id?.avatar
                            ? pb.files.getURL(
                                { id: apt.expand?.patient_id?.id, collectionId: 'users' },
                                apt.expand?.patient_id?.avatar,
                              )
                            : `https://api.dicebear.com/7.x/notionists/svg?seed=${apt.expand?.patient_id?.name}`
                        }
                      />
                      <AvatarFallback>{apt.expand?.patient_id?.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <p className="font-semibold text-sm truncate">
                        {apt.expand?.patient_id?.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{apt.type}</p>
                    </div>
                  </div>
                  {apt.status === 'checked_in' && (
                    <Badge
                      variant="secondary"
                      className="bg-amber-100 text-amber-700 self-end w-fit text-[10px]"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Check-in Feito
                    </Badge>
                  )}
                  {apt.status === 'completed' && (
                    <Badge
                      variant="outline"
                      className="self-end w-fit text-[10px] text-muted-foreground"
                    >
                      Finalizado
                    </Badge>
                  )}
                </div>
              ))}
              {appointments.length === 0 && (
                <p className="p-4 text-center text-sm text-muted-foreground">
                  Nenhuma consulta agendada.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 flex flex-col h-[600px]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
            <div>
              <CardTitle className="text-lg">Prontuário (V MED EHR)</CardTitle>
              <p className="text-sm text-muted-foreground">
                Paciente:{' '}
                {activeAppt ? activeAppt.expand?.patient_id?.name : 'Selecione um paciente'}
              </p>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-4">
            {activeAppt ? (
              <Tabs defaultValue="notes" className="w-full h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="notes">Evolução</TabsTrigger>
                  <TabsTrigger value="prescriptions">Receitas</TabsTrigger>
                  <TabsTrigger value="plans">Planos (Gamificação)</TabsTrigger>
                </TabsList>

                <TabsContent value="notes" className="space-y-4 flex-1 flex flex-col">
                  <div className="space-y-2">
                    <Label>Template Rápido</Label>
                    <Select onValueChange={setSelectedTemplate} value={selectedTemplate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Digite a evolução clínica..."
                    className="flex-1 min-h-[200px] resize-none border-primary/20 focus-visible:ring-primary/30"
                  />
                  <div className="flex justify-end gap-2 pt-2">
                    <Button onClick={handleSaveNotes} disabled={!notes.trim()}>
                      Assinar e Finalizar Consulta
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="prescriptions" className="space-y-4">
                  <div className="space-y-4 bg-muted/20 p-4 rounded-xl border">
                    <h3 className="font-medium">Nova Prescrição</h3>
                    <div className="space-y-2">
                      <Label>Medicamentos</Label>
                      <Input
                        placeholder="Ex: Rosuvastatina 10mg - 1x ao dia"
                        value={meds}
                        onChange={(e) => setMeds(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Instruções para Farmácia (Opcional)</Label>
                      <Input
                        placeholder="Ex: Fornecer medicamento genérico"
                        value={insts}
                        onChange={(e) => setInsts(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={handleCreatePrescription}
                      disabled={!meds.trim()}
                      className="w-full"
                    >
                      Emitir Receita Digital
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="plans" className="space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground">
                    Planos de Tratamento Ativos
                  </h3>
                  {treatmentPlans.map((tp) => (
                    <div
                      key={tp.id}
                      className="border p-4 rounded-lg flex justify-between items-center bg-card"
                    >
                      <div>
                        <p className="font-semibold">{tp.title}</p>
                        <p className="text-sm text-muted-foreground">{tp.description}</p>
                      </div>
                      {tp.status === 'active' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                          onClick={() => handleCompletePlan(tp.id)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" /> Concluir (Dar Pontos)
                        </Button>
                      ) : (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                          Concluído
                        </Badge>
                      )}
                    </div>
                  ))}
                  {treatmentPlans.length === 0 && (
                    <p className="text-sm text-muted-foreground">Nenhum plano ativo.</p>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <FileText className="h-12 w-12 mb-4 opacity-20" />
                <p>Selecione uma consulta na agenda para abrir o prontuário.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
