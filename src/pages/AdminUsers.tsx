import { useEffect, useState } from 'react'
import { Plus, Users, Mail } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import pb from '@/lib/pocketbase/client'
import { CreateProfessionalForm } from '@/components/admin/forms/CreateProfessionalForm'
import { CreateCompanyForm } from '@/components/admin/forms/CreateCompanyForm'
import { CreatePharmacyLabForm } from '@/components/admin/forms/CreatePharmacyLabForm'
import { InviteLinks } from '@/components/admin/forms/InviteLinks'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  const loadUsers = async () => {
    try {
      const records = await pb.collection('users').getList(1, 50, {
        sort: '-created',
      })
      setUsers(records.items)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleSuccess = () => {
    setOpen(false)
    loadUsers()
  }

  const roleLabels: Record<string, string> = {
    patient: 'Paciente',
    professional: 'Profissional',
    company: 'Empresa',
    pharmacy: 'Farmácia',
    laboratory: 'Laboratório',
    admin: 'Admin',
    medical_director: 'Diretor Médico',
  }

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM & Cadastros</h1>
          <p className="text-muted-foreground mt-1">
            Gestão de usuários e registro manual de parceiros.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Novo Cadastro
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Registro Manual & Convites</DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="professional" className="mt-4">
              <TabsList className="grid grid-cols-2 md:grid-cols-4">
                <TabsTrigger value="professional">Profissional</TabsTrigger>
                <TabsTrigger value="company">Empresa</TabsTrigger>
                <TabsTrigger value="pharmacy">Farmácia/Lab</TabsTrigger>
                <TabsTrigger value="invites">Links Convite</TabsTrigger>
              </TabsList>
              <TabsContent value="professional">
                <CreateProfessionalForm onSuccess={handleSuccess} />
              </TabsContent>
              <TabsContent value="company">
                <CreateCompanyForm onSuccess={handleSuccess} />
              </TabsContent>
              <TabsContent value="pharmacy">
                <CreatePharmacyLabForm onSuccess={handleSuccess} />
              </TabsContent>
              <TabsContent value="invites">
                <InviteLinks />
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Usuários Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tipo (Role)</TableHead>
                    <TableHead>Data Cadastro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" /> {u.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {u.role === 'admin' && u.specialty
                            ? u.specialty
                            : roleLabels[u.role] || u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(u.created).toLocaleDateString('pt-BR')}
                      </TableCell>
                    </TableRow>
                  ))}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                        Nenhum usuário encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
