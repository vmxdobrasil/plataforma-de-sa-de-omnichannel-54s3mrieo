import { useEffect, useState, useCallback } from 'react'
import {
  MapPin,
  Search as SearchIcon,
  AlertCircle,
  CheckCircle2,
  Stethoscope,
  Award,
  RefreshCcw,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { getProfessionals } from '@/services/users'
import pb from '@/lib/pocketbase/client'

export default function ProfessionalFeed() {
  const [professionals, setProfessionals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const { toast } = useToast()

  const fetchPros = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getProfessionals()
      setProfessionals(data)
    } catch (err) {
      console.error('Error fetching professionals:', err)
      setError('Não foi possível carregar os profissionais no momento.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPros()
  }, [fetchPros])

  const getAvatarUrl = (pro: any) => {
    if (pro.avatar) return pb.files.getUrl(pro, pro.avatar)
    return `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(pro.name || pro.id)}`
  }

  const filteredPros = professionals.filter(
    (p) =>
      (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.specialty && p.specialty.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Profissionais</h1>
        <p className="text-muted-foreground">
          Encontre especialistas em nossa rede de saúde e agende sua consulta
        </p>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou especialidade..."
          className="pl-10 bg-card border-muted-foreground/20"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={loading || !!error}
        />
      </div>

      {error && (
        <Alert
          variant="destructive"
          className="animate-fade-in-up border-destructive/50 bg-destructive/10"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar feed</AlertTitle>
          <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between mt-2">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPros}
              className="bg-background/50 hover:bg-background"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!error && loading && (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                  <Skeleton className="h-20 w-20 rounded-full shrink-0" />
                  <div className="flex-1 space-y-3 w-full">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-full max-w-md" />
                  </div>
                  <div className="w-full sm:w-32 shrink-0">
                    <Skeleton className="h-10 w-full rounded-md" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!error && !loading && filteredPros.length === 0 && (
        <div className="text-center py-16 bg-muted/20 rounded-xl border border-dashed border-muted-foreground/20">
          <Stethoscope className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-medium text-foreground">Nenhum profissional encontrado</h3>
          <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
            Tente ajustar os termos da sua busca para encontrar o especialista que você precisa.
          </p>
        </div>
      )}

      {!error && !loading && filteredPros.length > 0 && (
        <div className="grid gap-4">
          {filteredPros.map((pro) => (
            <Card
              key={pro.id}
              className="overflow-hidden hover:shadow-md transition-all duration-300 animate-fade-in-up"
            >
              <CardContent className="p-0 flex flex-col sm:flex-row">
                <div className="p-6 flex-1 flex flex-col sm:flex-row gap-6">
                  <Avatar className="h-20 w-20 border shadow-sm shrink-0">
                    <AvatarImage src={getAvatarUrl(pro)} alt={pro.name} />
                    <AvatarFallback className="text-lg bg-primary/5 text-primary">
                      {pro.name ? pro.name.substring(0, 2).toUpperCase() : 'PR'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 flex flex-col justify-center space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-lg leading-none">
                        {pro.name || 'Profissional não identificado'}
                      </h3>
                      {pro.is_verified && (
                        <Badge
                          variant="secondary"
                          className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Verificado
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center text-muted-foreground text-sm gap-x-4 gap-y-2">
                      <span className="flex items-center text-foreground font-medium">
                        <Stethoscope className="h-4 w-4 mr-1.5 text-primary/80" />
                        {pro.specialty || 'Especialidade não informada'}
                      </span>

                      {pro.crm_number && (
                        <span className="flex items-center">
                          <Award className="h-4 w-4 mr-1.5" />
                          CRM: {pro.crm_number} {pro.crm_state ? `- ${pro.crm_state}` : ''}
                        </span>
                      )}

                      {(pro.city || pro.state) && (
                        <span className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1.5" />
                          {[pro.city, pro.state].filter(Boolean).join(' - ')}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                      {pro.bio || 'Nenhuma biografia disponível no momento.'}
                    </p>
                  </div>
                </div>

                <div className="bg-muted/10 p-6 sm:w-56 flex flex-col justify-center border-t sm:border-t-0 sm:border-l gap-3 shrink-0">
                  <Button
                    className="w-full shadow-sm"
                    onClick={() =>
                      toast({
                        title: 'Funcionalidade em desenvolvimento',
                        description:
                          'O perfil detalhado e o agendamento estarão disponíveis em breve.',
                      })
                    }
                  >
                    Ver Perfil
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
