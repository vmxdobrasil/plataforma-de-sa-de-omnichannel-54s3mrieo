import { useState, useEffect } from 'react'
import { Plus, Edit, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { ReferralCard } from '@/components/ReferralCard'
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'

export default function MyDependents() {
  const { user } = useAuth()
  const [dependents, setDependents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', document_id: '', date_of_birth: '', kinship: '' })

  const load = async () => {
    if (!user) return
    try {
      const deps = await pb
        .collection('users')
        .getFullList({ filter: `parent_id = "${user.id}"`, sort: '-created' })
      setDependents(deps)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [user])
  useRealtime('users', () => load())

  const handleSubmit = async () => {
    if (!user || !form.name) {
      toast.error('Nome é obrigatório.')
      return
    }
    try {
      if (editId) {
        await pb.collection('users').update(editId, form)
        toast.success('Dependente atualizado!')
      } else {
        await pb.collection('users').create({
          ...form,
          email: `${form.document_id || Date.now()}@temp.vmed.com.br`,
          password: 'Skip@Pass',
          passwordConfirm: 'Skip@Pass',
          role: 'patient',
          parent_id: user.id,
          is_dependent: true,
          company_id: user.company_id || undefined,
          origin_type: user.origin_type || 'b2c',
          registration_status: 'approved',
        })
        toast.success('Dependente adicionado!')
      }
      setDialogOpen(false)
      setEditId(null)
      setForm({ name: '', document_id: '', date_of_birth: '', kinship: '' })
      load()
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao salvar.')
    }
  }

  const openEdit = (dep: any) => {
    setEditId(dep.id)
    setForm({
      name: dep.name || '',
      document_id: dep.document_id || '',
      date_of_birth: dep.date_of_birth || '',
      kinship: dep.kinship || '',
    })
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" /> Meus Dependentes
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie os dependentes vinculados à sua conta.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditId(null)
            setForm({ name: '', document_id: '', date_of_birth: '', kinship: '' })
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Adicionar
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dependentes ({dependents.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center py-8 text-muted-foreground">Carregando...</p>
              ) : dependents.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Nenhum dependente cadastrado.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Nascimento</TableHead>
                      <TableHead>Parentesco</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dependents.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.name}</TableCell>
                        <TableCell>{d.document_id || '-'}</TableCell>
                        <TableCell>
                          {d.date_of_birth
                            ? new Date(d.date_of_birth).toLocaleDateString('pt-BR')
                            : '-'}
                        </TableCell>
                        <TableCell>{d.kinship || '-'}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(d)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
        <ReferralCard />
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? 'Editar Dependente' : 'Novo Dependente'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome Completo *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>CPF (opcional para menores)</Label>
              <Input
                value={form.document_id}
                onChange={(e) => setForm({ ...form, document_id: e.target.value })}
                placeholder="000.000.000-00"
              />
            </div>
            <div className="space-y-2">
              <Label>Data de Nascimento</Label>
              <Input
                type="date"
                value={form.date_of_birth}
                onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Parentesco</Label>
              <Select value={form.kinship} onValueChange={(v) => setForm({ ...form, kinship: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spouse">Cônjuge</SelectItem>
                  <SelectItem value="child">Filho(a)</SelectItem>
                  <SelectItem value="parent">Pai/Mãe</SelectItem>
                  <SelectItem value="sibling">Irmão(ã)</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
