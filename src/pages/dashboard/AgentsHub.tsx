import { useEffect, useState } from 'react'
import { getProducts, getSubscriptions } from '@/services/ecosystem'
import { useAuth } from '@/hooks/use-auth'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bot, ExternalLink, Settings } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AgentsHub() {
  const [agents, setAgents] = useState<any[]>([])
  const [activeSubs, setActiveSubs] = useState<Set<string>>(new Set())
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      Promise.all([getProducts(), getSubscriptions(user.id)]).then(([prods, subs]) => {
        const agentProducts = prods.filter((p) => p.category === 'agent')
        const activeIds = new Set(
          subs.filter((s) => s.status === 'active').map((s) => s.product_id),
        )
        setAgents(agentProducts)
        setActiveSubs(activeIds)
      })
    }
  }, [user])

  const getAgentLink = (name: string) => {
    if (name.includes('Social AI')) return '/dashboard/social-ai'
    if (name.includes('Scribe')) return '/dashboard/scribe'
    return '#'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hub de Agentes IA</h1>
          <p className="text-muted-foreground">
            Gerencie e acesse seus assistentes de inteligência artificial.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/dashboard/brand-kit">
            <Settings className="mr-2 h-4 w-4" /> Brand Kit
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => {
          const isActive = activeSubs.has(agent.id)
          return (
            <Card key={agent.id} className={`flex flex-col ${!isActive && 'opacity-70'}`}>
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Bot className="h-6 w-6 text-primary" />
                  </div>
                  {isActive ? (
                    <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                      Ativo
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Inativo</Badge>
                  )}
                </div>
                <CardTitle>{agent.name}</CardTitle>
                <CardDescription>{agent.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                {isActive ? (
                  <p className="text-sm text-muted-foreground">
                    Pronto para uso. O agente está configurado e ativo na sua conta.
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Requer assinatura. Visite o marketplace para ativar este agente.
                  </p>
                )}
              </CardContent>
              <CardFooter>
                {isActive ? (
                  <Button className="w-full" asChild>
                    <Link to={getAgentLink(agent.name)}>
                      Abrir Ferramenta <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/dashboard/marketplace">Assinar agora</Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
