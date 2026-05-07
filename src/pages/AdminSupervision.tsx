import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, ShieldAlert, ShieldCheck } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function AdminSupervision() {
  const { user } = useAuth()
  const [professionals, setProfessionals] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  const [selectedProf, setSelectedProf] = useState<any>(null)
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false)
  const [blockReason, setBlockReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadProfessionals = async () => {
    try {
      setLoading(true)
      const filter = searchTerm
        ? `role = "professional" && (name ~ "${searchTerm}" || email ~ "${searchTerm}")`
        : `role = "professional"`

      const res = await pb.collection('users').getFullList({
        filter,
        sort: '-created',
      })
      setProfessionals(res)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar profissionais.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfessionals()
  }, [searchTerm])

  const handleOpenBlockDialog = (prof: any) => {
    setSelectedProf(prof)
    setBlockReason(prof.block_reason || '')
    setIsBlockDialogOpen(true)
  }

  const handleToggleBlock = async () => {
    if (!selectedProf) return
    const isBlocking = !selectedProf.is_blocked

    if (isBlocking && !blockReason.trim()) {
      toast.error('O motivo do bloqueio é obrigatório.')
      return
    }

    try {
      setSubmitting(true)

      const updateData = {
        is_blocked: isBlocking,
        block_reason: isBlocking ? blockReason : '',
      }

      await pb.collection('users').update(selectedProf.id, updateData)

      // Audit Integration
      await pb.collection('audit_logs').create({
        user_id: user?.id,
        action: 'update',
        resource_type: 'users',
        resource_id: selectedProf.id,
        details: {
          action: isBlocking ? 'blocked' : 'unblocked',
          reason: blockReason,
        },
      })

      toast.success(
        isBlocking
          ? 'Profissional bloqueado com sucesso.'
          : 'Profissional desbloqueado com sucesso.',
      )
      setIsBlockDialogOpen(false)
      loadProfessionals()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao alterar status do profissional.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fiscalização de Profissionais</h1>
        <p className="text-muted-foreground mt-1">
          Supervisione e gerencie o acesso dos profissionais de saúde na plataforma.
        </p>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou e-mail..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Profissional</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>CRM / UF</TableHead>
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
            ) : professionals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum profissional encontrado.
                </TableCell>
              </TableRow>
            ) : (
              professionals.map((prof) => (
                <TableRow key={prof.id}>
                  <TableCell className="font-medium">{prof.name || 'Sem nome'}</TableCell>
                  <TableCell>{prof.email}</TableCell>
                  <TableCell>
                    {prof.crm_number ? `${prof.crm_number} - ${prof.crm_state}` : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {prof.is_blocked ? (
                      <Badge variant="destructive" className="flex w-fit items-center gap-1">
                        <ShieldAlert className="h-3 w-3" /> Bloqueado
                      </Badge>
                    ) : (
                      <Badge
                        variant="default"
                        className="flex w-fit items-center gap-1 bg-green-600 hover:bg-green-700"
                      >
                        <ShieldCheck className="h-3 w-3" /> Ativo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant={prof.is_blocked ? 'outline' : 'destructive'}
                      size="sm"
                      onClick={() => handleOpenBlockDialog(prof)}
                    >
                      {prof.is_blocked ? 'Desbloquear' : 'Bloquear'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedProf?.is_blocked ? 'Desbloquear Profissional' : 'Bloquear Profissional'}
            </DialogTitle>
            <DialogDescription>
              {selectedProf?.is_blocked
                ? `Você está prestes a restaurar o acesso de ${selectedProf.name}.`
                : `Você está prestes a revogar o acesso de ${selectedProf.name}. Este profissional não poderá acessar a plataforma ou receber novos agendamentos.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!selectedProf?.is_blocked && (
              <div className="space-y-2">
                <Label htmlFor="reason">Motivo do Bloqueio (Obrigatório)</Label>
                <Input
                  id="reason"
                  placeholder="Ex: Irregularidade no CRM, Má conduta..."
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                />
              </div>
            )}
            {selectedProf?.is_blocked && selectedProf?.block_reason && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <strong>Motivo do bloqueio atual:</strong> {selectedProf.block_reason}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsBlockDialogOpen(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              variant={selectedProf?.is_blocked ? 'default' : 'destructive'}
              onClick={handleToggleBlock}
              disabled={submitting || (!selectedProf?.is_blocked && !blockReason.trim())}
            >
              {submitting
                ? 'Aguarde...'
                : selectedProf?.is_blocked
                  ? 'Confirmar Desbloqueio'
                  : 'Confirmar Bloqueio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
