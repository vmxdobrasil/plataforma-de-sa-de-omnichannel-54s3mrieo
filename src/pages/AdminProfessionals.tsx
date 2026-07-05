import { useState, useEffect } from 'react'
import { verifyProfessional, updateRegistrationStatus } from '@/services/users'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  UserCheck,
  UserX,
  Loader2,
  Stethoscope,
  History,
  CheckCircle,
  XCircle,
  MoreVertical,
  Mail,
  MessageCircle,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { CommunicationHistory } from '@/components/admin/CommunicationHistory'

export default function AdminProfessionals() {
  const [professionals, setProfessionals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchName, setSearchName] = useState('')
  const [searchCity, setSearchCity] = useState('')
  const [searchNeighborhood, setSearchNeighborhood] = useState('')
  const [selectedProf, setSelectedProf] = useState<any | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const { toast } = useToast()

  const loadProfessionals = async () => {
    setLoading(true)
    try {
      let filter = `role = "professional"`
      const safeName = searchName.replace(/["\\]/g, '')
      const safeCity = searchCity.replace(/["\\]/g, '')
      const safeNeigh = searchNeighborhood.replace(/["\\]/g, '')

      if (safeName) {
        filter += ` && (name ~ "${safeName}" || crm_number ~ "${safeName}" || specialty ~ "${safeName}")`
      }
      if (safeCity) filter += ` && city ~ "${safeCity}"`
      if (safeNeigh) filter += ` && address_neighborhood ~ "${safeNeigh}"`

      const res = await pb.collection('users').getList(1, 50, { filter, sort: '-created' })
      setProfessionals(res.items)
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os profissionais.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(() => loadProfessionals(), 300)
    return () => clearTimeout(t)
  }, [searchName, searchCity, searchNeighborhood])

  useRealtime('users', () => loadProfessionals())

  const handleVerifyToggle = async (id: string, currentStatus: boolean) => {
    try {
      await verifyProfessional(id, !currentStatus)
      toast({
        title: 'Status atualizado',
        description: `Profissional ${!currentStatus ? 'verificado' : 'não verificado'}.`,
      })
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status.',
        variant: 'destructive',
      })
    }
  }

  const handleRegistrationStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await updateRegistrationStatus(id, status)
      toast({
        title: 'Status de cadastro atualizado',
        description: `Cadastro ${status === 'approved' ? 'aprovado' : 'rejeitado'}. Notificação envi automaticamente.`,
      })
    } catch {
      toast({ title: 'Erro', description: 'Falha ao atualizar status.', variant: 'destructive' })
    }
  }

  const openHistory = (prof: any) => {
    setSelectedProf(prof)
    setHistoryOpen(true)
  }

  const renderStatusCell = (prof: any) => (
    <div className="flex flex-col gap-1">
      {prof.is_verified ? (
        <Badge variant="default" className="bg-green-500 hover:bg-green-600 w-fit">
          Verificado
        </Badge>
      ) : (
        <Badge variant="secondary" className="w-fit">
          Pendente
        </Badge>
      )}
      {prof.registration_status && (
        <Badge
          variant="outline"
          className={
            prof.registration_status === 'approved'
              ? 'border-green-500 text-green-600 w-fit'
              : prof.registration_status === 'rejected'
                ? 'border-red-500 text-red-600 w-fit'
                : 'w-fit'
          }
        >
          {prof.registration_status === 'approved'
            ? 'Aprovado'
            : prof.registration_status === 'rejected'
              ? 'Rejeitado'
              : 'Pendente'}
        </Badge>
      )}
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <AdminHeader
        title="Guia Saúde (Gestão)"
        description="Gerencie os profissionais de saúde cadastrados na plataforma."
        icon={<Stethoscope className="h-8 w-8" />}
      />

      <Tabs defaultValue="professionals">
        <TabsList>
          <TabsTrigger value="professionals">Profissionais</TabsTrigger>
          <TabsTrigger value="history">Histórico de Comunicação</TabsTrigger>
        </TabsList>

        <TabsContent value="professionals" className="space-y-4">
          <div className="flex flex-col gap-4 bg-primary/5 p-4 rounded-xl border border-primary/10 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 items-center w-full">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, CRM ou especialidade..."
                  className="pl-9 bg-background"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                />
              </div>
              <Input
                placeholder="Filtrar por cidade..."
                className="bg-background flex-1 w-full"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
              />
              <Input
                placeholder="Filtrar por bairro..."
                className="bg-background flex-1 w-full"
                value={searchNeighborhood}
                onChange={(e) => setSearchNeighborhood(e.target.value)}
              />
            </div>
          </div>

          <Card>
            <CardHeader className="bg-primary/20 rounded-t-xl border-b border-primary/10">
              <div>
                <CardTitle>Profissionais de Saúde</CardTitle>
                <CardDescription>Lista de todos os profissionais cadastrados</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center p-12">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Carregando profissionais...</p>
                  </div>
                </div>
              ) : professionals.length === 0 ? (
                <div className="text-center p-12 text-muted-foreground border border-dashed rounded-lg bg-muted/20 m-6">
                  Nenhum profissional de saúde encontrado com os filtros atuais.
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/50 [&_th]:text-foreground">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-6">Profissional</TableHead>
                      <TableHead>CRM</TableHead>
                      <TableHead>Especialidade</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right pr-6">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {professionals.map((prof) => (
                      <TableRow key={prof.id}>
                        <TableCell className="pl-6">
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
                          <div className="text-sm">
                            {prof.city ? `${prof.city} - ${prof.state || ''}` : 'Não informada'}
                          </div>
                          {prof.address_neighborhood && (
                            <div className="text-xs text-muted-foreground">
                              {prof.address_neighborhood}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{renderStatusCell(prof)}</TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-2">
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
                                  <UserX className="w-4 h-4 mr-1" /> Revogar
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-4 h-4 mr-1" /> Verificar
                                </>
                              )}
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Cadastro</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => handleRegistrationStatus(prof.id, 'approved')}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" /> Aprovar
                                  Cadastro
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleRegistrationStatus(prof.id, 'rejected')}
                                >
                                  <XCircle className="w-4 h-4 mr-2 text-red-600" /> Rejeitar
                                  Cadastro
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => openHistory(prof)}>
                                  <History className="w-4 h-4 mr-2" /> Histórico de Comunicação
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <CommunicationHistory />
        </TabsContent>
      </Tabs>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Histórico de Comunicação - {selectedProf?.name || ''}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {selectedProf && <CommunicationHistory recipientId={selectedProf.id} />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
