import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Stethoscope, Users, Pill, Shield, CheckCircle2 } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    companies: 0,
    professionals: 0,
    patients: 0,
    pharmacies: 0,
    totalTransactions: 0,
  })
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [users, transactions] = await Promise.all([
          pb.collection('users').getFullList({ fields: 'role' }),
          pb
            .collection('benefit_transactions')
            .getList(1, 10, { sort: '-created', expand: 'employee_id,company_id' }),
        ])

        const counts = users.reduce((acc: any, u: any) => {
          acc[u.role] = (acc[u.role] || 0) + 1
          return acc
        }, {})

        setStats({
          companies: counts.company || 0,
          professionals: counts.professional || 0,
          patients: counts.patient || 0,
          pharmacies: counts.pharmacy || 0,
          totalTransactions: transactions.totalItems,
        })

        setRecentTransactions(transactions.items)
      } catch (err) {
        console.error(err)
      }
    }

    if (user?.role === 'medical_director') {
      fetchStats()
    }
  }, [user])

  const isPartner = ['valterpmendonca@gmail.com', 'victor@vmx.com.br'].includes(user?.email || '')

  return (
    <div className="space-y-6 pb-10 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />V MED BRASIL ADMIN
          </h1>
          <p className="text-muted-foreground mt-2">Gestão global administrativa da plataforma.</p>
        </div>
        {isPartner && (
          <Badge
            variant="secondary"
            className="bg-primary/10 text-primary border-primary/20 px-4 py-1.5 text-sm"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Acesso Total Partner
          </Badge>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-blue-50/50 border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Empresas</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{stats.companies}</div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50/50 border-emerald-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-900">Profissionais</CardTitle>
            <Stethoscope className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">{stats.professionals}</div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50/50 border-purple-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-900">Pacientes</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">{stats.patients}</div>
          </CardContent>
        </Card>
        <Card className="bg-orange-50/50 border-orange-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-900">Farmácias</CardTitle>
            <Pill className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">{stats.pharmacies}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      Nenhuma transação encontrada.
                    </TableCell>
                  </TableRow>
                )}
                {recentTransactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(t.created).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>{t.expand?.company_id?.name || 'N/A'}</TableCell>
                    <TableCell>{t.expand?.employee_id?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          t.type === 'credit'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }
                      >
                        {t.type === 'credit' ? 'Crédito' : 'Débito'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      R$ {t.amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
