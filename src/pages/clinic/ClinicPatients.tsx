import { useEffect, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PatientFormDialog } from '@/components/clinic/PatientFormDialog'
import { getPatients, updatePatientStatus } from '@/services/clinic'
import { useRealtime } from '@/hooks/use-realtime'
import { toast } from 'sonner'

export default function ClinicPatients() {
  const [patients, setPatients] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editPatient, setEditPatient] = useState<any>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await getPatients(page, search)
      setPatients(res.items)
      setTotalPages(Math.ceil(res.totalItems / 20))
    } catch {
      /* intentionally ignored */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [page])
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1)
      load()
    }, 300)
    return () => clearTimeout(t)
  }, [search])
  useRealtime('users', () => load())

  const handleStatus = async (id: string, status: string) => {
    try {
      await updatePatientStatus(id, status)
      toast.success('Status atualizado!')
      load()
    } catch (_) {
      toast.error('Erro ao atualizar.')
    }
  }

  const statusBadge = (s: string) => {
    if (s === 'approved')
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-200">Ativo</Badge>
    if (s === 'blocked') return <Badge variant="destructive">Bloqueado</Badge>
    return <Badge variant="secondary">Pendente</Badge>
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Pacientes</h1>
        <Button
          onClick={() => {
            setEditPatient(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Paciente
        </Button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, CPF ou telefone..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : patients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum paciente encontrado.
                </TableCell>
              </TableRow>
            ) : (
              patients.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.document_id || '-'}</TableCell>
                  <TableCell>{p.phone || '-'}</TableCell>
                  <TableCell>{statusBadge(p.registration_status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditPatient(p)
                          setDialogOpen(true)
                        }}
                      >
                        Editar
                      </Button>
                      {p.registration_status !== 'approved' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600"
                          onClick={() => handleStatus(p.id, 'approved')}
                        >
                          Ativar
                        </Button>
                      )}
                      {p.registration_status === 'approved' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive"
                          onClick={() => handleStatus(p.id, 'blocked')}
                        >
                          Bloquear
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <span className="flex items-center px-4 text-sm">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima
          </Button>
        </div>
      )}
      <PatientFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        patient={editPatient}
        onSuccess={load}
      />
    </div>
  )
}
