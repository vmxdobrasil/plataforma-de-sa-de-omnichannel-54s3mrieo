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
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, ShieldAlert, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false)
  const [staffName, setStaffName] = useState('')
  const [staffEmail, setStaffEmail] = useState('')
  const [staffPassword, setStaffPassword] = useState('')
  const [staffRole, setStaffRole] = useState('medical_director')
  const [submitting, setSubmitting] = useState(false)

  const handleAddStaff = async () => {
    if (!staffName || !staffEmail || !staffPassword) {
      toast.error('Preencha todos os campos.')
      return
    }
    try {
      setSubmitting(true)
      await pb.collection('users').create({
        name: staffName,
        email: staffEmail,
        password: staffPassword,
        passwordConfirm: staffPassword,
        role: staffRole,
        emailVisibility: true,
        verified: true,
      })
      toast.success('Usuário criado com sucesso!')
      setIsAddStaffOpen(false)
      setStaffName('')
      setStaffEmail('')
      setStaffPassword('')
      loadUsers()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao criar usuário. Verifique se o e-mail já existe.')
    } finally {
      setSubmitting(false)
    }
  }

  const loadUsers = async () => {
    try {
      setLoading(true)
      let filterStr = ''
      const parts = []
      if (searchTerm) parts.push(`(name ~ "${searchTerm}" || email ~ "${searchTerm}")`)
      if (roleFilter !== 'all') parts.push(`role = "${roleFilter}"`)
      if (parts.length > 0) filterStr = parts.join(' && ')

      const res = await pb.collection('users').getList(1, 50, {
        filter: filterStr,
        sort: '-created',
      })
      setUsers(res.items)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar usuários.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [searchTerm, roleFilter])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Usuários</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie Profissionais, Empresas, Pacientes e Equipe da plataforma.
          </p>
        </div>
        <Button onClick={() => setIsAddStaffOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Adicionar Membro da Equipe
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou e-mail..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por papel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="professional">Profissional</SelectItem>
            <SelectItem value="patient">Paciente</SelectItem>
            <SelectItem value="company">Empresa</SelectItem>
            <SelectItem value="pharmacy">Farmácia</SelectItem>
            <SelectItem value="laboratory">Laboratório</SelectItem>
            <SelectItem value="medical_director">Diretor Médico</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name || 'Sem nome'}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {u.role.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {u.is_blocked ? (
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
                  <TableCell className="whitespace-nowrap">
                    {new Date(u.created).toLocaleDateString('pt-BR')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isAddStaffOpen} onOpenChange={setIsAddStaffOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Membro</DialogTitle>
            <DialogDescription>
              Crie um novo acesso para a equipe de gestão da plataforma ou outros papéis.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input
                placeholder="Ex: João da Silva"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input
                type="email"
                placeholder="email@vmedbrasil.com.br"
                value={staffEmail}
                onChange={(e) => setStaffEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Senha Temporária</Label>
              <Input
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={staffPassword}
                onChange={(e) => setStaffPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Papel (Role)</Label>
              <Select value={staffRole} onValueChange={setStaffRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medical_director">Diretor Médico / Admin</SelectItem>
                  <SelectItem value="company">Empresa (RH)</SelectItem>
                  <SelectItem value="professional">Profissional (Médico)</SelectItem>
                  <SelectItem value="patient">Paciente</SelectItem>
                  <SelectItem value="pharmacy">Farmácia</SelectItem>
                  <SelectItem value="laboratory">Laboratório</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAddStaffOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={handleAddStaff} disabled={submitting}>
              {submitting ? 'Criando...' : 'Criar Acesso'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
