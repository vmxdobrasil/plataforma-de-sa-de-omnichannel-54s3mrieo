import { useEffect, useState } from 'react'
import { Search as SearchIcon, Building2, Stethoscope, Users, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { Badge } from '@/components/ui/badge'

export default function Search() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const search = async () => {
      if (!query || query.length < 2) {
        setResults([])
        return
      }

      setLoading(true)
      try {
        let filter = `name ~ "${query}" || email ~ "${query}"`

        if (user?.role === 'company') {
          // Company can only search its employees
          filter = `(${filter}) && company_id = "${user.id}"`
        } else if (user?.role === 'patient') {
          // Patient can search professionals
          filter = `(${filter}) && role = "professional"`
        } else if (user?.role === 'medical_director') {
          // Medical director can search anyone
          // no additional role restrictions, keep it broad
        }

        const res = await pb.collection('users').getList(1, 20, {
          filter,
          sort: 'name',
        })

        setResults(res.items)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(search, 500)
    return () => clearTimeout(timeoutId)
  }, [query, user])

  const getAvatarUrl = (r: any) => {
    if (r.avatar) return pb.files.getURL(r, r.avatar)
    return `https://api.dicebear.com/7.x/notionists/svg?seed=${r.id}`
  }

  const getIcon = (role: string) => {
    switch (role) {
      case 'professional':
        return <Stethoscope className="h-4 w-4" />
      case 'company':
        return <Building2 className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'professional':
        return 'Profissional'
      case 'company':
        return 'Empresa'
      case 'patient':
        return 'Paciente'
      case 'medical_director':
        return 'Administrador'
      default:
        return role
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Busca Global</h1>
        <p className="text-muted-foreground mt-1">
          Pesquise no sistema de acordo com suas permissões de acesso.
        </p>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou email..."
          className="pl-10 h-12 text-lg bg-card"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
        )}
      </div>

      {query.length >= 2 && results.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum resultado encontrado para "{query}".
        </div>
      )}

      <div className="grid gap-4">
        {results.map((r) => (
          <Card key={r.id} className="hover:bg-muted/50 transition-colors">
            <CardContent className="p-4 flex items-center gap-4">
              <Avatar className="h-12 w-12 border">
                <AvatarImage src={getAvatarUrl(r)} />
                <AvatarFallback>{r.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-lg leading-none mb-1">{r.name || 'Sem nome'}</h3>
                <p className="text-sm text-muted-foreground">{r.email}</p>
              </div>
              <Badge variant="outline" className="flex items-center gap-1.5 bg-background">
                {getIcon(r.role)}
                {getRoleLabel(r.role)}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
