import { useState, useEffect, useCallback } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { getCrmLeads, mockLeads } from '@/services/crm'
import { CrmNewLeadModal } from './CrmNewLeadModal'
import { useRealtime } from '@/hooks/use-realtime'
import { toast } from 'sonner'
import { format } from 'date-fns'

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'Pendente',
    className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  },
  contacted: { label: 'Contatado', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  converted: {
    label: 'Convertido',
    className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  },
  rejected: { label: 'Rejeitado', className: 'bg-red-500/10 text-red-600 border-red-500/20' },
}

const typeLabels: Record<string, string> = {
  company: 'Empresa',
  partner: 'Parceiro',
  individual: 'Individual',
  professional: 'Profissional',
}

interface CrmLeadsViewProps {
  searchQuery: string
  onSelectLead: (lead: any) => void
}

export function CrmLeadsView({ searchQuery, onSelectLead }: CrmLeadsViewProps) {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)

  const loadLeads = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getCrmLeads({ status: filterStatus, type: filterType })
      setLeads(res.items?.length ? res.items : mockLeads)
    } catch {
      setLeads(mockLeads)
    } finally {
      setLoading(false)
    }
  }, [filterStatus, filterType])

  useEffect(() => {
    loadLeads()
  }, [loadLeads])
  useRealtime('registration_leads', () => loadLeads())

  const filtered = searchQuery.trim()
    ? leads.filter(
        (l) =>
          l.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.email?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : leads

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-lg font-bold">Gestão de Leads</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[130px] rounded-xl">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="contacted">Contatado</SelectItem>
              <SelectItem value="converted">Convertido</SelectItem>
              <SelectItem value="rejected">Rejeitado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[130px] rounded-xl">
              <SelectValue placeholder="Segmento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Segmentos</SelectItem>
              <SelectItem value="company">Empresas</SelectItem>
              <SelectItem value="partner">Parceiros</SelectItem>
              <SelectItem value="individual">Individual</SelectItem>
              <SelectItem value="professional">Profissional</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setModalOpen(true)} className="rounded-xl bg-brand-gradient">
            <Plus className="h-4 w-4 mr-1" /> Novo Lead
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/30">
              <TableHead>Empresa</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Segmento</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum lead encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((lead) => {
                const st = statusConfig[lead.status] || statusConfig.pending
                const meta = lead.metadata || {}
                return (
                  <TableRow
                    key={lead.id}
                    className="cursor-pointer hover:bg-white/30 dark:hover:bg-white/5 transition-colors border-border/20"
                    onClick={() => onSelectLead(lead)}
                  >
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>
                      <div className="text-xs">{lead.email}</div>
                      <div className="text-xs text-muted-foreground">{lead.phone || '—'}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-primary/20 text-primary">
                        {typeLabels[lead.type] || lead.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{meta.source || '—'}</TableCell>
                    <TableCell>
                      <Badge className={st.className} variant="outline">
                        {st.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {lead.created ? format(new Date(lead.created), 'dd/MM/yyyy') : '—'}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <CrmNewLeadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          loadLeads()
          toast.success('Lead criado com sucesso!')
        }}
      />
    </div>
  )
}
