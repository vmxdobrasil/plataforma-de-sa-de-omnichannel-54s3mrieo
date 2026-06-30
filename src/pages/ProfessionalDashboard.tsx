import { useEffect, useState, useMemo } from 'react'
import {
  Users,
  Calendar as CalIcon,
  FileText,
  CheckCircle2,
  Video,
  RefreshCcw,
  Loader2,
  Download,
  AlertCircle,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { SOSCard } from '@/components/SOSCard'
import { useAuth } from '@/hooks/use-auth'
import { getProfessionalAppointments, updateAppointmentStatus } from '@/services/appointments'
import { createPrescription } from '@/services/prescriptions'
import { getTreatmentPlans, updateTreatmentPlanStatus } from '@/services/treatment_plans'
import { createHealthRecord } from '@/services/health_records'
import { uploadDocument } from '@/services/documents'
import { getBrandKit, getSubscriptions } from '@/services/ecosystem'
import { getGeneratedContent } from '@/services/social_ai'
import { useRealtime } from '@/hooks/use-realtime'
import { format } from 'date-fns'
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { AddToCalendar } from '@/components/AddToCalendar'
import { useNavigate } from 'react-router-dom'

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
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState<any[]>([])
  const [treatmentPlans, setTreatmentPlans] = useState<any[]>([])
  const [patientGoals, setPatientGoals] = useState<any[]>([])
  const [adherenceFilter, setAdherenceFilter] = useState<'all' | 'risk' | 'track'>('all')

  const [activeAppt, setActiveAppt] = useState<any>(null)
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [notes, setNotes] = useState('')
  const [meds, setMeds] = useState('')
  const [insts, setInsts] = useState('')

  // External Labs States
  const [externalLabs, setExternalLabs] = useState<any[]>([])
  const [loadingLabs, setLoadingLabs] = useState(false)
  const [syncingLab, setSyncingLab] = useState<string | null>(null)

  const [brandKit, setBrandKit] = useState<any>(null)
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [recentContent, setRecentContent] = useState<any[]>([])

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

  const loadGoals = async () => {
    try {
      const goals = await pb.collection('health_goals').getFullList()
      setPatientGoals(goals)
    } catch (e) {
      console.error(e)
    }
  }

  const loadBusinessData = async () => {
    if (!user?.id) return
    try {
      const [bk, subs, content] = await Promise.all([
        getBrandKit(user.id),
        getSubscriptions(user.id),
        getGeneratedContent(),
      ])
      setBrandKit(bk)
      setSubscriptions(subs.filter((s: any) => s.status === 'active'))
      setRecentContent(content.slice(0, 3))
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
    loadGoals()
    loadBusinessData()
  }, [user?.id])

  useEffect(() => {
    if (activeAppt?.patient_id) {
      loadPlans(activeAppt.patient_id)
      setExternalLabs([]) // Reset labs when switching patients
    }
  }, [activeAppt])

  useRealtime('appointments', () => loadData())
  useRealtime('health_goals', () => loadGoals())
  useRealtime('treatment_plans', () => {
    if (activeAppt) loadPlans(activeAppt.patient_id)
  })
  useRealtime('brand_kits', () => loadBusinessData())
  useRealtime('subscriptions', () => loadBusinessData())
  useRealtime('generated_content', () => loadBusinessData())

  useEffect(() => {
    if (selectedTemplate) {
      const t = templates.find((x) => x.id === selectedTemplate)
      if (t) setNotes(t.content)
    }
  }, [selectedTemplate])

  const adherenceData = useMemo(() => {
    const uniquePatients = new Map()
    appointments.forEach((a) => {
      if (a.expand?.patient_id) {
        uniquePatients.set(a.expand.patient_id.id, a.expand.patient_id)
      }
    })

    return Array.from(uniquePatients.values())
      .map((p) => {
        const pGoals = patientGoals.filter((g) => g.patient_id === p.id)
        const total = pGoals.length
        const completed = pGoals.filter((g) => g.status === 'completed').length
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
        return { patient: p, total, completed, percentage }
      })
      .filter((data) => {
        if (adherenceFilter === 'risk') return data.percentage < 50
        if (adherenceFilter === 'track') return data.percentage >= 50
        return true
      })
  }, [appointments, patientGoals, adherenceFilter])

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

  const fetchExternalLabs = async () => {
    if (!activeAppt?.expand?.patient_id?.id || !user?.id) return
    setLoadingLabs(true)
    try {
      const res = await pb.send(`/backend/v1/external-labs/${activeAppt.expand.patient_id.id}`, {
        method: 'GET',
      })
      setExternalLabs(res.labs || [])
      toast.success('Exames sincronizados com sucesso.')
    } catch (e: any) {
      if (e.status === 403) {
        toast.error('Paciente não autorizou a sincronização.')
      } else if (e.status === 400) {
        toast.error(e.message || 'Dados incompletos para sincronização.')
      } else {
        toast.error('Erro ao buscar exames externos.')
      }
    } finally {
      setLoadingLabs(false)
    }
  }

  const handleImportLab = async (lab: any) => {
    if (!activeAppt?.expand?.patient_id?.id || !user?.id) return
    setSyncingLab(lab.id)
    try {
      const formData = new FormData()
      const blob = new Blob([lab.content], { type: 'text/plain' })
      formData.append('file', blob, `${lab.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`)
      formData.append('title', lab.title)
      formData.append('type', 'exam')
      formData.append('patient_id', activeAppt.expand.patient_id.id)
      formData.append('professional_id', user.id)
      if (activeAppt.id) formData.append('appointment_id', activeAppt.id)
      formData.append(
        'notes',
        `Importado automaticamente de: ${lab.laboratory}\nData do Exame: ${lab.date}`,
      )

      await uploadDocument(formData)
      toast.success('Exame importado para os Documentos do paciente.')
    } catch (e) {
      toast.error('Erro ao importar exame.')
    } finally {
      setSyncingLab(null)
    }
  }

  const renderExternalLabs = () => {
    if (!user?.crm_number || !user?.crm_state) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>CRM não cadastrado</AlertTitle>
          <AlertDescription>
            Você precisa cadastrar seu CRM nas Configurações para sincronizar exames de redes
            parceiras.
          </AlertDescription>
        </Alert>
      )
    }
    if (!activeAppt?.expand?.patient_id?.allow_external_sync) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Sincronização não autorizada</AlertTitle>
          <AlertDescription>
            O paciente não autorizou a sincronização de exames externos em suas configurações de
            privacidade.
          </AlertDescription>
        </Alert>
      )
    }
    if (!activeAppt?.expand?.patient_id?.document_id) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>CPF Inválido</AlertTitle>
          <AlertDescription>
            O paciente precisa ter um CPF/Documento cadastrado no perfil para que a busca em
            laboratórios parceiros funcione.
          </AlertDescription>
        </Alert>
      )
    }

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-muted/30 p-4 rounded-lg border gap-4">
          <div>
            <h3 className="font-medium">Portal de Integração de Laboratórios</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Busque resultados de exames realizados por {activeAppt.expand.patient_id.name} em
              redes parceiras.
            </p>
          </div>
          <Button onClick={fetchExternalLabs} disabled={loadingLabs} className="w-full sm:w-auto">
            {loadingLabs ? (
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
            ) : (
              <RefreshCcw className="mr-2 h-4 w-4" />
            )}
            Sincronizar
          </Button>
        </div>

        {externalLabs.length > 0 && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
            {externalLabs.map((lab) => (
              <div
                key={lab.id}
                className="border p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between bg-card gap-4"
              >
                <div>
                  <p className="font-semibold text-sm sm:text-base">{lab.title}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {lab.laboratory} • {lab.date}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleImportLab(lab)}
                  disabled={syncingLab === lab.id}
                  className="w-full sm:w-auto"
                >
                  {syncingLab === lab.id ? (
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Importar Documento
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
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
        <Button onClick={() => (window.location.href = '/professional/schedule')} variant="outline">
          <CalIcon className="mr-2 h-4 w-4" /> Gerenciar Agenda
        </Button>
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

      <Tabs defaultValue="agenda" className="w-full">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="agenda">Agenda & Prontuário</TabsTrigger>
          <TabsTrigger value="adherence">Adesão de Pacientes</TabsTrigger>
          <TabsTrigger value="business">Negócios & Marketing</TabsTrigger>
        </TabsList>

        <TabsContent value="agenda" className="m-0">
          <div
            className="grid lg:grid-cols-3 gap-6 animate-fade-in-up"
            style={{ animationDelay: '0.1s' }}
          >
            <Card className="lg:col-span-1 flex flex-col max-h-[700px]">
              <CardHeader>
                <CardTitle className="text-lg">Agenda</CardTitle>
              </CardHeader>
              <CardContent className="px-0 flex-1 overflow-y-auto">
                <div className="divide-y">
                  {appointments.map((apt) => {
                    const typeColor =
                      apt.type === 'Presencial'
                        ? 'border-emerald-600'
                        : apt.type === 'Online'
                          ? 'border-blue-500'
                          : 'border-orange-500'
                    const typeTextColor =
                      apt.type === 'Presencial'
                        ? 'text-emerald-600'
                        : apt.type === 'Online'
                          ? 'text-blue-500'
                          : 'text-orange-500'
                    return (
                      <div
                        key={apt.id}
                        onClick={() => handleStartConsultation(apt)}
                        className={`p-4 flex flex-col gap-2 hover:bg-muted/50 transition-all cursor-pointer border-l-4 ${typeColor} ${activeAppt?.id === apt.id ? 'bg-muted/80 ring-2 ring-primary/20' : ''}`}
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
                            <p className={`text-xs font-medium truncate ${typeTextColor}`}>
                              {apt.type}
                            </p>
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
                    )
                  })}
                  {appointments.length === 0 && (
                    <p className="p-4 text-center text-sm text-muted-foreground">
                      Nenhuma consulta agendada.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 flex flex-col h-[700px]">
              <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                <div className="flex items-center gap-4">
                  {activeAppt && (
                    <Avatar className="h-12 w-12 border">
                      <AvatarImage
                        src={
                          activeAppt.expand?.patient_id?.avatar
                            ? pb.files.getURL(
                                { id: activeAppt.expand.patient_id.id, collectionId: 'users' },
                                activeAppt.expand.patient_id.avatar,
                              )
                            : `https://api.dicebear.com/7.x/notionists/svg?seed=${activeAppt.expand?.patient_id?.name}`
                        }
                      />
                      <AvatarFallback>{activeAppt.expand?.patient_id?.name?.[0]}</AvatarFallback>
                    </Avatar>
                  )}
                  <div>
                    <CardTitle className="text-lg">Prontuário (V MED EHR)</CardTitle>
                    <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-2 mt-1">
                      Paciente:{' '}
                      {activeAppt ? activeAppt.expand?.patient_id?.name : 'Selecione um paciente'}
                      {activeAppt && <AddToCalendar appointment={activeAppt} />}
                      {activeAppt?.type === 'Online' &&
                        new Date(activeAppt.dateTime).getTime() - Date.now() <= 15 * 60 * 1000 &&
                        new Date(activeAppt.dateTime).getTime() - Date.now() >= -60 * 60 * 1000 && (
                          <Button
                            size="sm"
                            onClick={() => navigate(`/telemedicine/${activeAppt.id}`)}
                            className="bg-blue-600 hover:bg-blue-700 text-white ml-2 h-7 text-xs"
                          >
                            <Video className="mr-1 h-3 w-3" /> Entrar na Sala
                          </Button>
                        )}
                      {activeAppt && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Badge
                              variant="outline"
                              className="cursor-pointer hover:bg-red-50 hover:text-red-600 hover:border-red-200 ml-2"
                            >
                              Ver SOS Card
                            </Badge>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md p-0 border-none bg-transparent shadow-none">
                            <SOSCard user={activeAppt.expand?.patient_id} />
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto p-4">
                {activeAppt ? (
                  <Tabs defaultValue="notes" className="w-full h-full flex flex-col">
                    <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-4 h-auto gap-1">
                      <TabsTrigger value="notes" className="py-2">
                        Evolução
                      </TabsTrigger>
                      <TabsTrigger value="prescriptions" className="py-2">
                        Receitas
                      </TabsTrigger>
                      <TabsTrigger value="plans" className="py-2">
                        Planos
                      </TabsTrigger>
                      <TabsTrigger value="external" className="py-2">
                        Exames Externos
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="notes" className="space-y-4 flex-1 flex flex-col m-0">
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

                    <TabsContent value="prescriptions" className="space-y-4 m-0">
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

                    <TabsContent value="plans" className="space-y-4 m-0">
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

                    <TabsContent value="external" className="m-0 space-y-4">
                      {renderExternalLabs()}
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
        </TabsContent>

        <TabsContent value="adherence" className="m-0 animate-fade-in">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Painel de Adesão a Tratamentos</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Acompanhe a conclusão de metas de saúde dos seus pacientes.
                </p>
              </div>
              <Select value={adherenceFilter} onValueChange={(v: any) => setAdherenceFilter(v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Pacientes</SelectItem>
                  <SelectItem value="risk">Em Risco (&lt; 50%)</SelectItem>
                  <SelectItem value="track">No Caminho (&ge; 50%)</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {adherenceData.map((d) => (
                  <div
                    key={d.patient.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={
                            d.patient.avatar
                              ? pb.files.getURL(
                                  { id: d.patient.id, collectionId: 'users' },
                                  d.patient.avatar,
                                )
                              : `https://api.dicebear.com/7.x/notionists/svg?seed=${d.patient.name}`
                          }
                        />
                        <AvatarFallback>{d.patient.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-lg">{d.patient.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {d.completed} de {d.total} metas concluídas
                        </p>
                      </div>
                    </div>
                    <div className="w-full sm:w-1/3 flex items-center gap-4">
                      <Progress
                        value={d.percentage}
                        className={cn(
                          'flex-1',
                          d.percentage < 50
                            ? 'text-red-500 [&>div]:bg-red-500'
                            : 'text-emerald-500 [&>div]:bg-emerald-500',
                        )}
                      />
                      <span
                        className={cn(
                          'font-bold w-12 text-right',
                          d.percentage < 50 ? 'text-red-600' : 'text-emerald-600',
                        )}
                      >
                        {d.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
                {adherenceData.length === 0 && (
                  <div className="text-center py-10 border rounded-lg border-dashed">
                    <FileText className="h-8 w-8 mx-auto text-muted-foreground opacity-50 mb-2" />
                    <p className="text-muted-foreground">Nenhum paciente atende a este filtro.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="m-0 animate-fade-in space-y-6">
          {!brandKit && (
            <Alert variant="default" className="border-primary/50 bg-primary/5">
              <AlertCircle className="h-4 w-4 text-primary" />
              <AlertTitle>Complete seu Brand Kit</AlertTitle>
              <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                <span>
                  Defina sua identidade visual e tom de voz para personalizar seus conteúdos gerados
                  por IA.
                </span>
                <Button
                  size="sm"
                  onClick={() => navigate('/dashboard/brand-kit')}
                  className="w-full sm:w-auto"
                >
                  Configurar Agora
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pontos de Fidelidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user?.loyalty_points || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Acumulados com pacientes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Assinaturas Ativas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{subscriptions.length}</div>
                <Button
                  variant="link"
                  className="px-0 h-auto text-xs mt-1"
                  onClick={() => navigate('/dashboard/marketplace')}
                >
                  Gerenciar no Marketplace
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Conteúdos Gerados (IA)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {recentContent.length}{' '}
                  <span className="text-sm font-normal text-muted-foreground">recentes</span>
                </div>
                <Button
                  variant="link"
                  className="px-0 h-auto text-xs mt-1"
                  onClick={() => navigate('/dashboard/social-ai')}
                >
                  Acessar Social AI
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Últimos Conteúdos Gerados</CardTitle>
              </CardHeader>
              <CardContent>
                {recentContent.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum conteúdo gerado recentemente.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {recentContent.map((content) => (
                      <div key={content.id} className="border-b last:border-0 pb-4 last:pb-0">
                        <p className="font-medium text-sm line-clamp-1">{content.topic}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {content.content_type} • {content.tone}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Suas Assinaturas</CardTitle>
              </CardHeader>
              <CardContent>
                {subscriptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Você não possui assinaturas ativas.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {subscriptions.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex justify-between items-center border-b last:border-0 pb-4 last:pb-0"
                      >
                        <div>
                          <p className="font-medium text-sm">{sub.expand?.product_id?.name}</p>
                          <p className="text-xs text-muted-foreground mt-1 capitalize">
                            {sub.expand?.product_id?.category}
                          </p>
                        </div>
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                          Ativa
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
