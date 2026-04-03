import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { FileText, Pill, Activity, ShieldCheck, Download, Smile, Sparkles } from 'lucide-react'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Button } from '@/components/ui/button'

const bpData = [
  { date: 'Jan', sys: 120, dia: 80 },
  { date: 'Fev', sys: 118, dia: 79 },
  { date: 'Mar', sys: 122, dia: 82 },
  { date: 'Abr', sys: 115, dia: 75 },
  { date: 'Mai', sys: 119, dia: 78 },
]

export default function HealthProfile() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Profile */}
      <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-card rounded-xl border shadow-sm animate-fade-in-up">
        <Avatar className="h-24 w-24 border-4 border-primary/20">
          <AvatarImage src="https://img.usecurling.com/ppl/thumbnail?gender=female&seed=1" />
          <AvatarFallback>SF</AvatarFallback>
        </Avatar>
        <div className="text-center md:text-left flex-1">
          <h1 className="text-3xl font-bold">Sofia Fernandes</h1>
          <p className="text-muted-foreground mt-1">32 anos • Sangue O+ • Plano Bradesco Top</p>
          <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              Não fumante
            </Badge>
            <Badge variant="secondary" className="bg-red-100 text-red-700">
              Alérgica a Penicilina
            </Badge>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
              <ShieldCheck className="w-3 h-3 mr-1" /> Dados Protegidos (LGPD)
            </Badge>
          </div>
        </div>
      </div>

      <Tabs
        defaultValue="timeline"
        className="animate-fade-in-up"
        style={{ animationDelay: '0.1s' }}
      >
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto p-1 bg-muted/50 rounded-lg flex-wrap">
          <TabsTrigger
            value="timeline"
            className="py-2.5 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            Clínico
          </TabsTrigger>
          <TabsTrigger
            value="dental"
            className="py-2.5 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            Odonto
          </TabsTrigger>
          <TabsTrigger
            value="aesthetic"
            className="py-2.5 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            Estética
          </TabsTrigger>
          <TabsTrigger
            value="biometrics"
            className="py-2.5 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            Biometria
          </TabsTrigger>
          <TabsTrigger
            value="pharmacy"
            className="py-2.5 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            Farmácia
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-6 space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="relative border-l-2 border-muted ml-3 space-y-8">
                <div className="relative pl-6">
                  <div className="absolute -left-[21px] bg-background border-2 border-primary w-10 h-10 rounded-full flex items-center justify-center shadow-sm">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">Consulta de Rotina - Cardiologia</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    15 de Maio, 2026 • Dra. Ana Silva
                  </p>
                  <p className="text-sm bg-muted/50 p-3 rounded-md border">
                    Paciente apresenta exames normais. Pressão arterial controlada. Recomendada
                    manutenção da atividade física.
                  </p>
                </div>

                <div className="relative pl-6">
                  <div className="absolute -left-[21px] bg-background border-2 border-blue-500 w-10 h-10 rounded-full flex items-center justify-center shadow-sm">
                    <FileText className="h-5 w-5 text-blue-500" />
                  </div>
                  <h3 className="font-semibold text-lg">Exames de Sangue Completos</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    02 de Maio, 2026 • Lab. Fleury
                  </p>
                  <Button variant="outline" size="sm" className="mt-1">
                    <Download className="mr-2 h-4 w-4" /> Baixar PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dental" className="mt-6 space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="relative border-l-2 border-muted ml-3 space-y-8">
                <div className="relative pl-6">
                  <div className="absolute -left-[21px] bg-background border-2 border-teal-500 w-10 h-10 rounded-full flex items-center justify-center shadow-sm">
                    <Smile className="h-5 w-5 text-teal-500" />
                  </div>
                  <h3 className="font-semibold text-lg">Limpeza e Profilaxia</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    10 de Março, 2026 • Dr. Carlos Mendes
                  </p>
                  <p className="text-sm bg-muted/50 p-3 rounded-md border">
                    Procedimento realizado com sucesso. Ausência de cáries. Próxima limpeza em 6
                    meses.
                  </p>
                  <Button variant="outline" size="sm" className="mt-3">
                    <Download className="mr-2 h-4 w-4" /> Radiografia Panorâmica
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aesthetic" className="mt-6 space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="relative border-l-2 border-muted ml-3 space-y-8">
                <div className="relative pl-6">
                  <div className="absolute -left-[21px] bg-background border-2 border-purple-500 w-10 h-10 rounded-full flex items-center justify-center shadow-sm">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                  </div>
                  <h3 className="font-semibold text-lg">Aplicação de Toxina Botulínica</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    05 de Janeiro, 2026 • Dra. Carolina Mendes
                  </p>
                  <p className="text-sm bg-muted/50 p-3 rounded-md border">
                    Tratamento preventivo em terço superior da face. Retorno em 15 dias sem
                    necessidade de retoque.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="biometrics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pressão Arterial</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  sys: { label: 'Sistólica', color: 'hsl(var(--chart-1))' },
                  dia: { label: 'Diastólica', color: 'hsl(var(--chart-2))' },
                }}
                className="h-[300px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={bpData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                    />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} domain={[60, 140]} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="sys"
                      stroke="var(--color-sys)"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="dia"
                      stroke="var(--color-dia)"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pharmacy" className="mt-6 grid sm:grid-cols-2 gap-4">
          <Card className="border-emerald-200 bg-emerald-50/30">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-100 p-3 rounded-full text-emerald-600">
                    <Pill className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Rosuvastatina 10.000 UI</h3>
                    <p className="text-sm text-muted-foreground">Uso Contínuo • 1x por semana</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg border flex justify-between items-center">
                <div>
                  <p className="text-xs text-muted-foreground">Melhor preço encontrado</p>
                  <p className="font-bold text-emerald-700">
                    R$ 45,90{' '}
                    <span className="text-xs font-normal text-muted-foreground">na Droga Raia</span>
                  </p>
                </div>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  Comprar e Receber
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
