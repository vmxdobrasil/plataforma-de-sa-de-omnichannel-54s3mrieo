import { Users, DollarSign, Calendar as CalIcon, TrendingUp, Video } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'

const chartData = [
  { name: 'Seg', revenue: 1200 },
  { name: 'Ter', revenue: 2100 },
  { name: 'Qua', revenue: 1800 },
  { name: 'Qui', revenue: 2400 },
  { name: 'Sex', revenue: 3200 },
  { name: 'Sáb', revenue: 1500 },
]

const appointments = [
  {
    time: '09:00',
    patient: 'Mariana Costa',
    type: 'Primeira Avaliação',
    mode: 'Presencial',
    img: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=20',
  },
  {
    time: '10:30',
    patient: 'Roberto Silva',
    type: 'Retorno',
    mode: 'Online',
    img: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=21',
  },
  {
    time: '14:00',
    patient: 'Ana Paula',
    type: 'Procedimento Estético',
    mode: 'Presencial',
    img: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=22',
  },
]

export default function ProfessionalDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Clínico</h1>
          <p className="text-muted-foreground mt-1">Resumo das suas atividades e finanças</p>
        </div>
        <Button className="rounded-full">
          <CalIcon className="mr-2 h-4 w-4" /> Gerenciar Agenda
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Pacientes Hoje</p>
              <h3 className="text-2xl font-bold">12</h3>
            </div>
            <div className="p-3 bg-primary/10 rounded-full text-primary">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Faturamento (Semana)</p>
              <h3 className="text-2xl font-bold">R$ 12.2k</h3>
            </div>
            <div className="p-3 bg-emerald-100 rounded-full text-emerald-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Crescimento</p>
              <h3 className="text-2xl font-bold">+14%</h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-full text-blue-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-80 mb-1">Próxima Consulta</p>
              <h3 className="text-xl font-bold">09:00 - Mariana</h3>
            </div>
            <Button variant="secondary" size="icon" className="rounded-full">
              <Video className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <div
        className="grid lg:grid-cols-3 gap-6 animate-fade-in-up"
        style={{ animationDelay: '0.1s' }}
      >
        {/* Agenda */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Agenda do Dia</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="divide-y">
              {appointments.map((apt, i) => (
                <div
                  key={i}
                  className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="text-center font-medium w-12 text-sm">{apt.time}</div>
                  <Avatar className="h-10 w-10 border">
                    <AvatarImage src={apt.img} />
                    <AvatarFallback>{apt.patient[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-semibold text-sm truncate">{apt.patient}</p>
                    <p className="text-xs text-muted-foreground truncate">{apt.type}</p>
                  </div>
                  {apt.mode === 'Online' && <Video className="h-4 w-4 text-blue-500 shrink-0" />}
                </div>
              ))}
            </div>
            <div className="p-4 pt-2">
              <Button variant="outline" className="w-full text-xs">
                Ver Agenda Completa
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Desempenho Financeiro</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ revenue: { label: 'Faturamento (R$)', color: 'hsl(var(--primary))' } }}
              className="h-[300px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(val) => `R${val}`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorRev)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
