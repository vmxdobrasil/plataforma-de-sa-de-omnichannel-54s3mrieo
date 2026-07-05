import { Phone, Mail, Building2, MapPin, Calendar, Globe, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface CrmProfilePanelProps {
  lead: any | null
}

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

export function CrmProfilePanel({ lead }: CrmProfilePanelProps) {
  if (!lead) {
    return (
      <div className="glass-card p-6 sticky top-0 h-fit text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-3">
          <Building2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Selecione um lead para ver detalhes</p>
      </div>
    )
  }

  const status = statusConfig[lead.status] || statusConfig.pending
  const meta = lead.metadata || {}

  return (
    <div className="glass-card p-5 sticky top-0 h-fit space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-primary font-bold">
            {lead.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-sm">{lead.name}</h3>
            <p className="text-xs text-muted-foreground">
              {meta.segment || lead.type || 'Empresa'}
            </p>
          </div>
        </div>
        <Badge className={status.className} variant="outline">
          {status.label}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button size="sm" variant="outline" className="rounded-xl">
          <Phone className="h-3.5 w-3.5 mr-1" /> Ligar
        </Button>
        <Button size="sm" variant="outline" className="rounded-xl">
          <Mail className="h-3.5 w-3.5 mr-1" /> Email
        </Button>
        <Button size="sm" variant="outline" className="rounded-xl">
          <MessageSquare className="h-3.5 w-3.5 mr-1" /> Mensagem
        </Button>
        <Button size="sm" variant="outline" className="rounded-xl">
          <Calendar className="h-3.5 w-3.5 mr-1" /> Reunião
        </Button>
      </div>

      <div className="space-y-2 pt-2 border-t border-border/30">
        <div className="flex items-center gap-2 text-xs">
          <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="truncate">{lead.email}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{lead.phone || '—'}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{lead.tax_id || '—'}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Origem: {meta.source || '—'}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Funcionários: {lead.employee_count || '—'}</span>
        </div>
      </div>

      {lead.benefit_intention && (
        <div className="pt-2 border-t border-border/30">
          <p className="text-xs font-semibold mb-1">Intenção de Benefício</p>
          <p className="text-xs text-muted-foreground">{lead.benefit_intention}</p>
        </div>
      )}
    </div>
  )
}
