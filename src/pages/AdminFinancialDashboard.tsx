import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  Download,
  TrendingUp,
  PieChart as PieChartIcon,
  Trophy,
  Receipt,
  Settings,
} from 'lucide-react'
import { AdminHeader } from '@/components/admin/AdminHeader'
import {
  RevenueLineChart,
  VerticalPerformancePie,
  ProviderProfitabilityTable,
  LogsTable,
} from '@/components/FinancialCharts'
import { SplitConfigPanel } from '@/components/admin/SplitConfigPanel'
import {
  getRevenueData,
  getVerticalPerformance,
  getTopProviders,
  getTransactionLogs,
  exportTransactionsCSV,
} from '@/services/financial'

export default function AdminFinancialDashboard() {
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [verticalData, setVerticalData] = useState<any[]>([])
  const [providers, setProviders] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true)
      try {
        const [rev, vert, top, lg] = await Promise.all([
          getRevenueData(period),
          getVerticalPerformance(),
          getTopProviders(),
          getTransactionLogs(),
        ])
        setRevenueData(rev)
        setVerticalData(vert)
        setProviders(top)
        setLogs(lg.items)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadAll()
  }, [period])

  const totalGross = revenueData.reduce((s, d) => s + d.gross, 0)
  const totalNet = revenueData.reduce((s, d) => s + d.net, 0)
  const totalSplit = totalGross - totalNet

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      <AdminHeader
        title={
          <>
            <span className="text-primary">Inteligência</span> Financeira
          </>
        }
        description="Dashboard de receita, repasses e performance por vertical."
        icon={<TrendingUp className="h-8 w-8" />}
        className="bg-primary/10 border-primary/30"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Receita Bruta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : `R$ ${totalGross.toFixed(2)}`}
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Receipt className="h-4 w-4" /> Receita Líquida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {loading ? '...' : `R$ ${totalNet.toFixed(2)}`}
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Receipt className="h-4 w-4" /> Total Repasses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {loading ? '...' : `R$ ${totalSplit.toFixed(2)}`}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="revenue">
        <TabsList>
          <TabsTrigger value="revenue">Receita</TabsTrigger>
          <TabsTrigger value="vertical">Vertical</TabsTrigger>
          <TabsTrigger value="providers">Ranking</TabsTrigger>
          <TabsTrigger value="logs">Logs Asaas</TabsTrigger>
          <TabsTrigger value="config">Config. Split</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <div className="flex justify-end">
            <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diário (7 dias)</SelectItem>
                <SelectItem value="weekly">Semanal (4 sem)</SelectItem>
                <SelectItem value="monthly">Mensal (3 meses)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Receita Bruta vs. Líquida</CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueLineChart data={revenueData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vertical">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" /> Performance por Vertical
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VerticalPerformancePie data={verticalData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" /> Top 10 Provedores por Comissão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProviderProfitabilityTable data={providers} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => exportTransactionsCSV(logs)}
              disabled={logs.length === 0}
            >
              <Download className="mr-2 h-4 w-4" /> Exportar CSV
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <LogsTable logs={logs} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config">
          <SplitConfigPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
