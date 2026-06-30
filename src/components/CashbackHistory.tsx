import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Gift, Coins } from 'lucide-react'
import { getCashbackHistory, getPointsValue } from '@/services/cashback'
import { useAuth } from '@/hooks/use-auth'

export function CashbackHistory() {
  const { user } = useAuth()
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return
      try {
        setHistory(await getCashbackHistory(user.id))
      } catch {
        /* intentionally ignored */
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user?.id])

  const points = user?.loyalty_points || 0
  const moneyValue = getPointsValue(points)

  return (
    <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Gift className="h-5 w-5 text-purple-600" /> Cashback e Pontos V MED
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-purple-500/10 rounded-lg p-4 text-center">
            <Coins className="h-6 w-6 text-purple-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-purple-900">{points}</div>
            <p className="text-xs text-purple-700">Pontos V MED</p>
          </div>
          <div className="bg-emerald-500/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-emerald-700">R$ {moneyValue.toFixed(2)}</div>
            <p className="text-xs text-emerald-700">Valor em Reais</p>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium mb-2">Histórico de Cashback</p>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum cashback recebido ainda.</p>
          ) : (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {history.map((h) => (
                <div key={h.id} className="flex items-center justify-between text-sm border-b pb-2">
                  <div>
                    <Badge className="bg-emerald-500/10 text-emerald-700 border-0">
                      +{h.points_delta} pts
                    </Badge>
                    <span className="ml-2 text-muted-foreground">
                      {new Date(h.created).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">Cashback</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
