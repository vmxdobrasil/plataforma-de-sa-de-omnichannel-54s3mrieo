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
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { getPatientAppointments } from '@/services/appointments'
import { getProfessionals } from '@/services/users'
import { useRealtime } from '@/hooks/use-realtime'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Index() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<any[]>([])
  const [professionals, setProfessionals] = useState<any[]>([])

  const loadData = async () => {
    if (user?.id) {
      try {
        const appts = await getPatientAppointments(user.id)
        setAppointments(appts)
      } catch (e) {}
    }
    try {
      const pros = await getProfessionals()
      setProfessionals(pros)
    } catch (e) {}
  }

  useEffect(() => {
    loadData()
  }, [user?.id])

  useRealtime('appointments', () => {
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
  ]

  const upcomingAppt = appointments.find(
    (a) => new Date(a.dateTime) > new Date() && a.status === 'scheduled',
  )

  return (
    <div className="space-y-8 pb-10">
      <section className="animate-fade-in-up">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          Bom dia, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-muted-foreground mb-6 text-lg">
          Sua saúde está em dia. Como você está se sentindo hoje?
        </p>

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
        className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up"
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
                  <div className="pb-6">
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
          </div>
        </section>
      </div>

      <section className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
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
