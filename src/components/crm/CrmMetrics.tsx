import { DollarSign, UserPlus, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CrmMetricsProps {
  metrics: { newClients: number; earnedValues: number; completedTasks: number }
  loading: boolean
}

export function CrmMetrics({ metrics, loading }: CrmMetricsProps) {
  const cards = [
    {
      label: 'Valores Ganhos',
      value: loading
        ? '...'
        : `R$ ${metrics.earnedValues.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      trend: '+12.5%',
      trendUp: true,
      color: 'emerald',
    },
    {
      label: 'Novos Clientes',
      value: loading ? '...' : String(metrics.newClients),
      icon: UserPlus,
      trend: '+8.2%',
      trendUp: true,
      color: 'blue',
    },
    {
      label: 'Tarefas Concluídas',
      value: loading ? '...' : String(metrics.completedTasks),
      icon: CheckCircle2,
      trend: '-3.1%',
      trendUp: false,
      color: 'purple',
    },
  ]

  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-600',
    blue: 'bg-blue-500/10 text-blue-600',
    purple: 'bg-purple-500/10 text-purple-600',
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="glass-card p-5 flex items-center justify-between transition-all duration-200 hover:-translate-y-1 hover:scale-[1.02]"
        >
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="text-2xl font-bold">{card.value}</p>
            <div
              className={cn(
                'inline-flex items-center gap-1 text-xs font-medium',
                card.trendUp ? 'text-emerald-600' : 'text-red-500',
              )}
            >
              {card.trendUp ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {card.trend}
            </div>
          </div>
          <div
            className={cn(
              'w-12 h-12 rounded-2xl flex items-center justify-center',
              colorMap[card.color],
            )}
          >
            <card.icon className="h-6 w-6" />
          </div>
        </div>
      ))}
    </div>
  )
}
