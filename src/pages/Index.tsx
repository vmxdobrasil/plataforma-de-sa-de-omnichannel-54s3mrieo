import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Calendar,
  FileText,
  Pill,
  Sparkles,
  ActivitySquare,
  MapPin,
  Video,
  Home as HomeIcon,
  MessageSquare,
  Loader2,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { NotificationSettings } from '@/components/NotificationSettings'
import { getPatientAppointments } from '@/services/appointments'
import { getRecentDocuments } from '@/services/documents'
import pb from '@/lib/pocketbase/client'
import { Briefcase, Folder } from 'lucide-react'
import { getExpiryStatus } from '@/lib/document-utils'
import { Navigate } from 'react-router-dom'
import { getProfessionals } from '@/services/users'
import { useRealtime } from '@/hooks/use-realtime'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { DependentSwitcher } from '@/components/DependentSwitcher'
import { AddToCalendar } from '@/components/AddToCalendar'

export default function Index() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [activeProfileId, setActiveProfileId] = useState<string>(user?.id || '')
  const [appointments, setAppointments] = useState<any[]>([])
  const [professionals, setProfessionals] = useState<any[]>([])
  const [recentDocuments, setRecentDocuments] = useState<any[]>([])
  const [companyName, setCompanyName] = useState<string>('')
  const [employeeData, setEmployeeData] = useState<any>(null)

  useEffect(() => {
    if (user?.id && !activeProfileId) setActiveProfileId(user.id)
  }, [user?.id])

  const loadEmployeeData = async () => {
    if (user?.parent_id) {
      try {
        const parent = await pb.collection('users').getOne(user.parent_id)
        setEmployeeData(parent)
        if (parent.company_id) {
          const c = await pb.collection('users').getOne(parent.company_id)
          setCompanyName(c.name)
        }
      } catch (e) {
        console.error(e)
      }
    } else if (user?.company_id) {
      try {
        const currentUser = await pb.collection('users').getOne(user.id)
        setEmployeeData(currentUser)
        if (currentUser.company_id) {
          const c = await pb.collection('users').getOne(currentUser.company_id)
          setCompanyName(c.name)
        }
      } catch (e) {
        console.error(e)
      }
    }
  }

  useEffect(() => {
    loadEmployeeData()
  }, [user?.company_id, user?.parent_id, user?.id])

  useRealtime('users', () => {
    loadEmployeeData()
  })

  const loadData = async () => {
    const targetId = activeProfileId || user?.id
    if (targetId) {
      try {
        const appts = await getPatientAppointments(targetId)
        setAppointments(appts)
        const docs = await getRecentDocuments(targetId)
        setRecentDocuments(docs)
      } catch (e) {
        console.error(e)
      }
    }
    try {
      const pros = await getProfessionals()
      setProfessionals(pros)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [activeProfileId, user?.id])

  useRealtime('appointments', () => {
    loadData()
  })

  useRealtime('documents', () => {
    loadData()
  })

  const quickActions = [
    {
      icon: Calendar,
      label: 'Agendar Consulta',
      color: 'bg-emerald-100 text-emerald-600',
      path: '/search',
    },
    {
      icon: FileText,
      label: 'Meus Exames',
      color: 'bg-blue-100 text-blue-600',
      path: '/health-profile',
    },
    {
      icon: Pill,
      label: 'Minhas Receitas',
      color: 'bg-purple-100 text-purple-600',
      path: '/health-profile',
    },
    {
      icon: ActivitySquare,
      label: 'Atendimento Domiciliar',
      color: 'bg-amber-100 text-amber-600',
      path: '/search',
    },
    {
      icon: Pill,
      label: 'Farmácia V MED BRASIL',
      color: 'bg-teal-100 text-teal-600',
      path: '/pharmacy',
    },
  ]

  const upcomingAppt = appointments.find(
    (a) => new Date(a.dateTime) > new Date() && a.status === 'scheduled',
  )

  const checkedInAppt = appointments.find((a) => a.status === 'checked_in')

  if (loading) {
    return (
      <div className="flex h-full min-h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium animate-pulse">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 animate-fade-in-up">
        <div className="bg-primary/10 p-6 rounded-full mb-8">
          <ShieldCheck className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-foreground mb-6 tracking-tight">
          Sua Saúde, <span className="text-primary">Nossa Prioridade</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
          Conecte-se com os melhores profissionais de saúde, gerencie seus exames e tenha acesso a
          telemedicina de onde estiver com a Plataforma V MED BRASIL.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Button
            size="lg"
            onClick={() => navigate('/login')}
            className="h-14 px-8 text-lg rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            Acessar Minha Conta
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate('/search')}
            className="h-14 px-8 text-lg rounded-full"
          >
            <Stethoscope className="mr-2 h-5 w-5" />
            Buscar Especialistas
          </Button>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl text-left">
          <Card className="border-none shadow-md bg-secondary/20 hover:bg-secondary/30 transition-colors">
            <CardContent className="p-6">
              <Video className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Telemedicina</h3>
              <p className="text-muted-foreground">
                Consultas online com segurança e praticidade do conforto do seu lar.
              </p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-secondary/20 hover:bg-secondary/30 transition-colors">
            <CardContent className="p-6">
              <FileText className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Prontuário Digital</h3>
              <p className="text-muted-foreground">
                Todos os seus exames e receitas médicas em um só lugar seguro.
              </p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-secondary/20 hover:bg-secondary/30 transition-colors">
            <CardContent className="p-6">
              <ActivitySquare className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Prevenção</h3>
              <p className="text-muted-foreground">
                Acompanhamento contínuo e metas de saúde guiadas por especialistas.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (user?.role === 'company') {
    return <Navigate to="/company/dashboard" replace />
  }

  return (
    <div className="space-y-8 pb-10">
      {checkedInAppt && (
        <section className="animate-fade-in-down">
          <Card className="border-blue-300 bg-blue-50 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -z-0"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-20"></div>
                  <Avatar className="h-20 w-20 border-4 border-white shadow-sm relative z-10">
                    <AvatarImage
                      src={
                        checkedInAppt.expand?.professional_id?.avatar
                          ? pb.files.getURL(
                              {
                                id: checkedInAppt.expand.professional_id.id,
                                collectionId: 'users',
                              },
                              checkedInAppt.expand.professional_id.avatar,
                            )
                          : `https://api.dicebear.com/7.x/notionists/svg?seed=${checkedInAppt.expand?.professional_id?.name}`
                      }
                    />
                    <AvatarFallback>
                      {checkedInAppt.expand?.professional_id?.name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1">
                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200 mb-2">
                    Sala de Espera Virtual
                  </Badge>
                  <h2 className="text-2xl font-bold text-blue-900 mb-1">
                    Aguardando {checkedInAppt.expand?.professional_id?.name}
                  </h2>
                  <p className="text-blue-700 mb-4">
                    Sua conexão está verificada. O profissional iniciará o atendimento em breve.
                  </p>

                  <div className="bg-white/60 p-4 rounded-lg border border-blue-100 flex items-start gap-3 text-sm text-blue-900">
                    <Sparkles className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block mb-1">Dica de Saúde V MED BRASIL:</span>
                      Respire fundo. A ansiedade antes de consultas é normal. Tente focar na sua
                      respiração enquanto aguarda.
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      <section className="animate-fade-in-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Bom dia, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-muted-foreground text-lg">
              Sua saúde está em dia. Como você está se sentindo hoje?
            </p>
          </div>
          {user?.role === 'patient' && (
            <DependentSwitcher activeId={activeProfileId} setActiveId={setActiveProfileId} />
          )}
        </div>

        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-none shadow-sm">
          <CardContent className="p-6">
            <div className="relative max-w-2xl mx-auto">
              <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
              <Input
                placeholder="Ex: Quero melhorar meu sorriso, Dor nas costas..."
                className="pl-12 pr-24 h-14 text-lg rounded-full bg-background shadow-sm border-primary/20 focus-visible:ring-primary/50"
                onKeyDown={(e) => e.key === 'Enter' && navigate('/search')}
              />
              <Button
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-6"
                onClick={() => navigate('/search')}
              >
                Buscar
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section
        className="grid grid-cols-2 md:grid-cols-5 gap-4 animate-fade-in-up"
        style={{ animationDelay: '0.1s' }}
      >
        {quickActions.map((action, i) => (
          <Card
            key={i}
            onClick={() => navigate(action.path)}
            className="hover:shadow-md transition-all cursor-pointer border-border/50 hover:border-primary/30 group"
          >
            <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-3">
              <div
                className={`p-4 rounded-2xl ${action.color} group-hover:scale-110 transition-transform`}
              >
                <action.icon className="h-6 w-6" />
              </div>
              <span className="font-medium text-sm text-foreground/80">{action.label}</span>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid md:grid-cols-3 gap-6">
        <section className="md:col-span-2 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <ActivitySquare className="h-5 w-5 text-primary" /> Próximos Compromissos
          </h2>
          <Card>
            <CardContent className="p-6">
              {upcomingAppt ? (
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 bg-primary rounded-full animate-pulse" />
                    <div className="w-0.5 h-full bg-border min-h-[40px] my-1" />
                  </div>
                  <div className="pb-6 flex-1">
                    <div className="flex justify-between items-start flex-wrap gap-4">
                      <div>
                        <Badge
                          variant="secondary"
                          className="mb-2 bg-primary/20 text-primary-foreground"
                        >
                          {format(new Date(upcomingAppt.dateTime), "dd 'de' MMMM, HH:mm", {
                            locale: ptBR,
                          })}
                        </Badge>
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          Consulta com {upcomingAppt.expand?.professional_id?.name}
                          {upcomingAppt.type === 'Online' && (
                            <Video className="h-4 w-4 text-blue-500" />
                          )}
                          {upcomingAppt.type === 'Presencial' && (
                            <MapPin className="h-4 w-4 text-emerald-500" />
                          )}
                          {upcomingAppt.type === 'Domiciliar' && (
                            <HomeIcon className="h-4 w-4 text-amber-500" />
                          )}
                        </h3>
                        <p className="text-muted-foreground text-sm mt-1">
                          {upcomingAppt.notes || 'Sessão de acompanhamento agendada.'}
                        </p>
                      </div>
                      {upcomingAppt.type === 'Online' &&
                        new Date(upcomingAppt.dateTime).getTime() - Date.now() <= 15 * 60 * 1000 &&
                        new Date(upcomingAppt.dateTime).getTime() - Date.now() >=
                          -60 * 60 * 1000 && (
                          <Button
                            onClick={() => navigate(`/telemedicine/${upcomingAppt.id}`)}
                            className="animate-pulse-glow bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Video className="mr-2 h-4 w-4" /> Entrar na Sala
                          </Button>
                        )}
                      <div className="mt-2 sm:mt-0">
                        <AddToCalendar appointment={upcomingAppt} />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>Nenhum agendamento futuro.</p>
                  <Button variant="link" onClick={() => navigate('/search')} className="mt-2">
                    Agendar agora
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-xl font-semibold mb-4">Resumo Diário</h2>
          <div className="space-y-4">
            <Card className="bg-gradient-to-br from-yellow-50 to-amber-100 border-yellow-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2 text-yellow-800">
                  <Sparkles className="h-4 w-4" />{' '}
                  <span className="font-medium text-sm">Pontos de Fidelidade</span>
                </div>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-2xl font-bold text-yellow-900">
                    {user?.loyalty_points || 0}
                  </span>
                  <span className="text-sm text-yellow-700 mb-1">pts</span>
                </div>
                <Progress
                  value={Math.min(((user?.loyalty_points || 0) / 100) * 100, 100)}
                  className="h-2 bg-yellow-200 [&>div]:bg-yellow-500"
                />
                <p className="text-xs text-yellow-700 mt-2">
                  Ganhe mais pontos completando seus planos de tratamento!
                </p>
              </CardContent>
            </Card>

            {employeeData?.company_id && (
              <>
                <Card
                  className="bg-purple-50 border-purple-200 cursor-pointer hover:shadow-md transition-shadow group relative"
                  onClick={() => navigate('/benefits/statement')}
                >
                  <CardContent className="p-4">
                    <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="h-4 w-4 text-purple-500" />
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-purple-800">
                        <Briefcase className="h-4 w-4" />
                        <span className="font-medium text-sm">Saldo para Saúde</span>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-purple-300 text-purple-700 bg-purple-100 mr-6 group-hover:mr-0 transition-all"
                      >
                        {companyName || 'Sua Empresa'}
                      </Badge>
                    </div>
                    <div className="flex items-end gap-2 mb-1">
                      <span className="text-2xl font-bold text-purple-900">
                        R$ {employeeData?.health_allowance?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <p className="text-xs text-purple-700">
                      Disponível em Reais para consultas e exames
                      {user?.parent_id && ' (Saldo do Titular)'}
                    </p>
                  </CardContent>
                </Card>
                <Card
                  className="bg-teal-50 border-teal-200 mt-4 cursor-pointer hover:shadow-md transition-shadow group relative"
                  onClick={() => navigate('/benefits/statement')}
                >
                  <CardContent className="p-4">
                    <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="h-4 w-4 text-teal-500" />
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-teal-800">
                        <Pill className="h-4 w-4" />
                        <span className="font-medium text-sm">Saldo Farmácia</span>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-teal-300 text-teal-700 bg-teal-100 mr-6 group-hover:mr-0 transition-all"
                      >
                        {companyName || 'Sua Empresa'}
                      </Badge>
                    </div>
                    <div className="flex items-end gap-2 mb-1">
                      <span className="text-2xl font-bold text-teal-900">
                        R$ {employeeData?.medication_allowance?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <p className="text-xs text-teal-700">
                      Disponível em Reais para produtos de farmácia
                      {user?.parent_id && ' (Saldo do Titular)'}
                    </p>
                  </CardContent>
                </Card>
              </>
            )}

            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-100 p-2 rounded-lg">
                    <Pill className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-amber-900">Vitamina D</p>
                    <p className="text-xs text-amber-700">Tomar em 30 min</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  Feito
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2 text-blue-800">
                  <Sparkles className="h-4 w-4" />{' '}
                  <span className="font-medium text-sm">Dica da IA</span>
                </div>
                <p className="text-sm text-blue-900 leading-relaxed">
                  Sua última hidratação registrada foi baixa. Beba um copo d'água agora para manter
                  o brilho da sua pele! 💧
                </p>
              </CardContent>
            </Card>

            {user?.role === 'patient' && <NotificationSettings />}
          </div>
        </section>
      </div>

      <section className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" /> Documentos Recentes
          </h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/documents')}>
            Ver todos <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {recentDocuments.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
            {recentDocuments.map((doc) => {
              const fileUrl = pb.files.getURL(doc, doc.file)
              const expiryStatus = getExpiryStatus(doc.expiry_date)
              return (
                <Card
                  key={doc.id}
                  className="hover:shadow-md transition-shadow group relative cursor-pointer"
                  onClick={() => window.open(fileUrl, '_blank')}
                >
                  <CardContent className="p-4 flex flex-col h-full gap-3">
                    <div className="flex justify-between items-start">
                      <div className="bg-primary/10 p-2 rounded-lg text-primary">
                        <FileText className="h-5 w-5" />
                      </div>
                      <Badge variant="outline" className="capitalize text-[10px]">
                        {doc.type === 'exam'
                          ? 'Exame'
                          : doc.type === 'prescription'
                            ? 'Receita'
                            : doc.type === 'certificate'
                              ? 'Atestado'
                              : 'Outros'}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm line-clamp-1" title={doc.title}>
                        {doc.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(doc.created), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                    {expiryStatus && (
                      <div className="mt-auto pt-2">
                        <Badge
                          variant="outline"
                          className={`text-[10px] w-full justify-center ${expiryStatus.color}`}
                        >
                          {expiryStatus.label}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="bg-muted/20 border-dashed mb-8">
            <CardContent className="p-8 text-center text-muted-foreground">
              <Folder className="h-8 w-8 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Nenhum documento recente.</p>
              <Button
                variant="link"
                size="sm"
                onClick={() => navigate('/documents')}
                className="mt-2"
              >
                Fazer upload
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Especialistas Recomendados</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/search')}>
            Ver todos <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {professionals.length > 0 ? (
          <Carousel opts={{ align: 'start' }} className="w-full">
            <CarouselContent>
              {professionals.map((doc) => (
                <CarouselItem key={doc.id} className="md:basis-1/3 lg:basis-1/4">
                  <Card
                    className="hover:shadow-lg transition-shadow cursor-pointer h-full"
                    onClick={() => navigate('/search')}
                  >
                    <CardHeader className="p-4 pb-2 flex flex-row items-center gap-4 space-y-0">
                      <Avatar className="h-12 w-12 border">
                        <AvatarImage
                          src={`https://api.dicebear.com/7.x/notionists/svg?seed=${doc.name}`}
                        />
                        <AvatarFallback>{doc.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base truncate" title={doc.name}>
                          {doc.name}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground truncate">
                          {doc.specialty || 'Clínico Geral'}
                        </p>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <div className="flex gap-2 mt-3 flex-wrap">
                        <Badge variant="secondary" className="text-[10px]">
                          Presencial
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          Online
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="hidden md:block">
              <CarouselPrevious className="-left-4" />
              <CarouselNext className="-right-4" />
            </div>
          </Carousel>
        ) : (
          <p className="text-muted-foreground text-sm">Carregando especialistas...</p>
        )}
      </section>
    </div>
  )
}
