import { useEffect, useState, useMemo } from 'react'
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
import {
  Search,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  FileText,
  Calendar,
  Pill,
  Activity,
  Users,
  Loader2,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { format, isAfter, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Skeleton } from '@/components/ui/skeleton'

export default function AdminSupervision() {
  const { user } = useAuth()

  const [professionals, setProfessionals] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [healthRecords, setHealthRecords] = useState<any[]>([])
  const [prescriptions, setPrescriptions] = useState<any[]>([])

  const [loadingProfs, setLoadingProfs] = useState(true)
  const [loadingApps, setLoadingApps] = useState(true)
  const [loadingRecords, setLoadingRecords] = useState(true)
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(true)

  const [searchTermProf, setSearchTermProf] = useState('')
  const [searchTermApp, setSearchTermApp] = useState('')
  const [searchTermRec, setSearchTermRec] = useState('')
  const [searchTermPresc, setSearchTermPresc] = useState('')

  const [selectedProf, setSelectedProf] = useState<any>(null)
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false)
  const [blockReason, setBlockReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadData = async (
    collection: string,
    filter: string,
    expand: string,
    setLoading: any,
    setData: any,
  ) => {
    try {
      setLoading(true)
      const res = await pb.collection(collection).getFullList({
        filter,
        sort: '-created',
        expand,
      })
      setData(res)
    } catch (error) {
      console.error(error)
      toast.error(`Erro ao carregar dados de ${collection}.`)
    } finally {
      setLoading(false)
    }
  }

  const isMasterAdmin = user?.role === 'admin' || user?.email === 'valterpmendonca@gmail.com'

  const getRoleFilter = (prefix = '') => {
    if (isMasterAdmin) return ''
    if (user?.role === 'medical_director' && user?.crm_state) {
      return `${prefix}crm_state = "${user.crm_state}"`
    }
    return ''
  }

  const combineFilters = (base: string, search: string) => {
    const filters = []
    if (base) filters.push(`(${base})`)
    if (search) filters.push(`(${search})`)
    return filters.join(' && ')
  }

  useEffect(() => {
    const searchFilter = searchTermProf
      ? `role = "professional" && (name ~ "${searchTermProf}" || email ~ "${searchTermProf}")`
      : `role = "professional"`
    const roleFilter = getRoleFilter('')
    const filter = combineFilters(roleFilter, searchFilter)
    loadData('users', filter, '', setLoadingProfs, setProfessionals)
  }, [searchTermProf, user])

  useEffect(() => {
    const searchFilter = searchTermApp
      ? `patient_id.name ~ "${searchTermApp}" || professional_id.name ~ "${searchTermApp}"`
      : ''
    const roleFilter = getRoleFilter('professional_id.')
    const filter = combineFilters(roleFilter, searchFilter)
    loadData('appointments', filter, 'patient_id,professional_id', setLoadingApps, setAppointments)
  }, [searchTermApp, user])

  useEffect(() => {
    const searchFilter = searchTermRec
      ? `patient_id.name ~ "${searchTermRec}" || professional_id.name ~ "${searchTermRec}"`
      : ''
    const roleFilter = getRoleFilter('professional_id.')
    const filter = combineFilters(roleFilter, searchFilter)
    loadData(
      'health_records',
      filter,
      'patient_id,professional_id',
      setLoadingRecords,
      setHealthRecords,
    )
  }, [searchTermRec, user])

  useEffect(() => {
    const searchFilter = searchTermPresc
      ? `patient_id.name ~ "${searchTermPresc}" || professional_id.name ~ "${searchTermPresc}" || medications ~ "${searchTermPresc}"`
      : ''
    const roleFilter = getRoleFilter('professional_id.')
    const filter = combineFilters(roleFilter, searchFilter)
    loadData(
      'prescriptions',
      filter,
      'patient_id,professional_id',
      setLoadingPrescriptions,
      setPrescriptions,
    )
  }, [searchTermPresc, user])

  const handleOpenBlockDialog = (prof: any) => {
    setSelectedProf(prof)
    setBlockReason(prof.block_reason || '')
    setIsBlockDialogOpen(true)
  }

  const handleToggleBlock = async () => {
    if (!selectedProf) return
    const isBlocking = !selectedProf.is_blocked
    if (isBlocking && !blockReason.trim()) return toast.error('O motivo do bloqueio é obrigatório.')
    try {
      setSubmitting(true)
      await pb.collection('users').update(selectedProf.id, {
        is_blocked: isBlocking,
        block_reason: isBlocking ? blockReason : '',
      })
      await pb.collection('audit_logs').create({
        user_id: user?.id,
        action: 'update',
        resource_type: 'users',
        resource_id: selectedProf.id,
        details: { action: isBlocking ? 'blocked' : 'unblocked', reason: blockReason },
      })
      toast.success(isBlocking ? 'Profissional bloqueado.' : 'Profissional desbloqueado.')
      setIsBlockDialogOpen(false)
      loadData('users', `role = "professional"`, '', setLoadingProfs, setProfessionals)
    } catch (error) {
      toast.error('Erro ao alterar status do profissional.')
    } finally {
      setSubmitting(false)
    }
  }

  const TableLoading = ({ colSpan = 5 }: { colSpan?: number }) => (
    <TableRow>
      <TableCell colSpan={colSpan} className="text-center py-12">
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando dados clínicos...</p>
        </div>
      </TableCell>
    </TableRow>
  )

  const TableEmpty = ({ colSpan = 5 }: { colSpan?: number }) => (
    <TableRow>
      <TableCell colSpan={colSpan} className="text-center py-12 text-muted-foreground">
        <div className="flex flex-col items-center justify-center gap-2">
          <Activity className="h-8 w-8 text-muted-foreground/50" />
          <p>Nenhum dado de supervisão encontrado para os filtros aplicados</p>
        </div>
      </TableCell>
    </TableRow>
  )

  const recentRecordsCount = useMemo(() => {
    const thirtyDaysAgo = subDays(new Date(), 30)
    return healthRecords.filter((r) => r.created && isAfter(new Date(r.created), thirtyDaysAgo))
      .length
  }, [healthRecords])

  const safeFormatDate = (dateString: string) => {
    try {
      if (!dateString) return 'N/A'
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR })
    } catch {
      return 'Data inválida'
    }
  }

  return (
    <div className="relative min-h-[80vh] rounded-xl p-4 sm:p-6 overflow-hidden">
      <div className="absolute inset-0 bg-primary/20 bg-grid-pattern opacity-20 pointer-events-none" />
      <div className="relative z-10 space-y-6">
        <div className="bg-background/90 backdrop-blur-md border border-primary/20 rounded-xl p-6 shadow-sm">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Supervisão Clínica</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Painel para gestão de profissionais, auditoria de prontuários, receitas e agendamentos.
          </p>
          <div className="mt-6 flex items-center gap-4 bg-background/80 backdrop-blur-sm w-fit px-4 py-3 rounded-lg border border-primary/10 shadow-sm">
            <Avatar className="h-12 w-12 border-2 border-primary/30">
              <AvatarImage
                src={
                  user?.avatar
                    ? pb.files.getURL(user, user.avatar)
                    : `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.name || 'User'}`
                }
              />
              <AvatarFallback>
                {user?.role === 'medical_director' ? (
                  <Stethoscope className="h-5 w-5" />
                ) : (
                  <ShieldCheck className="h-5 w-5" />
                )}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold text-foreground leading-tight">
                {user?.role === 'medical_director'
                  ? `Diretor Médico: ${user?.name || 'Não informado'}`
                  : `Administrador Master: ${user?.name || 'Sistema'}`}
              </p>
              <p className="text-sm text-primary font-semibold tracking-wide">
                {user?.role === 'medical_director'
                  ? user?.crm_number
                    ? `CRM: ${user.crm_number} ${user.crm_state || ''}`
                    : 'CRM não cadastrado'
                  : 'Visão Global de Supervisão'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-grid-pattern relative overflow-hidden border-primary/20 bg-primary/5">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-[1px]"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium">Total de Agendamentos</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold">
                {loadingApps ? <Skeleton className="h-8 w-16" /> : appointments.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Consultas na plataforma</p>
            </CardContent>
          </Card>

          <Card className="bg-grid-pattern relative overflow-hidden border-primary/20 bg-primary/5">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-[1px]"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium">Prontuários Recentes</CardTitle>
              <FileText className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold">
                {loadingRecords ? <Skeleton className="h-8 w-16" /> : recentRecordsCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Criados nos últimos 30 dias</p>
            </CardContent>
          </Card>

          <Card className="bg-grid-pattern relative overflow-hidden border-primary/20 bg-primary/5">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-[1px]"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium">Profissionais Registrados</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold">
                {loadingProfs ? <Skeleton className="h-8 w-16" /> : professionals.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Médicos e especialistas</p>
            </CardContent>
          </Card>

          <Card className="bg-grid-pattern relative overflow-hidden border-primary/20 bg-primary/5">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-[1px]"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium">Receitas Prescritas</CardTitle>
              <Pill className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold">
                {loadingPrescriptions ? <Skeleton className="h-8 w-16" /> : prescriptions.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total de prescrições</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="records" className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full h-auto gap-2 bg-transparent p-0">
            <TabsTrigger
              value="records"
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary border bg-card py-3"
            >
              <FileText className="mr-2 h-4 w-4" /> Prontuários
            </TabsTrigger>
            <TabsTrigger
              value="appointments"
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary border bg-card py-3"
            >
              <Calendar className="mr-2 h-4 w-4" /> Agendamentos
            </TabsTrigger>
            <TabsTrigger
              value="prescriptions"
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary border bg-card py-3"
            >
              <Pill className="mr-2 h-4 w-4" /> Receitas
            </TabsTrigger>
            <TabsTrigger
              value="professionals"
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary border bg-card py-3"
            >
              <Stethoscope className="mr-2 h-4 w-4" /> Profissionais
            </TabsTrigger>
          </TabsList>

          <TabsContent value="records" className="mt-4">
            <Card className="border shadow-sm">
              <CardHeader className="bg-primary/20 bg-grid-pattern border-b pb-4">
                <CardTitle>Prontuários de Saúde (Feed de Atividades)</CardTitle>
                <CardDescription>Acesso aos registros clínicos de pacientes.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-4 border-b">
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar paciente ou profissional..."
                      className="pl-9"
                      value={searchTermRec}
                      onChange={(e) => setSearchTermRec(e.target.value)}
                    />
                  </div>
                </div>
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Profissional</TableHead>
                      <TableHead>Tipo de Registro</TableHead>
                      <TableHead>Conteúdo Resumido</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingRecords ? (
                      <TableLoading />
                    ) : healthRecords.length === 0 ? (
                      <TableEmpty />
                    ) : (
                      healthRecords.map((rec) => (
                        <TableRow key={rec.id}>
                          <TableCell className="font-medium whitespace-nowrap">
                            {safeFormatDate(rec.created)}
                          </TableCell>
                          <TableCell>{rec.expand?.patient_id?.name || 'N/A'}</TableCell>
                          <TableCell>{rec.expand?.professional_id?.name || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize">
                              {rec.type === 'clinical'
                                ? 'Clínico'
                                : rec.type === 'dental'
                                  ? 'Odontológico'
                                  : rec.type === 'aesthetic'
                                    ? 'Estético'
                                    : rec.type}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className="max-w-[200px] truncate"
                            title={rec.content || 'Sem conteúdo'}
                          >
                            {rec.content || (
                              <span className="text-muted-foreground italic">Sem conteúdo</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments" className="mt-4">
            <Card className="border shadow-sm">
              <CardHeader className="bg-primary/20 bg-grid-pattern border-b pb-4">
                <CardTitle>Agendamentos Gerais</CardTitle>
                <CardDescription>Auditoria de todas as consultas na plataforma.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-4 border-b">
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar paciente ou profissional..."
                      className="pl-9"
                      value={searchTermApp}
                      onChange={(e) => setSearchTermApp(e.target.value)}
                    />
                  </div>
                </div>
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Profissional</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tipo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingApps ? (
                      <TableLoading />
                    ) : appointments.length === 0 ? (
                      <TableEmpty />
                    ) : (
                      appointments.map((app) => (
                        <TableRow key={app.id}>
                          <TableCell className="font-medium whitespace-nowrap">
                            {safeFormatDate(app.dateTime || app.created)}
                          </TableCell>
                          <TableCell>{app.expand?.patient_id?.name || 'N/A'}</TableCell>
                          <TableCell>{app.expand?.professional_id?.name || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{app.status || 'N/A'}</Badge>
                          </TableCell>
                          <TableCell>{app.type || 'N/A'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prescriptions" className="mt-4">
            <Card className="border shadow-sm">
              <CardHeader className="bg-primary/20 bg-grid-pattern border-b pb-4">
                <CardTitle>Receitas Prescritas</CardTitle>
                <CardDescription>Auditoria de prescrições médicas na plataforma.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-4 border-b">
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar medicamento, paciente..."
                      className="pl-9"
                      value={searchTermPresc}
                      onChange={(e) => setSearchTermPresc(e.target.value)}
                    />
                  </div>
                </div>
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Profissional</TableHead>
                      <TableHead>Medicamentos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingPrescriptions ? (
                      <TableLoading colSpan={4} />
                    ) : prescriptions.length === 0 ? (
                      <TableEmpty colSpan={4} />
                    ) : (
                      prescriptions.map((presc) => (
                        <TableRow key={presc.id}>
                          <TableCell className="font-medium whitespace-nowrap">
                            {safeFormatDate(presc.created)}
                          </TableCell>
                          <TableCell>{presc.expand?.patient_id?.name || 'N/A'}</TableCell>
                          <TableCell>{presc.expand?.professional_id?.name || 'N/A'}</TableCell>
                          <TableCell
                            className="max-w-[250px] truncate"
                            title={presc.medications || 'Nenhum medicamento listado'}
                          >
                            {presc.medications || (
                              <span className="text-muted-foreground italic">Não listado</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="professionals" className="mt-4">
            <Card className="border shadow-sm">
              <CardHeader className="bg-primary/20 bg-grid-pattern border-b pb-4">
                <CardTitle>Verificação de Profissionais</CardTitle>
                <CardDescription>Gerencie acesso e verifique o CRM dos médicos.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-4 border-b">
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome ou e-mail..."
                      className="pl-9"
                      value={searchTermProf}
                      onChange={(e) => setSearchTermProf(e.target.value)}
                    />
                  </div>
                </div>
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Profissional</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>CRM / UF</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingProfs ? (
                      <TableLoading />
                    ) : professionals.length === 0 ? (
                      <TableEmpty />
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
                              <Badge
                                variant="destructive"
                                className="flex w-fit items-center gap-1"
                              >
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedProf?.is_blocked ? 'Desbloquear Profissional' : 'Bloquear Profissional'}
              </DialogTitle>
              <DialogDescription>
                {selectedProf?.is_blocked
                  ? `Você está prestes a restaurar o acesso de ${selectedProf.name}.`
                  : `Você está prestes a revogar o acesso de ${selectedProf.name}.`}
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
    </div>
  )
}
