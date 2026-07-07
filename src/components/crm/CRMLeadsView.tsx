import { Plus, Mail, Phone, Building2, Calendar, Tag, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'Pendente',
    className: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  },
  contacted: { label: 'Contatado', className: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  converted: {
    label: 'Convertido',
    className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  rejected: { label: 'Rejeitado', className: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
}

interface CRMLeadsViewProps {
  leads: any[]
  loading: boolean
  selectedLead: any
  onSelectLead: (lead: any) => void
  onNewLead: () => void
}

export function CRMLeadsView({
  leads,
  loading,
  selectedLead,
  onSelectLead,
  onNewLead,
}: CRMLeadsViewProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-4 animate-fade-in-up">
      <div className="flex-1 backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-4 overflow-hidden min-w-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Leads B2B</h2>
          <Button
            size="sm"
            className="bg-emerald-500 hover:bg-emerald-600 rounded-full"
            onClick={onNewLead}
          >
            <Plus className="h-4 w-4 mr-1" /> Novo Lead
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/50">Empresa</TableHead>
                <TableHead className="text-white/50">Contato</TableHead>
                <TableHead className="text-white/50">Email</TableHead>
                <TableHead className="text-white/50">Segmento</TableHead>
                <TableHead className="text-white/50">Origem</TableHead>
                <TableHead className="text-white/50">Status</TableHead>
                <TableHead className="text-white/50">Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-white/40" />
                  </TableCell>
                </TableRow>
              ) : leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-white/40">
                    Nenhum lead encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => (
                  <TableRow
                    key={lead.id}
                    onClick={() => onSelectLead(lead)}
                    className={cn(
                      'border-white/5 cursor-pointer transition-colors',
                      selectedLead?.id === lead.id ? 'bg-emerald-500/10' : 'hover:bg-white/5',
                    )}
                  >
                    <TableCell className="font-medium text-white">{lead.name}</TableCell>
                    <TableCell className="text-white/70">{lead.phone || '-'}</TableCell>
                    <TableCell className="text-white/70">{lead.email}</TableCell>
                    <TableCell className="text-white/70">
                      {lead.benefit_intention || lead.type || '-'}
                    </TableCell>
                    <TableCell className="text-white/70">{lead.type || '-'}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'text-xs px-2 py-1 rounded-full border',
                          statusConfig[lead.status]?.className || statusConfig.pending.className,
                        )}
                      >
                        {statusConfig[lead.status]?.label || lead.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-white/50 text-sm">
                      {new Date(lead.created).toLocaleDateString('pt-BR')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="lg:w-80 shrink-0 backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 lg:sticky lg:top-28 lg:self-start">
        {selectedLead ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-white">{selectedLead.name}</p>
                <p className="text-xs text-white/50">{selectedLead.type || 'N/A'}</p>
              </div>
            </div>
            <div className="space-y-2 pt-4 border-t border-white/10">
              {selectedLead.email && (
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <Mail className="h-4 w-4 text-white/40" />
                  {selectedLead.email}
                </div>
              )}
              {selectedLead.phone && (
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <Phone className="h-4 w-4 text-white/40" />
                  {selectedLead.phone}
                </div>
              )}
              {selectedLead.tax_id && (
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <Tag className="h-4 w-4 text-white/40" />
                  {selectedLead.tax_id}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-white/70">
                <Calendar className="h-4 w-4 text-white/40" />
                {new Date(selectedLead.created).toLocaleDateString('pt-BR')}
              </div>
            </div>
            {selectedLead.benefit_intention && (
              <div className="pt-4 border-t border-white/10">
                <p className="text-xs text-white/40 mb-1">Intenção de Benefício</p>
                <p className="text-sm text-white/70">{selectedLead.benefit_intention}</p>
              </div>
            )}
            {selectedLead.employee_count ? (
              <div className="pt-4 border-t border-white/10">
                <p className="text-xs text-white/40 mb-1">Funcionários</p>
                <p className="text-sm text-white/70">{selectedLead.employee_count}</p>
              </div>
            ) : null}
            <div className="pt-4 border-t border-white/10">
              <span
                className={cn(
                  'text-xs px-3 py-1.5 rounded-full border inline-block',
                  statusConfig[selectedLead.status]?.className || statusConfig.pending.className,
                )}
              >
                {statusConfig[selectedLead.status]?.label || selectedLead.status}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-white/40">
            <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Selecione um lead para ver detalhes</p>
          </div>
        )}
      </div>
    </div>
  )
}
