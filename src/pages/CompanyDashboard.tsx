import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, Users, Wallet, TrendingDown, FileText, Phone, Mail } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { format } from 'date-fns'

export default function CompanyDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [companyData, setCompanyData] = useState<any>(null)
  const [employeeCount, setEmployeeCount] = useState(0)
  const [monthlyUsage, setMonthlyUsage] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    if (!user?.id) return
    try {
      const company = await pb.collection('users').getOne(user.id)
      setCompanyData(company)

      const employees = await pb.collection('users').getFullList({
        filter: `company_id = "${user.id}" && role = "patient"`,
      })
      setEmployeeCount(employees.length)

      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const transactions = await pb.collection('benefit_transactions').getFullList({
        filter: `company_id = "${user.id}" && created >= "${format(startOfMonth, 'yyyy-MM-dd HH:mm:ss')}" && type = "debit"`,
      })
      setMonthlyUsage(transactions.reduce((sum, t) => sum + (t.amount || 0), 0))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user?.id])
  useRealtime('users', () => loadData())
  useRealtime('benefit_transactions', () => loadData())

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground animate-pulse">Carregando...</p>
      </div>
    )
  }

  if (!companyData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Empresa não encontrada.</p>
      </div>
    )
  }

  const statusMap: Record<
    string,
    { label: string; variant: 'default' | 'secondary' | 'destructive' }
  > = {
    active: { label: 'Ativo', variant: 'default' },
    suspended: { label: 'Suspenso', variant: 'destructive' },
    pending_contract: { label: 'Aguardando Contrato', variant: 'secondary' },
  }
  const status = statusMap[companyData.company_status || 'active'] || statusMap.active

  return (
    <div className="space-y-6 pb-10 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" /> Minha Empresa
        </h1>
        <p className="text-muted-foreground mt-2">Visão geral da conta corporativa e benefícios.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="ds-card ds-card-hover bg-primary/5 border-primary/20 p-2 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Saldo Disponível
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-full">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">
              R$ {(companyData.health_allowance || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Crédito mensal por funcionário</p>
          </CardContent>
        </Card>
        <Card className="ds-card ds-card-hover bg-primary/5 border-primary/20 p-2 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Saldo Farmácia
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-full">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">
              R$ {(companyData.medication_allowance || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Crédito farmácia por funcionário</p>
          </CardContent>
        </Card>
        <Card className="ds-card ds-card-hover bg-orange-50 border-orange-200 p-2 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Uso do Mês
            </CardTitle>
            <div className="p-2 bg-orange-100 rounded-full">
              <TrendingDown className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-orange-600">R$ {monthlyUsage.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-2">Total consumido neste mês</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Dados Cadastrais</CardTitle>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nome Fantasia</p>
              <p className="font-semibold">{companyData.name || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Razão Social</p>
              <p className="font-semibold">{companyData.business_name || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">CNPJ</p>
              <p className="font-semibold">{companyData.tax_id || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tipo de Benefício</p>
              <p className="font-semibold capitalize">
                {(companyData.allowance_type || 'benefit').replace('_', ' ')}
              </p>
            </div>
          </div>

          {(companyData.rh_contact_name ||
            companyData.rh_contact_phone ||
            companyData.rh_contact_email) && (
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">Contato RH</p>
              <div className="flex flex-wrap gap-4">
                {companyData.rh_contact_name && (
                  <span className="text-sm">{companyData.rh_contact_name}</span>
                )}
                {companyData.rh_contact_phone && (
                  <span className="text-sm flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {companyData.rh_contact_phone}
                  </span>
                )}
                {companyData.rh_contact_email && (
                  <span className="text-sm flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {companyData.rh_contact_email}
                  </span>
                )}
              </div>
            </div>
          )}
          {(companyData.finance_contact_name ||
            companyData.finance_contact_phone ||
            companyData.finance_contact_email) && (
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">Contato Financeiro</p>
              <div className="flex flex-wrap gap-4">
                {companyData.finance_contact_name && (
                  <span className="text-sm">{companyData.finance_contact_name}</span>
                )}
                {companyData.finance_contact_phone && (
                  <span className="text-sm flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {companyData.finance_contact_phone}
                  </span>
                )}
                {companyData.finance_contact_email && (
                  <span className="text-sm flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {companyData.finance_contact_email}
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/company/employees')}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold">Colaboradores</p>
              <p className="text-sm text-muted-foreground">{employeeCount} ativos</p>
            </div>
          </CardContent>
        </Card>
        <Card
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/company/transactions')}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold">Relatórios</p>
              <p className="text-sm text-muted-foreground">Extrato de uso</p>
            </div>
          </CardContent>
        </Card>
        <Card
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/settings')}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold">Configurações</p>
              <p className="text-sm text-muted-foreground">Dados da empresa</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
