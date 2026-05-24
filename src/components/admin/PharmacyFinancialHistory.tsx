import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function PharmacyFinancialHistory({ partner }: { partner: any }) {
  const [transactions, setTransactions] = useState<any[]>([])
  const [period, setPeriod] = useState('all')

  useEffect(() => {
    loadTransactions()
  }, [partner.id, period])

  const loadTransactions = async () => {
    try {
      let filter = `partner_id = "${partner.id}"`
      if (period === 'month') {
        const date = new Date()
        date.setMonth(date.getMonth() - 1)
        filter += ` && created >= "${date.toISOString()}"`
      } else if (period === 'week') {
        const date = new Date()
        date.setDate(date.getDate() - 7)
        filter += ` && created >= "${date.toISOString()}"`
      }

      const res = await pb.collection('benefit_transactions').getFullList({
        filter,
        sort: '-created',
      })
      setTransactions(res)
    } catch (err) {
      console.error(err)
    }
  }

  const exportCsv = () => {
    const headers = ['Data', 'Descrição', 'Valor Bruto', 'Comissão Vmx', 'Valor Líquido Parceiro']
    const rows = transactions.map((t) => {
      const rate = partner.commission_rate || 0
      const vmxShare = t.amount * (rate / 100)
      const partnerShare = t.amount - vmxShare
      return [
        new Date(t.created).toLocaleString(),
        `"${t.description || ''}"`,
        t.amount.toFixed(2),
        vmxShare.toFixed(2),
        partnerShare.toFixed(2),
      ]
    })
    const csv = [headers, ...rows].map((e) => e.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `financeiro_${partner.name || 'parceiro'}.csv`
    link.click()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-muted/50 p-2 rounded-lg">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px] bg-background">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo o período</SelectItem>
            <SelectItem value="month">Último Mês</SelectItem>
            <SelectItem value="week">Última Semana</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={exportCsv} variant="outline" size="sm" className="bg-background">
          <Download className="h-4 w-4 mr-2" /> Exportar CSV
        </Button>
      </div>

      <div className="rounded-md border h-[400px] overflow-y-auto bg-card">
        <Table>
          <TableHeader className="bg-muted/50 sticky top-0 z-10">
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Valor Bruto</TableHead>
              <TableHead className="text-right">
                Comissão Vmx ({partner.commission_rate || 0}%)
              </TableHead>
              <TableHead className="text-right">Líquido</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((t) => {
              const rate = partner.commission_rate || 0
              const vmxShare = t.amount * (rate / 100)
              const partnerShare = t.amount - vmxShare
              return (
                <TableRow key={t.id}>
                  <TableCell className="text-muted-foreground text-xs">
                    {new Date(t.created).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-medium">{t.description}</TableCell>
                  <TableCell className="text-right">R$ {t.amount.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-red-500">
                    - R$ {vmxShare.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right text-green-600 font-bold">
                    R$ {partnerShare.toFixed(2)}
                  </TableCell>
                </TableRow>
              )
            })}
            {transactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhuma transação encontrada no período.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
