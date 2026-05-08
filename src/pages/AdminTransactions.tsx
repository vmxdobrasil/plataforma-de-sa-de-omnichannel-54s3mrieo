import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Search, ReceiptText, ArrowUpDown } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState('-created')
  const [loading, setLoading] = useState(true)

  const loadTransactions = async () => {
    try {
      setLoading(true)
      const res = await pb.collection('benefit_transactions').getList(1, 100, {
        sort: sortOrder,
        expand: 'employee_id,company_id',
      })

      let items = res.items
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase()
        items = items.filter(
          (t) =>
            t.description?.toLowerCase().includes(lowerSearch) ||
            t.expand?.employee_id?.name?.toLowerCase().includes(lowerSearch) ||
            t.expand?.company_id?.name?.toLowerCase().includes(lowerSearch),
        )
      }
      setTransactions(items)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar transações.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTransactions()
  }, [searchTerm, sortOrder])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500 hover:bg-green-600">Confirmado</Badge>
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>
      case 'refunded':
        return <Badge variant="outline">Reembolsado</Badge>
      default:
        return <Badge variant="outline">{status || 'Concluído'}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ReceiptText className="h-8 w-8 text-primary" /> Transações (Master Admin)
          </h1>
          <p className="text-muted-foreground mt-1">
            Visão global de todas as transações de benefícios na plataforma.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descrição, funcionário ou empresa..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-[220px]">
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger>
              <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="-created">Mais recentes primeiro</SelectItem>
              <SelectItem value="created">Mais antigos primeiro</SelectItem>
              <SelectItem value="-amount">Maior valor</SelectItem>
              <SelectItem value="+amount">Menor valor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Funcionário</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Nenhuma transação encontrada.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="whitespace-nowrap">
                    {new Date(t.created).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{t.description || '-'}</TableCell>
                  <TableCell>{t.expand?.company_id?.name || '-'}</TableCell>
                  <TableCell>{t.expand?.employee_id?.name || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {t.category?.replace('_', ' ') || '-'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {t.type === 'credit' ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-0">
                        Crédito
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-0">
                        Débito
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(t.payment_status)}</TableCell>
                  <TableCell className="text-right font-bold whitespace-nowrap">
                    <span className={t.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}>
                      {t.type === 'credit' ? '+' : '-'} R$ {t.amount?.toFixed(2)}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
