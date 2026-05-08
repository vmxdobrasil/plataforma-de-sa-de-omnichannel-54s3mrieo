import { useEffect, useState } from 'react'
import {
  Search as SearchIcon,
  Stethoscope,
  Loader2,
  Filter,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

export default function Search() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [query, setQuery] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all')
  const [specialties, setSpecialties] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isAdmin = user?.role === 'medical_director'

  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const res = await pb.collection('medical_specialties').getFullList({
          sort: 'name',
        })
        setSpecialties(res)
      } catch (err) {
        console.error(err)
      }
    }
    fetchSpecialties()
  }, [])

  useEffect(() => {
    const search = async () => {
      setLoading(true)
      setError(null)
      try {
        let filterParts = [`role = "professional"`]

        if (query && query.length >= 2) {
          filterParts.push(
            `(name ~ "${query}" || crm_number ~ "${query}" || specialty ~ "${query}" || document_id ~ "${query}")`,
          )
        }

        if (selectedSpecialty !== 'all') {
          filterParts.push(`specialty ~ "${selectedSpecialty}"`)
        }

        if (!isAdmin) {
          filterParts.push(`is_blocked != true`)
        }

        const filter = filterParts.join(' && ')

        const res = await pb.collection('users').getList(1, 50, {
          filter,
          sort: 'name',
        })

        setResults(res.items)
      } catch (err: any) {
        console.error(err)
        setError(
          'Ocorreu um erro ao carregar a lista de profissionais. Por favor, tente novamente.',
        )
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(search, 500)
    return () => clearTimeout(timeoutId)
  }, [query, selectedSpecialty, isAdmin])

  const toggleStatus = async (
    targetUserId: string,
    field: 'is_verified' | 'is_blocked',
    currentValue: boolean,
  ) => {
    try {
      await pb.collection('users').update(targetUserId, {
        [field]: !currentValue,
      })

      setResults((prev) =>
        prev.map((r) => {
          if (r.id === targetUserId) {
            return { ...r, [field]: !currentValue }
          }
          return r
        }),
      )

      toast({
        title: 'Status atualizado',
        description: `O status do profissional foi atualizado com sucesso.`,
      })
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar o status.',
        variant: 'destructive',
      })
    }
  }

  const getAvatarUrl = (r: any) => {
    if (r.avatar) return pb.files.getURL(r, r.avatar)
    return `https://api.dicebear.com/7.x/notionists/svg?seed=${r.id}`
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Guia Saúde</h1>
        <p className="text-muted-foreground mt-1">
          Busque e gerencie profissionais de saúde e suas especialidades.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CRM, CPF ou especialidade..."
            className="pl-10 h-12 text-lg bg-card"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
          )}
        </div>

        <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
          <SelectTrigger className="h-12 sm:w-[250px] bg-card">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Especialidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Especialidades</SelectItem>
            {specialties.map((s) => (
              <SelectItem key={s.id} value={s.name}>
                {s.name}{' '}
                {s.category && (
                  <span className="text-muted-foreground text-xs ml-1">({s.category})</span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center text-destructive">
            <ShieldAlert className="h-10 w-10 mb-2 opacity-80" />
            <p className="font-medium">{error}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {!loading && results.length === 0 && (
            <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
              <Stethoscope className="h-12 w-12 mx-auto mb-4 opacity-20" />
              Nenhum profissional encontrado com os filtros atuais.
            </div>
          )}

          <div className="grid gap-4">
            {results.map((r) => (
              <Card key={r.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1 w-full">
                    <Avatar className="h-14 w-14 border-2 border-primary/10">
                      <AvatarImage src={getAvatarUrl(r)} />
                      <AvatarFallback>{r.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-lg leading-none truncate">
                          {r.name || 'Sem nome'}
                        </h3>
                        {r.is_verified && (
                          <ShieldCheck
                            className="h-4 w-4 text-green-500"
                            title="Profissional Verificado"
                          />
                        )}
                        {r.is_blocked && (
                          <Badge variant="destructive" className="text-[10px] h-5 px-1.5">
                            Bloqueado
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                        {r.specialty && (
                          <Badge variant="secondary" className="font-normal">
                            {r.specialty}
                          </Badge>
                        )}
                        {r.crm_number && (
                          <span className="text-xs">
                            CRM: {r.crm_number} {r.crm_state && `(${r.crm_state})`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-2 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 mt-4 sm:mt-0">
                      <Button
                        variant={r.is_verified ? 'outline' : 'default'}
                        size="sm"
                        className="flex-1 sm:flex-none h-8 text-xs"
                        onClick={() => toggleStatus(r.id, 'is_verified', r.is_verified)}
                      >
                        {r.is_verified ? (
                          <>
                            <XCircle className="w-3 h-3 mr-1" /> Remover Selo
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Verificar CRM
                          </>
                        )}
                      </Button>
                      <Button
                        variant={r.is_blocked ? 'outline' : 'destructive'}
                        size="sm"
                        className="flex-1 sm:flex-none h-8 text-xs"
                        onClick={() => toggleStatus(r.id, 'is_blocked', r.is_blocked)}
                      >
                        {r.is_blocked ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Desbloquear
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="w-3 h-3 mr-1" /> Bloquear
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
