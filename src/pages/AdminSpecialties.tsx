import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export default function AdminSpecialties() {
  const [specialties, setSpecialties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const loadSpecialties = async () => {
    try {
      setLoading(true)
      const filter = searchTerm
        ? `name ~ "${searchTerm}" || keywords ~ "${searchTerm}" || symptoms ~ "${searchTerm}"`
        : ''
      const res = await pb.collection('medical_specialties').getList(1, 50, {
        filter,
        sort: '-priority,name',
      })
      setSpecialties(res.items)
    } catch (error) {
      toast.error('Erro ao carregar especialidades.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSpecialties()
  }, [searchTerm])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Especialidades Médicas</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as especialidades e os sintomas associados disponíveis.
          </p>
        </div>
      </div>

      <div className="bg-primary/20 p-4 rounded-xl border border-primary/20 shadow-sm flex items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, palavra-chave ou sintoma..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-primary/20 [&_th]:text-foreground">
            <TableRow className="hover:bg-transparent">
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Sintomas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : specialties.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Nenhuma especialidade encontrada.
                </TableCell>
              </TableRow>
            ) : (
              specialties.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.category || '-'}</TableCell>
                  <TableCell>{s.priority || '-'}</TableCell>
                  <TableCell className="max-w-[400px] truncate" title={s.symptoms}>
                    {s.symptoms || '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
