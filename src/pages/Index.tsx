import { useNavigate } from 'react-router-dom'
import { ArrowRight, Calendar, FileText, Pill, Sparkles, ActivitySquare } from 'lucide-react'
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

export default function Index() {
  const navigate = useNavigate()

  const quickActions = [
    { icon: Calendar, label: 'Agendar Consulta', color: 'bg-emerald-100 text-emerald-600' },
    { icon: FileText, label: 'Meus Exames', color: 'bg-blue-100 text-blue-600' },
    { icon: Pill, label: 'Minhas Receitas', color: 'bg-purple-100 text-purple-600' },
    { icon: ActivitySquare, label: 'Atendimento Domiciliar', color: 'bg-amber-100 text-amber-600' },
  ]

  const recommendations = [
    {
      name: 'Dra. Ana Silva',
      spec: 'Cardiologia',
      image: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=2',
    },
    {
      name: 'Dr. Carlos Mendes',
      spec: 'Odontologia Estética',
      image: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=3',
    },
    {
      name: 'Dra. Julia Costa',
      spec: 'Nutrição Clínica',
      image: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=4',
    },
    {
      name: 'Dr. Marcos Paulo',
      spec: 'Dermatologia',
      image: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=5',
    },
  ]

  return (
    <div className="space-y-8 pb-10">
      {/* Hero Section */}
      <section className="animate-fade-in-up">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Bom dia, Sofia! 👋</h1>
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

      {/* Quick Actions */}
      <section
        className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up"
        style={{ animationDelay: '0.1s' }}
      >
        {quickActions.map((action, i) => (
          <Card
            key={i}
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
        {/* Upcoming Journey */}
        <section className="md:col-span-2 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <ActivitySquare className="h-5 w-5 text-primary" /> Sua Jornada: Cirurgia Estética
          </h2>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className="h-3 w-3 bg-emerald-500 rounded-full" />
                  <div className="w-0.5 h-full bg-emerald-500 min-h-[40px] my-1" />
                </div>
                <div className="pb-6">
                  <Badge className="mb-2 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                    Concluído
                  </Badge>
                  <h3 className="font-semibold text-lg text-muted-foreground line-through">
                    Avaliação Inicial
                  </h3>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className="h-3 w-3 bg-emerald-500 rounded-full" />
                  <div className="w-0.5 h-full bg-emerald-500 min-h-[40px] my-1" />
                </div>
                <div className="pb-6">
                  <Badge className="mb-2 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                    Concluído
                  </Badge>
                  <h3 className="font-semibold text-lg text-muted-foreground line-through">
                    Exames Pré-operatórios
                  </h3>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className="h-3 w-3 bg-primary rounded-full animate-pulse" />
                  <div className="w-0.5 h-full bg-border min-h-[40px] my-1" />
                </div>
                <div className="pb-6">
                  <Badge variant="secondary" className="mb-2 bg-primary/20 text-primary-foreground">
                    Amanhã, 08:00
                  </Badge>
                  <h3 className="font-semibold text-lg">Cirurgia Estética (Rinoplastia)</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Jejum absoluto de 8 horas. Chegar com 1h de antecedência na Clínica V MED.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className="h-3 w-3 bg-muted rounded-full border-2 border-primary" />
                </div>
                <div>
                  <Badge variant="outline" className="mb-2">
                    Daqui a 7 dias
                  </Badge>
                  <h3 className="font-medium text-muted-foreground">Retorno Pós-operatório</h3>
                  <Button variant="link" className="p-0 h-auto text-primary mt-1">
                    Agendar Horário <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Health Snapshot */}
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

      {/* Recommendations */}
      <section className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Especialistas Recomendados</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/search')}>
            Ver todos <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <Carousel opts={{ align: 'start' }} className="w-full">
          <CarouselContent>
            {recommendations.map((doc, index) => (
              <CarouselItem key={index} className="md:basis-1/3 lg:basis-1/4">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="p-4 pb-2 flex flex-row items-center gap-4 space-y-0">
                    <Avatar className="h-12 w-12 border">
                      <AvatarImage src={doc.image} />
                      <AvatarFallback>{doc.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{doc.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{doc.spec}</p>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="flex gap-2 mt-3">
                      <Badge variant="secondary" className="text-[10px]">
                        Presencial
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        Telemedicina
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
      </section>
    </div>
  )
}
