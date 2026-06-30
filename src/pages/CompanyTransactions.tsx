import { useState, useEffect } from 'react'
import { ReceiptText, Briefcase, Pill, ArrowLeft, Stethoscope, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { getCompanyTransactions } from '@/services/companies'
import { getInvoices } from '@/services/invoices'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function CompanyTransactions() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    if (!user?.id) return
    try {
      const [data, invRes] = await Promise.all([
        getCompanyTransactions(user.id),
        getInvoices(user.id),
      ])
      setTransactions(data)
      setInvoices(invRes.items)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user?.id])

  useRealtime('benefit_transactions', () => {
    loadData()
  })

  if (user?.role !== 'company') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground text-lg">Acesso negado.</p>
      </div>
    )
  }

  const filteredTransactions = transactions.filter((t) => {
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false
    if (typeFilter !== 'all' && t.type !== typeFilter) return false
    return true
  })

  const currentMonthTransactions = transactions.filter(
    (t) => new Date(t.created).getMonth() === new Date().getMonth() && t.type === 'debit',
  )

  const totalSpentHealth = currentMonthTransactions
    .filter((t) => t.category === 'health_service')
    .reduce((acc, t) => acc + t.amount, 0)

  const totalSpentMeds = currentMonthTransactions
    .filter((t) => t.category === 'medication')
    .reduce((acc, t) => acc + t.amount, 0)

  const totalSpentExams = currentMonthTransactions
    .filter((t) => t.category === 'exam')
    .reduce((acc, t) => acc + t.amount, 0)

  const openInvoicesTotal = invoices
    .filter((inv) => inv.status === 'open' || inv.status === 'overdue')
    .reduce((acc, inv) => acc + (inv.total_amount || 0), 0)

  return (
    <div className="space-y-6 pb-10 animate-fade-in-up">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ReceiptText className="h-8 w-8 text-primary" /> Transações de Benefícios
          </h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe o uso dos benefícios corporativos pelos seus colaboradores.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-purple-800">
                <Briefcase className="h-5 w-5" />
                <span className="font-semibold">Uso Saúde (Mês Atual)</span>
              </div>
            </div>
            <div className="flex items-end gap-2 mb-1">
              <span className="text-3xl font-bold text-purple-900">
                R$ {totalSpentHealth.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-teal-50 border-teal-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-teal-800">
                <Pill className="h-5 w-5" />
                <span className="font-semibold">Uso Farmácia (Mês Atual)</span>
              </div>
            </div>
            <div className="flex items-end gap-2 mb-1">
              <span className="text-3xl font-bold text-teal-900">
                R$ {totalSpentMeds.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-blue-800">
                <Stethoscope className="h-5 w-5" />
                <span className="font-semibold">Uso Exames (Mês Atual)</span>
              </div>
            </div>
            <div className="flex items-end gap-2 mb-1">
              <span className="text-3xl font-bold text-blue-900">
                R$ {totalSpentExams.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {invoices.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-amber-800">
                <FileText className="h-5 w-5" />
                <span className="font-semibold">Faturas em Aberto</span>
              </div>
            </div>
            <div className="flex items-end gap-2 mb-3">
              <span className="text-3xl font-bold text-amber-900">
                R$ {openInvoicesTotal.toFixed(2)}
              </span>
              <span className="text-sm text-amber-700 mb-1">saldo devedor</span>
            </div>
            <div className="space-y-2">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between text-sm border-t border-amber-200 pt-2"
                >
                  <span className="text-amber-800">
                    {inv.billing_period_start} a {inv.billing_period_end}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-amber-900">
                      R$ {(inv.total_amount || 0).toFixed(2)}
                    </span>
                    <Badge
                      variant={
                        inv.status === 'paid'
                          ? 'default'
                          : inv.status === 'overdue'
                            ? 'destructive'
                            : 'secondary'
                      }
                    >
                      {inv.status === 'paid'
                        ? 'Paga'
                        : inv.status === 'overdue'
                          ? 'Vencida'
                          : 'Em Aberto'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="pb-4 border-b bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-lg flex items-center gap-2">Histórico Global</CardTitle>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[160px] bg-background">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                <SelectItem value="health_service">Saúde</SelectItem>
                <SelectItem value="medication">Farmácia</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[160px] bg-background">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="credit">Créditos (+)</SelectItem>
                <SelectItem value="debit">Débitos (-)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground animate-pulse">
              Carregando transações...
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <ReceiptText className="h-8 w-8 text-primary opacity-50" />
              </div>
              <h3 className="font-semibold text-lg mb-1">Nenhuma transação encontrada</h3>
              <p className="text-muted-foreground max-w-sm">
                Não há movimentações para exibir com os filtros atuais.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/10 hover:bg-muted/10">
                    <TableHead className="w-[180px]">Data</TableHead>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((t) => (
                    <TableRow key={t.id} className="hover:bg-muted/30">
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(t.created), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="font-medium">
                        {t.expand?.employee_id?.name || 'Desconhecido'}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {t.description ||
                          (t.category === 'medication' ? 'Compra em Farmácia' : 'Uso de Benefício')}
                      </TableCell>
                      <TableCell>
                        {t.category === 'health_service' ? (
                          <Badge
                            variant="outline"
                            className="bg-purple-50 text-purple-700 border-purple-200"
                          >
                            Saúde
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-teal-50 text-teal-700 border-teal-200"
                          >
                            Farmácia
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        <div
                          className={`flex items-center justify-end gap-1 ${t.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}
                        >
                          {t.type === 'credit' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
