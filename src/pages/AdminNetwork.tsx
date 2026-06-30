import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { MapPin, Store, Download, TrendingUp, Pill, TestTube } from 'lucide-react'
import { useRealtime } from '@/hooks/use-realtime'
import { AdminHeader } from '@/components/admin/AdminHeader'

export default function AdminNetwork() {
  const [partners, setPartners] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const loadData = async () => {
    try {
      const [partnerList, txList] = await Promise.all([
        pb.collection('users').getFullList({
          filter: 'role = "pharmacy" || role = "laboratory"',
          sort: '-created',
        }),
        pb.collection('benefit_transactions').getFullList({
          sort: '-created',
          expand: 'partner_id,employee_id',
        }),
      ])
      setPartners(partnerList)
      setTransactions(txList.filter((t: any) => t.partner_id))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('users', () => loadData())
  useRealtime('benefit_transactions', () => loadData())

  const filtered = partners.filter((p) => {
    if (filter !== 'all' && p.role !== filter) return false
    if (search) {
      const s = search.toLowerCase()
      return p.name?.toLowerCase().includes(s) || p.business_name?.toLowerCase().includes(s)
    }
    return true
  })

  const repasses = partners
    .map((p) => {
      const pTx = transactions.filter((t) => t.partner_id === p.id)
      const total = pTx.reduce((s, t) => s + (t.amount || 0), 0)
      const rate = p.commission_rate || 0
      return {
        partner: p,
        count: pTx.length,
        total,
        commission: (total * rate) / 100,
        net: total - (total * rate) / 100,
      }
    })
    .filter((r) => r.count > 0)
    .sort((a, b) => b.total - a.total)

  const exportCsv = () => {
    const headers = ['Parceiro', 'Tipo', 'Transações', 'Valor Bruto', 'Comissão VMX', 'Líquido']
    const rows = repasses.map((r) =>
      [
        `"${r.partner.name || r.partner.business_name}"`,
        r.partner.role === 'pharmacy' ? 'Farmácia' : 'Laboratório',
        r.count,
        r.total.toFixed(2),
        r.commission.toFixed(2),
        r.net.toFixed(2),
      ].join(','),
    )
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], {
      type: 'text/csv;charset=utf-8;',
    })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'repasses_rede_credenciada.csv'
    link.click()
  }

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      <AdminHeader
        title="Rede Credenciada"
        description="Visão geral da rede de parceiros e relatório de repasses."
        icon={<MapPin className="h-8 w-8" />}
      />

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-teal-600" />
              <div>
                <p className="text-sm text-muted-foreground">Farmácias</p>
                <p className="text-xl font-bold">
                  {partners.filter((p) => p.role === 'pharmacy').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TestTube className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Laboratórios</p>
                <p className="text-xl font-bold">
                  {partners.filter((p) => p.role === 'laboratory').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm text-muted-foreground">Transações</p>
                <p className="text-xl font-bold">{transactions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Volume Total</p>
                <p className="text-xl font-bold">
                  R$ {transactions.reduce((s, t) => s + (t.amount || 0), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 items-center">
        <Input
          placeholder="Buscar parceiro..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pharmacy">Farmácias</SelectItem>
            <SelectItem value="laboratory">Laboratórios</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <Card key={p.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border">
                  <AvatarImage src={p.avatar ? pb.files.getURL(p, p.avatar) : ''} />
                  <AvatarFallback>
                    <Store className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.business_name}</p>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {p.role === 'pharmacy' ? 'Farmácia' : 'Lab'}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {p.city} - {p.state}
              </div>
              {p.lat && p.lng && (
                <div className="text-[10px] text-muted-foreground/70">
                  Lat: {p.lat.toFixed(4)}, Lng: {p.lng.toFixed(4)}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Relatório de Repasses</h2>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4 mr-2" /> Exportar CSV
          </Button>
        </div>
        <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Parceiro</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-center">Transações</TableHead>
                <TableHead className="text-right">Valor Bruto</TableHead>
                <TableHead className="text-right">Comissão VMX</TableHead>
                <TableHead className="text-right">Líquido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : repasses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum repasse encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                repasses.map((r) => (
                  <TableRow key={r.partner.id}>
                    <TableCell className="font-medium">{r.partner.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {r.partner.role === 'pharmacy' ? 'Farmácia' : 'Laboratório'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{r.count}</TableCell>
                    <TableCell className="text-right">R$ {r.total.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-red-500">
                      - R$ {r.commission.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-emerald-600 font-bold">
                      R$ {r.net.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
