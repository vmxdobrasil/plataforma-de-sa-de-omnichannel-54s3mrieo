import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Users, Eye, TrendingUp, Megaphone, UserPlus } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'

export default function AgencyDashboard() {
  const [leads, setLeads] = useState<any[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const campaignsData = await pb.collection('campaigns').getFullList({ sort: '-created' })
      setCampaigns(campaignsData)

      let leadsData: any[] = []
      try {
        leadsData = await pb.collection('registration_leads').getFullList({ sort: '-created' })
      } catch {
        // registration_leads requires admin/medical_director role
      }
      setLeads(leadsData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime('registration_leads', () => loadData())
  useRealtime('campaigns', () => loadData())

  const totalVisits = campaigns.reduce((sum, c) => sum + (c.visit_count || 0), 0)
  const totalRegistrations = campaigns.reduce((sum, c) => sum + (c.registration_count || 0), 0)
  const convertedLeads = leads.filter((l) => l.status === 'converted').length

  const chartData = campaigns.slice(0, 6).map((c) => ({
    name: c.name?.slice(0, 12) || 'N/A',
    visits: c.visit_count || 0,
    registrations: c.registration_count || 0,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard de Agência</h1>
        <p className="text-muted-foreground">
          Acompanhe as métricas de crescimento da sua marca e performance de campanhas.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : leads.length}</div>
            <p className="text-xs text-muted-foreground">{convertedLeads} convertidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitas Totais</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : totalVisits}</div>
            <p className="text-xs text-muted-foreground">Campanhas ativas: {campaigns.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registros via Campanha</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : totalRegistrations}</div>
            <p className="text-xs text-muted-foreground">
              Taxa: {totalVisits > 0 ? ((totalRegistrations / totalVisits) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" /> Performance de Campanhas
            </CardTitle>
          </CardHeader>
          <CardContent className="pl-0">
            <ChartContainer
              config={{
                visits: { label: 'Visitas', color: 'hsl(var(--primary))' },
                registrations: { label: 'Registros', color: 'hsl(var(--destructive))' },
              }}
              className="h-[350px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="visits" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar
                    dataKey="registrations"
                    fill="hsl(var(--destructive))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" /> Campanhas Ativas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              Nenhuma campanha encontrada.
            </p>
          ) : (
            <div className="space-y-3">
              {campaigns.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.source || 'N/A'} • {c.medium || 'N/A'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-sm font-bold">{c.visit_count || 0}</p>
                      <p className="text-xs text-muted-foreground">Visitas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold">{c.registration_count || 0}</p>
                      <p className="text-xs text-muted-foreground">Registros</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
