import { useEffect, useState } from 'react'
import {
  Search as SearchIcon,
  Stethoscope,
  Loader2,
  Filter,
  ShieldAlert,
  MapPin,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { SearchResultCard } from '@/components/SearchResultCard'

const sanitize = (str: string) => str.replace(/["\\]/g, '')

export default function Search() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [query, setQuery] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all')
  const [city, setCity] = useState('')
  const [stateCode, setStateCode] = useState('')
  const [onlyVerified, setOnlyVerified] = useState(false)

  const [specialties, setSpecialties] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isAdmin = user?.role === 'medical_director' || user?.role === 'admin'

  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const res = await pb.collection('medical_specialties').getFullList({ sort: 'name' })
        setSpecialties(res)
      } catch (err) {
        console.error('Error fetching specialties:', err)
      }
    }
    fetchSpecialties()
  }, [])

  useEffect(() => {
    const search = async () => {
      setLoading(true)
      setError(null)
      try {
        const safeQuery = sanitize(query)
        let matchedSpecialties: string[] = []

        if (safeQuery && safeQuery.length >= 2) {
          const specRes = await pb.collection('medical_specialties').getFullList({
            filter: `name ~ "${safeQuery}" || keywords ~ "${safeQuery}" || symptoms ~ "${safeQuery}"`,
          })
          matchedSpecialties = specRes.map((s) => s.name)
        }

        let filterParts = []

        if (selectedRole !== 'all') {
          filterParts.push(`role = "${sanitize(selectedRole)}"`)
        } else {
          filterParts.push(`(role = "professional" || role = "pharmacy" || role = "laboratory")`)
        }

        if (safeQuery && safeQuery.length >= 2) {
          let qFilter = `(name ~ "${safeQuery}" || crm_number ~ "${safeQuery}" || document_id ~ "${safeQuery}" || specialty ~ "${safeQuery}")`
          if (matchedSpecialties.length > 0) {
            const specFilters = matchedSpecialties
              .map((s) => `specialty ~ "${sanitize(s)}"`)
              .join(' || ')
            qFilter = `(${qFilter} || ${specFilters})`
          }
          filterParts.push(qFilter)
        }

        if (selectedSpecialty !== 'all') {
          filterParts.push(`specialty ~ "${sanitize(selectedSpecialty)}"`)
        }

        if (city && city.length >= 2) {
          filterParts.push(`city ~ "${sanitize(city)}"`)
        }

        if (stateCode && stateCode.length === 2) {
          filterParts.push(`state ~ "${sanitize(stateCode).toUpperCase()}"`)
        }

        if (onlyVerified) filterParts.push(`is_verified = true`)
        if (!isAdmin) filterParts.push(`is_blocked != true`)

        const filter = filterParts.join(' && ')

        const res = await pb.collection('users').getList(1, 50, { filter, sort: 'name' })
        setResults(res.items || [])
      } catch (err: any) {
        if (err.name !== 'AbortError' && !err.isAbort) {
          console.error(err)
          setError('Ocorreu um erro ao carregar a lista. Por favor, tente novamente.')
        }
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(search, 500)
    return () => clearTimeout(timeoutId)
  }, [query, selectedRole, selectedSpecialty, city, stateCode, onlyVerified, isAdmin])

  const toggleStatus = async (id: string, field: 'is_verified' | 'is_blocked', val: boolean) => {
    try {
      await pb.collection('users').update(id, { [field]: !val })
      setResults((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: !val } : r)))
      toast({ title: 'Status atualizado com sucesso.' })
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao atualizar', variant: 'destructive' })
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Guia Saúde</h1>
        <p className="text-muted-foreground mt-1">
          Busque e gerencie profissionais de saúde, farmácias e laboratórios.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CRM, sintomas, especialidade..."
              className="pl-10 h-12 text-lg bg-card"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
            )}
          </div>

          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="h-12 sm:w-[200px] bg-card">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Parceiros</SelectItem>
              <SelectItem value="professional">Profissionais</SelectItem>
              <SelectItem value="pharmacy">Farmácias</SelectItem>
              <SelectItem value="laboratory">Laboratórios</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
            <SelectTrigger className="bg-card">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Especialidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Especialidades</SelectItem>
              {specialties.map((s) => (
                <SelectItem key={s.id} value={s.name || s.id}>
                  {s.name || 'Desconhecido'}{' '}
                  {s.category && (
                    <span className="text-muted-foreground text-xs ml-1">({s.category})</span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cidade"
              className="pl-9 bg-card"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

          <div className="flex gap-4">
            <Input
              placeholder="UF (SP)"
              className="bg-card uppercase w-20"
              maxLength={2}
              value={stateCode}
              onChange={(e) => setStateCode(e.target.value)}
            />
            <div className="flex items-center gap-2 bg-card px-3 rounded-md border flex-1">
              <Checkbox
                id="verified"
                checked={onlyVerified}
                onCheckedChange={(c) => setOnlyVerified(c === true)}
              />
              <Label htmlFor="verified" className="text-sm cursor-pointer whitespace-nowrap">
                Só Verificados
              </Label>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-6 flex flex-col items-center text-center text-destructive">
            <ShieldAlert className="h-10 w-10 mb-2 opacity-80" />
            <p className="font-medium">{error}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {loading && results.length === 0 ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <Skeleton className="h-14 w-14 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-1/3" />
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !loading && results.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
              <Stethoscope className="h-12 w-12 mx-auto mb-4 opacity-20" />
              Nenhum parceiro encontrado com os filtros atuais.
            </div>
          ) : (
            <div className="grid gap-4">
              {results.map((r) => (
                <ErrorBoundary key={r.id}>
                  <SearchResultCard r={r} isAdmin={isAdmin} onToggleStatus={toggleStatus} />
                </ErrorBoundary>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
