import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { FileText, Download, PlusCircle } from 'lucide-react'
import { toast } from 'sonner'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { getInvoices, generateInvoice, updateInvoiceStatus } from '@/services/invoices'
import pb from '@/lib/pocketbase/client'

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [generating, setGenerating] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const [invRes, comps] = await Promise.all([
        getInvoices(),
        pb.collection('users').getFullList({ filter: 'role = "company"', sort: 'name' }),
      ])
      setInvoices(invRes.items)
      setCompanies(comps)
    } catch {
      toast.error('Erro ao carregar faturas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleGenerate = async () => {
    if (!selectedCompany || !periodStart || !periodEnd) {
      toast.error('Preencha todos os campos.')
      return
    }
    setGenerating(true)
    try {
      await generateInvoice(selectedCompany, periodStart, periodEnd)
      toast.success('Fatura gerada com sucesso!')
      setDialogOpen(false)
      loadData()
    } catch {
      toast.error('Erro ao gerar fatura.')
    } finally {
      setGenerating(false)
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateInvoiceStatus(id, status as any)
      toast.success('Status atualizado!')
      loadData()
    } catch {
      toast.error('Erro ao atualizar status.')
    }
  }

  const exportInvoice = (inv: any) => {
    const headers = ['Empresa', 'Período Início', 'Período Fim', 'Valor Total', 'Status']
    const row = [
      inv.expand?.company_id?.name || '-',
      inv.billing_period_start,
      inv.billing_period_end,
      inv.total_amount?.toFixed(2),
      inv.status,
    ]
    const csv = [headers, row].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `fatura_${inv.id}.csv`
    link.click()
  }

  const statusBadge = (status: string) => {
    if (status === 'paid')
      return <Badge className="bg-emerald-500 hover:bg-emerald-600">Paga</Badge>
    if (status === 'overdue') return <Badge variant="destructive">Vencida</Badge>
    return <Badge variant="secondary">Em Aberto</Badge>
  }

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      <AdminHeader
        title={
          <>
            <span className="text-primary">Faturamento</span> B2B
          </>
        }
        description="Gestão de faturas corporativas e cobrança mensal."
        icon={<FileText className="h-8 w-8" />}
        className="bg-primary/10 border-primary/30"
        rightContent={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Gerar Fatura
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Gerar Fatura Mensal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Empresa</Label>
                  <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Período Início</Label>
                  <Input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Período Fim</Label>
                  <Input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                  />
                </div>
                <Button onClick={handleGenerate} disabled={generating} className="w-full">
                  {generating ? 'Gerando...' : 'Gerar Fatura'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-primary/20 [&_th]:text-foreground">
              <TableRow className="hover:bg-transparent">
                <TableHead>Empresa</TableHead>
                <TableHead>Período</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhuma fatura encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">
                      {inv.expand?.company_id?.name || '-'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {inv.billing_period_start} a {inv.billing_period_end}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      R$ {(inv.total_amount || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={inv.status}
                        onValueChange={(v) => handleStatusChange(inv.id, v)}
                      >
                        <SelectTrigger className="w-[130px]">
                          {statusBadge(inv.status)}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Em Aberto</SelectItem>
                          <SelectItem value="paid">Paga</SelectItem>
                          <SelectItem value="overdue">Vencida</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => exportInvoice(inv)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
