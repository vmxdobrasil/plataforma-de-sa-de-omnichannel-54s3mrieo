import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Target, Trophy } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { getPatientHealthGoals, completeHealthGoal } from '@/services/health_goals'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

export function HealthGoals({ patientId }: { patientId: string }) {
  const { user } = useAuth()
  const [goals, setGoals] = useState<any[]>([])

  const loadData = async () => {
    if (!patientId) return
    try {
      const data = await getPatientHealthGoals(patientId)
      setGoals(data)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    loadData()
  }, [patientId])

  useRealtime('health_goals', () => loadData())

  const handleComplete = async (id: string) => {
    try {
      await completeHealthGoal(id)
      toast.success('Meta concluída! Pontos adicionados.')
    } catch (error) {
      toast.error('Erro ao completar meta.')
    }
  }

  const completedPoints = goals
    .filter((g) => g.status === 'completed')
    .reduce((acc, g) => acc + g.points_reward, 0)
  const pendingGoals = goals.filter((g) => g.status === 'pending')
  const completedGoals = goals.filter((g) => g.status === 'completed')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" /> Minhas Metas e Gamificação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-brandAccent/10 border border-brandAccent/30 rounded-2xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-brandAccent">Pontos Ganhos: {completedPoints}</span>
            <Trophy className="h-5 w-5 text-brandAccent" />
          </div>
          <Progress
            value={Math.min((completedPoints / 500) * 100, 100)}
            className="h-3 bg-muted [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-chart-2"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Complete 500 pontos para resgatar uma recompensa especial!
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
            <Target className="h-4 w-4" /> Metas Ativas
          </h3>
          {pendingGoals.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma meta ativa no momento.</p>
          ) : (
            pendingGoals.map((g) => (
              <div
                key={g.id}
                className="border p-3 rounded-lg flex items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{g.title}</span>
                    <Badge
                      variant="secondary"
                      className="bg-brandAccent/20 text-brandAccent text-[10px]"
                    >
                      +{g.points_reward} pts
                    </Badge>
                  </div>
                  {g.description && (
                    <p className="text-xs text-muted-foreground">{g.description}</p>
                  )}
                </div>
                {user?.id === patientId && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                    onClick={() => handleComplete(g.id)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Concluir
                  </Button>
                )}
              </div>
            ))
          )}
        </div>

        {completedGoals.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground">Concluídas Recentemente</h3>
            {completedGoals.slice(0, 3).map((g) => (
              <div
                key={g.id}
                className="bg-muted p-3 rounded-lg flex items-center justify-between opacity-70"
              >
                <div>
                  <span className="font-semibold text-sm line-through">{g.title}</span>
                </div>
                <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5">
                  Concluído
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
