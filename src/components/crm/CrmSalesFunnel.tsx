import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Filter } from 'lucide-react'

interface CrmSalesFunnelProps {
  data: { label: string; value: number; count: number; color: string }[]
  loading: boolean
}

export function CrmSalesFunnel({ data, loading }: CrmSalesFunnelProps) {
  const [weighted, setWeighted] = useState(true)
  const weights = [0.3, 0.5, 0.8]
  const total = data.reduce((sum, s, i) => sum + (weighted ? s.value * weights[i] : s.value), 0)

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold">Pipeline B2B</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Valor:</span>
          <span className="text-lg font-bold text-primary">
            {loading ? '...' : `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          </span>
          <button
            onClick={() => setWeighted(!weighted)}
            className={cn(
              'ml-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors',
              weighted ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
            )}
          >
            {weighted ? 'Ponderado' : 'Total'}
          </button>
        </div>
      </div>
      <div className="space-y-4">
        {data.map((stage, i) => {
          const displayValue = weighted ? stage.value * weights[i] : stage.value
          const percentage = total > 0 ? (displayValue / total) * 100 : 0
          return (
            <div key={stage.label}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                  <span className="text-sm font-medium">{stage.label}</span>
                  <span className="text-xs text-muted-foreground">({stage.count} leads)</span>
                </div>
                <span className="text-sm font-bold">
                  R$ {displayValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </span>
              </div>
              <div className="h-3 rounded-full bg-muted/50 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%`, backgroundColor: stage.color }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
