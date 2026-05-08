import { useState, useEffect } from 'react'
import { getAdminProfessionals, verifyProfessional } from '@/services/users'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Search, UserCheck, UserX, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'

export default function AdminProfessionals() {
  const [professionals, setProfessionals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const { toast } = useToast()

  const loadProfessionals = async () => {
    setLoading(true)
    const data = await getAdminProfessionals()
    setProfessionals(data)
    setLoading(false)
  }

  useEffect(() => {
    loadProfessionals()
  }, [])

  useRealtime('users', (e) => {
    if (e.action === 'create' || e.action === 'update' || e.action === 'delete') {
      loadProfessionals()
    }
  })

  const handleVerifyToggle = async (id: string, currentStatus: boolean) => {
    try {
      await verifyProfessional(id, !currentStatus)
      toast({
        title: 'Status atualizado',
        description: `Profissional ${!currentStatus ? 'verificado' : 'não verificado'} com sucesso.`,
      })
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status.',
        variant: 'destructive',
      })
    }
  }

  const filteredProfessionals = professionals.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.crm_number?.toLowerCase().includes(search.toLowerCase()) ||
      p.specialty?.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Guia Saúde (Gestão)</h1>
        <p className="text-muted-foreground">
          Gerencie os profissionais de saúde cadastrados na plataforma.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Profissionais de Saúde</CardTitle>
              <CardDescription>Lista de todos os profissionais cadastrados</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CRM ou especialidade..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-12">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Carregando profissionais...</p>
              </div>
            </div>
          ) : filteredProfessionals.length === 0 ? (
            <div className="text-center p-12 text-muted-foreground border border-dashed rounded-lg bg-muted/20">
              Nenhum profissional de saúde encontrado.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profissional</TableHead>
                    <TableHead>CRM</TableHead>
                    <TableHead>Especialidade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfessionals.map((prof) => (
                    <TableRow key={prof.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage
                              src={
                                prof.avatar
                                  ? pb.files.getURL(prof, prof.avatar)
                                  : `https://api.dicebear.com/7.x/notionists/svg?seed=${prof.name}`
                              }
                            />
                            <AvatarFallback>{prof.name?.charAt(0) || 'P'}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium">{prof.name || 'Sem nome'}</span>
                            <span className="text-xs text-muted-foreground">{prof.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {prof.crm_number ? (
                          <span className="font-medium text-sm">
                            {prof.crm_number} - {prof.crm_state || 'BR'}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs italic">
                            Não informado
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {prof.specialty ? (
                          <span className="text-sm">{prof.specialty}</span>
                        ) : (
                          <span className="text-muted-foreground text-xs italic">
                            Não informada
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {prof.is_verified ? (
                          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                            Verificado
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Pendente</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant={prof.is_verified ? 'outline' : 'default'}
                          size="sm"
                          onClick={() => handleVerifyToggle(prof.id, prof.is_verified)}
                          className={
                            prof.is_verified ? 'text-destructive hover:text-destructive' : ''
                          }
                        >
                          {prof.is_verified ? (
                            <>
                              <UserX className="w-4 h-4 mr-2" /> Revogar
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-4 h-4 mr-2" /> Verificar
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
