import { useEffect, useState } from 'react'
import { getEmployees, getCompanyTransactions } from '@/services/companies'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Building2,
  Users,
  DollarSign,
  Loader2,
  AlertCircle,
  CreditCard,
  Banknote,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { HRCharts } from '@/components/HRCharts'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function CompanyDashboard() {
  const { user } = useAuth()
  const [employees, setEmployees] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async (isInitial = false) => {
    if (user?.id) {
      if (isInitial) setLoading(true)
      try {
        const [emps, trans] = await Promise.all([
          getEmployees(user.id),
          getCompanyTransactions(user.id),
        ])
        setEmployees(emps)
        setTransactions(trans)
        setError(null)
      } catch (e: any) {
        console.error(e)
        setError('Não foi possível carregar os dados do painel.')
      } finally {
        if (isInitial) setLoading(false)
      }
    }
  }

  useEffect(() => {
    loadData(true)
  }, [user?.id])

  useRealtime('users', () => {
    loadData(false)
  })

  useRealtime('benefit_transactions', () => {
    loadData(false)
  })

  if (user?.role !== 'company' && user?.role !== 'medical_director') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground text-lg">
          Acesso negado. Apenas administradores podem visualizar esta página.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Carregando painel corporativo...</p>
        </div>
      </div>
    )
  }

  const totalBudgetHealth = employees.reduce((acc, emp) => acc + (emp.health_allowance || 0), 0)
  const totalBudgetMeds = employees.reduce((acc, emp) => acc + (emp.medication_allowance || 0), 0)
  const totalBudget = totalBudgetHealth + totalBudgetMeds

  const currentMonthTransactions = transactions.filter(
    (t) => new Date(t.created).getMonth() === new Date().getMonth() && t.type === 'debit',
  )

  const spentHealth = currentMonthTransactions
    .filter((t) => t.category === 'health_service')
    .reduce((acc, t) => acc + t.amount, 0)

  const spentMeds = currentMonthTransactions
    .filter((t) => t.category === 'medication')
    .reduce((acc, t) => acc + t.amount, 0)

  const totalSpent = spentHealth + spentMeds
  const remainingHealth = totalBudgetHealth - spentHealth
  const remainingMeds = totalBudgetMeds - spentMeds

  return (
    <div className="space-y-8 pb-10 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" /> Painel da Empresa
          </h1>
          <p className="text-muted-foreground mt-2">
            Visão geral dos benefícios e uso pelos colaboradores.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/company/transactions">Ver Transações</Link>
          </Button>
          <Button asChild>
            <Link to="/company/employees">Gerenciar Colaboradores</Link>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Colaboradores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div className="text-3xl font-bold">{employees.length}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Orçamento Total Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-700">R$ {totalBudget.toFixed(2)}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gasto Saúde (Mês Atual)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex flex-col">
                <div className="text-2xl font-bold text-purple-700">
                  R$ {spentHealth.toFixed(2)}
                </div>
                <span className="text-xs text-muted-foreground">
                  Restante: R$ {Math.max(remainingHealth, 0).toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gasto Farmácia (Mês Atual)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="bg-teal-100 p-3 rounded-full">
                <Banknote className="h-6 w-6 text-teal-600" />
              </div>
              <div className="flex flex-col">
                <div className="text-2xl font-bold text-teal-700">R$ {spentMeds.toFixed(2)}</div>
                <span className="text-xs text-muted-foreground">
                  Restante: R$ {Math.max(remainingMeds, 0).toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <HRCharts companyId={user?.id} />
    </div>
  )
}
