import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, Pie, PieChart, Cell } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Users,
  Building2,
  Stethoscope,
  ActivitySquare,
  Shield,
  ArrowRight,
  ShieldCheck,
  ClipboardList,
  FileText,
  Store,
  HeartPulse,
  BadgeAlert,
  Bot,
  Download,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { subDays, startOfMonth, format } from 'date-fns'
import pb from '@/lib/pocketbase/client'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { AdminHeader } from '@/components/admin/AdminHeader'

export default function AdminDashboard() {
  const { user } = useAuth()
  const isMasterAdmin =
    user?.role === 'medical_director' &&
    (user?.email === 'valterpmendonca@gmail.com' ||
      user?.email === 'victorhugotmendonca@gmail.com' ||
      user?.name?.toLowerCase().includes('valter') ||
      user?.name?.toLowerCase().includes('victor'))

  const [stats, setStats] = useState({
    patients: 0,
    professionals: 0,
    companies: 0,
    appointments: 0,
  })
  const [financialData, setFinancialData] = useState<
    { month: string; revenue: number; transfers: number }[]
  >([])
  const [paymentStatusData, setPaymentStatusData] = useState<
    { status: string; value: number; fill: string }[]
  >([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('this_month')
  const [txData, setTxData] = useState<any[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    const fetchStats = async () => {
      if (!isMasterAdmin) {
        setLoading(false)
        return
      }

      setLoading(true)

      try {
        let dateFilter = ''
        if (period === 'last_7_days') {
          dateFilter = `created >= "${format(subDays(new Date(), 7), 'yyyy-MM-dd 00:00:00')}"`
        } else if (period === 'this_month') {
          dateFilter = `created >= "${format(startOfMonth(new Date()), 'yyyy-MM-dd 00:00:00')}"`
        }

        const [patients, professionals, companies, appointments, transactions] = await Promise.all([
          pb.collection('users').getList(1, 1, { filter: 'role="patient"' }),
          pb.collection('users').getList(1, 1, { filter: 'role="professional"' }),
          pb.collection('users').getList(1, 1, { filter: 'role="company"' }),
          pb.collection('appointments').getList(1, 1),
          pb.collection('benefit_transactions').getFullList({
            filter: dateFilter,
            expand: 'employee_id,company_id',
            sort: '-created',
          }),
        ])

        setTxData(transactions)

        setStats({
          patients: patients.totalItems,
          professionals: professionals.totalItems,
          companies: companies.totalItems,
          appointments: appointments.totalItems,
        })

        // Process financial data
        let totalRevenue = 0
        let totalTransfers = 0
        const statusCounts = { confirmed: 0, pending: 0, failed: 0, refunded: 0 }

        transactions.forEach((t) => {
          if (
            t.payment_status &&
            statusCounts[t.payment_status as keyof typeof statusCounts] !== undefined
          ) {
            statusCounts[t.payment_status as keyof typeof statusCounts]++
          } else if (t.payment_status) {
            statusCounts['confirmed']++
          }

          if (t.type === 'credit') {
            totalRevenue += t.amount || 0
          } else {
            totalTransfers += t.amount || 0
          }
        })

        setFinancialData([{ month: 'Atual', revenue: totalRevenue, transfers: totalTransfers }])

        setPaymentStatusData(
          [
            { status: 'Confirmado', value: statusCounts.confirmed, fill: 'hsl(var(--chart-2))' },
            { status: 'Pendente', value: statusCounts.pending, fill: 'hsl(var(--chart-3))' },
            { status: 'Falhou', value: statusCounts.failed, fill: 'hsl(var(--destructive))' },
          ].filter((d) => d.value > 0),
        )
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [isMasterAdmin, period])

  const exportCSV = () => {
    const headers = [
      'Data',
      'Tipo',
      'Valor Bruto',
      'Comissão VMX',
      'Profissional/Empresa',
      'ID Asaas',
      'Status',
    ]
    const rows = txData.map((t) => {
      const date = format(new Date(t.created), 'dd/MM/yyyy HH:mm')
      const type = t.type === 'credit' ? 'Crédito' : 'Débito'
      const amount = t.amount || 0
      const rate =
        t.expand?.employee_id?.commission_rate || t.expand?.company_id?.commission_rate || 0
      const commission = (amount * rate) / 100
      const name = t.expand?.employee_id?.name || t.expand?.company_id?.name || 'N/A'
      const asaasId = t.asaas_payment_id || 'N/A'
      const status = t.payment_status || 'N/A'
      return [date, type, amount, commission, `"${name}"`, asaasId, status].join(',')
    })
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `transacoes_${period}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-8 animate-fade-in-up pb-10">
      <AdminHeader
        title={
          <>
            Painel de Controle <span className="text-primary ml-2">VMX</span>
          </>
        }
        description="Operado por VMX do Brasil Administradora de Cartões e Benefícios Ltda. Controle 100% da plataforma V MED BRASIL a partir deste ponto único."
        icon={<Shield className="h-8 w-8" />}
        rightContent={
          <div className="flex flex-col gap-2">
            <Badge
              variant="secondary"
              className="bg-primary/10 text-primary border-primary/20 w-fit"
            >
              Gestor Master: Valter Paula Mendonça
            </Badge>
            <Badge
              variant="secondary"
              className="bg-primary/10 text-primary border-primary/20 w-fit"
            >
              Gestor Master: Victor Hugo Tavares Mendonça
            </Badge>
          </div>
        }
        className="bg-primary/10 border-primary/30"
      />

      {isMasterAdmin && (
        <div className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-primary/20 bg-primary/20 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Pacientes</CardTitle>
                <Users className="h-4 w-4 text-foreground/70" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats.patients}</div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/20 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profissionais (Médicos)</CardTitle>
                <Stethoscope className="h-4 w-4 text-foreground/70" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats.professionals}</div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/20 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Empresas Parceiras</CardTitle>
                <Building2 className="h-4 w-4 text-foreground/70" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats.companies}</div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/20 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Consultas Realizadas</CardTitle>
                <ActivitySquare className="h-4 w-4 text-foreground/70" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats.appointments}</div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Dashboard */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <BadgeAlert className="h-5 w-5 text-primary" /> Visão Financeira
              </h2>
              <div className="flex items-center gap-2">
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last_7_days">Últimos 7 dias</SelectItem>
                    <SelectItem value="this_month">Este Mês</SelectItem>
                    <SelectItem value="all_time">Todo o Período</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={exportCSV}
                  disabled={loading || txData.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" /> Exportar CSV
                </Button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Receita vs. Repasses</CardTitle>
                  <CardDescription>Comparativo de entradas e saídas (splits)</CardDescription>
                </CardHeader>
                <CardContent>
                  {financialData.length > 0 ? (
                    <ChartContainer
                      config={{
                        revenue: { label: 'Receita', color: 'hsl(var(--chart-1))' },
                        transfers: { label: 'Repasses', color: 'hsl(var(--chart-2))' },
                      }}
                      className="h-[300px] w-full"
                    >
                      <BarChart data={financialData}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                        <Bar dataKey="transfers" fill="var(--color-transfers)" radius={4} />
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                      Sem dados
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Status de Pagamentos</CardTitle>
                  <CardDescription>Distribuição por status (Asaas)</CardDescription>
                </CardHeader>
                <CardContent>
                  {paymentStatusData.length > 0 ? (
                    <ChartContainer
                      config={{
                        Confirmado: { label: 'Confirmado', color: 'hsl(var(--chart-2))' },
                        Pendente: { label: 'Pendente', color: 'hsl(var(--chart-3))' },
                        Falhou: { label: 'Falhou', color: 'hsl(var(--destructive))' },
                      }}
                      className="h-[300px] w-full"
                    >
                      <PieChart>
                        <Pie
                          data={paymentStatusData}
                          dataKey="value"
                          nameKey="status"
                          innerRadius={60}
                          strokeWidth={5}
                        >
                          {paymentStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                      </PieChart>
                    </ChartContainer>
                  ) : (
                    <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                      Sem dados
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {isMasterAdmin && (
        <div>
          <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" /> Ecossistema B2B
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Empresas Ativas</CardTitle>
                <Building2 className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats.companies}</div>
                <p className="text-xs text-muted-foreground mt-1">Parceiros corporativos</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Crédito Distribuído (Mês)</CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  R${' '}
                  {txData
                    .filter((t) => t.type === 'credit')
                    .reduce((s, t) => s + (t.amount || 0), 0)
                    .toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Total creditado no período</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Crédito Utilizado (Mês)</CardTitle>
                <TrendingDown className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  R${' '}
                  {txData
                    .filter((t) => t.type === 'debit')
                    .reduce((s, t) => s + (t.amount || 0), 0)
                    .toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Total consumido no período</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
          <ActivitySquare className="h-5 w-5 text-primary" /> Módulos de Gestão da Plataforma
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Guia Saúde & Profissionais */}
          <Card
            className="group hover:border-primary/50 transition-all cursor-pointer hover:shadow-md"
            onClick={() => navigate('/admin/supervision')}
          >
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0" />
              </div>
              <CardTitle className="text-lg">Guia Saúde & Médicos</CardTitle>
              <CardDescription className="text-sm">
                Gestão de profissionais, bloqueios por irregularidades e portal do Diretor Técnico.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Verificação de Cadastros */}
          <Card
            className="group hover:border-primary/50 transition-all cursor-pointer hover:shadow-md"
            onClick={() => navigate('/admin/verification')}
          >
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0" />
              </div>
              <CardTitle className="text-lg">Verificação CFM</CardTitle>
              <CardDescription className="text-sm">
                Aprovação e validação de documentos e registros médicos da rede credenciada.
              </CardDescription>
            </CardHeader>
          </Card>

          {isMasterAdmin && (
            <>
              {/* CRM */}
              <Card
                className="group hover:border-primary/50 transition-all cursor-pointer hover:shadow-md"
                onClick={() => navigate('/admin/users')}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-600 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                      <Users className="h-6 w-6" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0" />
                  </div>
                  <CardTitle className="text-lg">CRM</CardTitle>
                  <CardDescription className="text-sm">
                    Acesso aos registros de todos os usuários, pacientes e parceiros da plataforma.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Empresas Corporativas */}
              <Card
                className="group hover:border-primary/50 transition-all cursor-pointer hover:shadow-md border-primary/20 bg-primary/5"
                onClick={() => navigate('/admin/companies')}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2.5 bg-primary/20 rounded-xl text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-primary transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0" />
                  </div>
                  <CardTitle className="text-lg text-primary">Gestão de Empresas</CardTitle>
                  <CardDescription className="text-sm text-foreground/70">
                    Controle clientes corporativos e suas listas de funcionários.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Farmácias & Laboratórios */}
              <Card
                className="group hover:border-primary/50 transition-all cursor-pointer hover:shadow-md"
                onClick={() => navigate('/admin/pharmacy')}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2.5 bg-teal-500/10 rounded-xl text-teal-600 group-hover:bg-teal-500 group-hover:text-white transition-colors">
                      <Store className="h-6 w-6" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0" />
                  </div>
                  <CardTitle className="text-lg">Farmácias e Laboratórios</CardTitle>
                  <CardDescription className="text-sm">
                    Painel de gestão para farmácias, drogarias e laboratórios parceiros.
                  </CardDescription>{' '}
                </CardHeader>
              </Card>

              {/* Especialidades */}
              <Card
                className="group hover:border-primary/50 transition-all cursor-pointer hover:shadow-md"
                onClick={() => navigate('/admin/specialties')}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                      <FileText className="h-6 w-6" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0" />
                  </div>
                  <CardTitle className="text-lg">Especialidades & IA</CardTitle>
                  <CardDescription className="text-sm">
                    Gerencie a base de dados de especialidades e vetores sintomáticos para a IA de
                    Triagem.
                  </CardDescription>
                </CardHeader>
              </Card>
            </>
          )}
        </div>
      </div>

      {isMasterAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <Card className="bg-muted/30 border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardList className="h-5 w-5" /> Logs de Auditoria
              </CardTitle>
              <CardDescription>
                Rastreabilidade de todas as ações sensíveis no sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => navigate('/admin/audit')}>
                Acessar Auditoria <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-muted/30 border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bot className="h-5 w-5" /> Agentes de IA
              </CardTitle>
              <CardDescription>
                Orquestração e configuração dos assistentes de inteligência artificial da
                plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => navigate('/admin/ai')}>
                Acessar Agentes de IA <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
