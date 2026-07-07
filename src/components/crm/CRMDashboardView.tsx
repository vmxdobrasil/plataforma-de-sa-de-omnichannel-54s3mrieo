import { useState } from 'react'
import { DollarSign, UserPlus, CheckCircle, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

const interactionColors = [
  'bg-emerald-500/15 border-emerald-500/25 text-emerald-200',
  'bg-blue-500/15 border-blue-500/25 text-blue-200',
  'bg-yellow-500/15 border-yellow-500/25 text-yellow-200',
  'bg-purple-500/15 border-purple-500/25 text-purple-200',
  'bg-rose-500/15 border-rose-500/25 text-rose-200',
  'bg-cyan-500/15 border-cyan-500/25 text-cyan-200',
]

function getDealValue(lead: any): number {
  if (lead.type === 'company' && lead.employee_count) return lead.employee_count * 100
  return 500
}

export function CRMDashboardView({ leads, loading }: { leads: any[]; loading: boolean }) {
  const [funnelMode, setFunnelMode] = useState<'weighted' | 'total'>('total')

  const convertedLeads = leads.filter((l) => l.status === 'converted')
  const totalWon = convertedLeads.reduce((sum, l) => sum + getDealValue(l), 0)
  const now = new Date()
  const newThisMonth = leads.filter((l) => {
    const d = new Date(l.created)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  const metrics = [
    {
      label: 'Valores Ganhos',
      value: `R$ ${totalWon.toLocaleString('pt-BR')}`,
      icon: DollarSign,
      color: 'text-emerald-400',
      badge: '+12%',
    },
    {
      label: 'Novos Clientes',
      value: String(newThisMonth),
      icon: UserPlus,
      color: 'text-blue-400',
      badge: '+5%',
    },
    {
      label: 'Tarefas Concluídas',
      value: String(convertedLeads.length),
      icon: CheckCircle,
      color: 'text-purple-400',
      badge: '100%',
    },
  ]

  const funnelStages = [
    {
      name: 'Qualificação',
      leads: leads.filter((l) => l.status === 'pending'),
      probability: 0.25,
      color: '160',
    },
    {
      name: 'Proposta de Valor',
      leads: leads.filter((l) => l.status === 'contacted'),
      probability: 0.5,
      color: '190',
    },
    {
      name: 'Negociação',
      leads: leads.filter((l) => l.status === 'converted'),
      probability: 1.0,
      color: '150',
    },
  ]

  const maxCount = Math.max(...funnelStages.map((s) => s.leads.length), 1)
  const recentInteractions = leads.slice(0, 6)

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="flex items-center justify-between backdrop-blur-xl bg-white/5 border border-white/10 rounded-full px-6 py-4 hover:scale-105 transition-transform duration-300"
          >
            <div className="flex items-center gap-3">
              <div className={cn('p-2.5 rounded-2xl bg-white/5', m.color)}>
                <m.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-white/50">{m.label}</p>
                <p className="text-lg font-bold text-white">{loading ? '...' : m.value}</p>
              </div>
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300">
              {m.badge}
            </span>
          </div>
        ))}
      </div>

      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-400" /> Funil de Vendas
          </h2>
          <div className="flex gap-1 bg-white/5 rounded-full p-1">
            {(['total', 'weighted'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFunnelMode(mode)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                  funnelMode === mode
                    ? 'bg-emerald-500 text-white'
                    : 'text-white/50 hover:text-white',
                )}
              >
                {mode === 'total' ? 'Total' : 'Ponderado'}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {funnelStages.map((stage) => {
            const total = stage.leads.reduce((sum, l) => sum + getDealValue(l), 0)
            const value = funnelMode === 'weighted' ? total * stage.probability : total
            const widthPct = (stage.leads.length / maxCount) * 100
            return (
              <div key={stage.name} className="flex items-center gap-4">
                <div className="w-40 text-sm text-white/70 shrink-0">{stage.name}</div>
                <div className="flex-1 h-12 bg-white/5 rounded-2xl overflow-hidden">
                  <div
                    className="h-full rounded-2xl transition-all duration-500 flex items-center justify-end px-4"
                    style={{
                      width: `${Math.max(widthPct, 15)}%`,
                      background: `linear-gradient(90deg, hsl(${stage.color}, 70%, 35%), hsl(${stage.color}, 70%, 50%))`,
                    }}
                  >
                    <span className="text-xs font-medium text-white">
                      {stage.leads.length} leads
                    </span>
                  </div>
                </div>
                <div className="w-32 text-right text-sm font-bold text-white shrink-0">
                  R$ {value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-white mb-4">Interações Recentes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentInteractions.length === 0 && !loading ? (
            <div className="col-span-full text-center py-8 text-white/40">
              Nenhuma interação recente.
            </div>
          ) : (
            recentInteractions.map((lead, i) => (
              <div
                key={lead.id}
                className={cn(
                  'backdrop-blur-xl border rounded-3xl p-4 hover:-translate-y-1 transition-transform duration-300',
                  interactionColors[i % interactionColors.length],
                )}
              >
                <p className="font-semibold text-sm">{lead.name}</p>
                <p className="text-xs opacity-70 mt-1">{lead.email}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-white/10">
                    {lead.type || 'N/A'}
                  </span>
                  <span className="text-xs opacity-60">
                    {new Date(lead.created).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
