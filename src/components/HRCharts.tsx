import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, Loader2 } from 'lucide-react'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts'
import pb from '@/lib/pocketbase/client'

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
]

export function HRCharts({ companyId }: { companyId?: string }) {
  const [usageData, setUsageData] = useState<any[]>([])
  const [specialtyData, setSpecialtyData] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!companyId) return

    const loadCharts = async () => {
      setLoading(true)
      setError(null)
      try {
        const trans = await pb.collection('benefit_transactions').getFullList({
          filter: `company_id = "${companyId}"`,
        })

        let healthTotal = 0
        let medTotal = 0
        trans.forEach((t) => {
          if (t.type === 'debit') {
            if (t.category === 'health_service') healthTotal += t.amount
            else if (t.category === 'medication') medTotal += t.amount
          }
        })

        setUsageData([
          { name: 'Serviços de Saúde', valor: healthTotal },
          { name: 'Farmácia', valor: medTotal },
        ])

        const appts = await pb.collection('appointments').getFullList({
          filter: `patient_id.company_id = "${companyId}"`,
          expand: 'professional_id',
        })

        const specCounts: Record<string, number> = {}
        appts.forEach((a) => {
          const spec = a.expand?.professional_id?.specialty || 'Clínico Geral'
          specCounts[spec] = (specCounts[spec] || 0) + 1
        })

        setSpecialtyData(Object.entries(specCounts).map(([name, count]) => ({ name, count })))

        let customAnalytics = null
        try {
          customAnalytics = await pb.send(`/backend/v1/company/${companyId}/analytics`, {
            method: 'GET',
          })
        } catch (err) {
          console.warn('Analytics endpoint failed', err)
        }
        setAnalytics(customAnalytics)
      } catch (e) {
        console.error('Failed to load chart data', e)
        setError('Não foi possível carregar os gráficos.')
      } finally {
        setLoading(false)
      }
    }

    loadCharts()
  }, [companyId])

  if (!companyId) return null

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="h-[380px] flex items-center justify-center bg-muted/20">
            <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  const apptTypeData = analytics
    ? Object.entries(analytics.appointments).map(([name, count]) => ({ name, count }))
    : []

  const recordsTypeData = analytics
    ? Object.entries(analytics.health_records).map(([name, count]) => ({ name, count }))
    : []

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Consumo de Benefício por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{ valor: { label: 'R$ Utilizados', color: 'hsl(var(--primary))' } }}
            className="h-[300px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={usageData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `R$ ${val}`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Especialidades Mais Buscadas</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-[300px]">
          {specialtyData.length > 0 ? (
            <ChartContainer config={{ count: { label: 'Consultas' } }} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={specialtyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="count"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {specialtyData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <p className="text-muted-foreground text-sm">Sem dados suficientes.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Agendamentos por Modalidade</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-[300px]">
          {apptTypeData.length > 0 ? (
            <ChartContainer config={{ count: { label: 'Agendamentos' } }} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={apptTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="count"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {apptTypeData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <p className="text-muted-foreground text-sm">Sem dados suficientes.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tipos de Prontuários (Anônimo)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{ count: { label: 'Registros', color: 'hsl(var(--chart-2))' } }}
            className="h-[300px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recordsTypeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
