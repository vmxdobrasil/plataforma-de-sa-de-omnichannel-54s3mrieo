import { useEffect, useState, useCallback } from 'react'
import { Users, Search, Loader2 } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

const sanitize = (str: string) => str.replace(/["\\]/g, '')

const statusConfig: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  pending: { label: 'Pendente', variant: 'secondary' },
  contacted: { label: 'Contatado', variant: 'default' },
  converted: { label: 'Convertido', variant: 'default' },
  rejected: { label: 'Rejeitado', variant: 'destructive' },
}

const typeLabels: Record<string, string> = {
  company: 'Empresa',
  partner: 'Parceiro',
  individual: 'Individual',
  professional: 'Profissional',
}

export default function AdminLeads() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const loadLeads = useCallback(async () => {
    try {
      setLoading(true)
      const parts: string[] = []
      if (filterType !== 'all') parts.push(`type = "${sanitize(filterType)}"`)
      if (filterStatus !== 'all') parts.push(`status = "${sanitize(filterStatus)}"`)
      if (search.trim().length >= 2) {
        const s = sanitize(search.trim())
        parts.push(`(name ~ "${s}" || email ~ "${s}")`)
      }
      const filter = parts.join(' && ')
      const res = await pb.collection('registration_leads').getList(1, 100, {
        filter,
        sort: '-created',
      })
      setLeads(res.items || [])
    } catch {
      toast.error('Erro ao carregar leads.')
    } finally {
      setLoading(false)
    }
  }, [search, filterType, filterStatus])

  useEffect(() => {
    const t = setTimeout(loadLeads, 400)
    return () => clearTimeout(t)
  }, [loadLeads])

  useRealtime('registration_leads', () => {
    loadLeads()
  })

  const updateStatus = async (id: string, status: string) => {
    try {
      await pb.collection('registration_leads').update(id, { status })
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)))
      toast.success('Status atualizado.')
    } catch {
      toast.error('Erro ao atualizar status.')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Leads</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie cadastros de empresas, parceiros e profissionais.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="sm:w-[180px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="company">Empresas</SelectItem>
            <SelectItem value="partner">Parceiros</SelectItem>
            <SelectItem value="professional">Profissionais</SelectItem>
            <SelectItem value="individual">Individual</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="sm:w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="contacted">Contatado</SelectItem>
            <SelectItem value="converted">Convertido</SelectItem>
            <SelectItem value="rejected">Rejeitado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-primary/10 [&_th]:text-foreground">
            <TableRow className="hover:bg-transparent">
              <TableHead>Nome</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Categoria / Especialidade</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  Nenhum lead encontrado.
                </TableCell>
              </TableRow>
            ) : (
              leads.map((l) => {
                const meta = l.metadata || {}
                const isPro = l.type === 'professional'
                return (
                  <TableRow key={l.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">
                      {l.name}
                      {l.tax_id && (
                        <span className="block text-xs text-muted-foreground">{l.tax_id}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{l.email}</span>
                      {l.phone && (
                        <span className="block text-xs text-muted-foreground">{l.phone}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-primary/30 text-primary">
                        {typeLabels[l.type] || l.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {isPro ? (
                        <div>
                          <span className="font-medium">{meta.category || '-'}</span>
                          {meta.specialty && (
                            <span className="block text-xs text-muted-foreground">
                              {meta.specialty}
                            </span>
                          )}
                          {meta.professional_id && (
                            <span className="block text-xs text-muted-foreground">
                              {meta.professional_id}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select value={l.status} onValueChange={(v) => updateStatus(l.id, v)}>
                        <SelectTrigger className="h-8 w-[130px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusConfig).map(([val, cfg]) => (
                            <SelectItem key={val} value={val}>
                              {cfg.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
