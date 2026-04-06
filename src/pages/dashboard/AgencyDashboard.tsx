import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Users, Eye, Heart, TrendingUp } from 'lucide-react'

const chartData = [
  { month: 'Jan', reach: 4000, leads: 240, engagement: 400 },
  { month: 'Fev', reach: 5000, leads: 339, engagement: 510 },
  { month: 'Mar', reach: 6000, leads: 480, engagement: 690 },
  { month: 'Abr', reach: 5780, leads: 390, engagement: 500 },
  { month: 'Mai', reach: 7890, leads: 580, engagement: 818 },
  { month: 'Jun', reach: 9390, leads: 780, engagement: 1050 },
]

export default function AgencyDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard de Agência</h1>
        <p className="text-muted-foreground">
          Acompanhe as métricas de crescimento da sua marca e performance de conteúdo.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alcance de Perfil</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">38.060</div>
            <p className="text-xs text-muted-foreground">+20.1% em relação ao mês anterior</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.809</div>
            <p className="text-xs text-muted-foreground">+15% em relação ao mês anterior</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engajamento de Conteúdo</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.168</div>
            <p className="text-xs text-muted-foreground">+12% em relação ao mês anterior</p>
          </CardContent>
        </Card>
      </div>

      <Card className="col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" /> Evolução de Alcance e Leads
          </CardTitle>
        </CardHeader>
        <CardContent className="pl-0">
          <ChartContainer
            config={{
              reach: { label: 'Alcance', color: 'hsl(var(--primary))' },
              leads: { label: 'Leads', color: 'hsl(var(--destructive))' },
            }}
            className="h-[350px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="reach"
                  stroke="hsl(var(--primary))"
                  fillOpacity={1}
                  fill="url(#colorReach)"
                />
                <Area
                  type="monotone"
                  dataKey="leads"
                  stroke="hsl(var(--destructive))"
                  fillOpacity={0.1}
                  fill="hsl(var(--destructive))"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
