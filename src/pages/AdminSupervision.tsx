import { useEffect, useState, useMemo, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { ErrorBoundary } from '@/components/ErrorBoundary'
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
  DollarSign,
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
import { AdminHeader } from '@/components/admin/AdminHeader'

const TableLoading = ({ colSpan = 5 }: { colSpan?: number }) => (
  <TableRow>
    <TableCell colSpan={colSpan} className="text-center py-12">
      <div className="flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando dados...</p>
      </div>
    </TableCell>
  </TableRow>
)

const TableEmpty = ({
  colSpan = 5,
  message = 'Nenhuma atividade encontrada neste momento.',
}: {
  colSpan?: number
  message?: string
}) => (
  <TableRow>
    <TableCell colSpan={colSpan} className="text-center py-12 text-muted-foreground">
      <div className="flex flex-col items-center justify-center gap-2">
        <Activity className="h-8 w-8 text-muted-foreground/50" />
        <p>{message}</p>
      </div>
    </TableCell>
  </TableRow>
)

const safeFormatDate = (dateString: string) => {
  try {
    if (!dateString) return 'N/A'
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return 'Data inválida'
    return format(d, 'dd/MM/yyyy HH:mm', { locale: ptBR })
  } catch {
    return 'Data inválida'
  }
}

function AdminSupervisionContent() {
  const { user } = useAuth()

  const [professionals, setProfessionals] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [healthRecords, setHealthRecords] = useState<any[]>([])
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])

  const [loadingProfs, setLoadingProfs] = useState(true)
  const [loadingApps, setLoadingApps] = useState(true)
  const [loadingRecords, setLoadingRecords] = useState(true)
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(true)
  const [loadingAudit, setLoadingAudit] = useState(true)
  const [loadingTransactions, setLoadingTransactions] = useState(true)

  const [medicalDirector, setMedicalDirector] = useState<any>(null)

  const [searchTermProf, setSearchTermProf] = useState('')
  const [searchTermApp, setSearchTermApp] = useState('')
  const [searchTermRec, setSearchTermRec] = useState('')
  const [searchTermPresc, setSearchTermPresc] = useState('')
  const [searchTermTx, setSearchTermTx] = useState('')

  const [selectedProf, setSelectedProf] = useState<any>(null)
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [blockReason, setBlockReason] = useState('')
  const [editSpecialty, setEditSpecialty] = useState('')
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
      const options: any = { sort: '-created' }
      if (filter) options.filter = filter
      if (expand) options.expand = expand

      const res = await pb.collection(collection).getFullList(options)
      setData(res || [])
    } catch (error: any) {
      console.error(`Error loading ${collection}:`, error)
      if (error?.isAbort) return
      toast.error(`Erro ao carregar dados de ${collection}.`)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  const getRoleFilter = useCallback(
    (prefix = '') => {
      const isMasterAdmin = user?.role === 'admin' || user?.email === 'valterpmendonca@gmail.com'
      if (isMasterAdmin) return ''
      if (user?.role === 'medical_director') {
        if (user?.crm_state) {
          return `${prefix}crm_state = "${user.crm_state}"`
        }
        return `id = "invalid_no_crm"`
      }
      return `id = "invalid_role"`
    },
    [user],
  )

  const combineFilters = useCallback((base: string, search: string) => {
    const filters = []
    if (base) filters.push(`(${base})`)
    if (search) filters.push(`(${search})`)
    return filters.join(' && ')
  }, [])

  useEffect(() => {
    if (!user) return
    const safeTerm = searchTermProf.replace(/["\\]/g, '')
    const searchFilter = safeTerm
      ? `role = "professional" && (name ~ "${safeTerm}" || email ~ "${safeTerm}")`
      : `role = "professional"`
    const roleFilter = getRoleFilter('')
    const filter = combineFilters(roleFilter, searchFilter)
    loadData('users', filter, '', setLoadingProfs, setProfessionals)
  }, [searchTermProf, user, getRoleFilter, combineFilters])

  useEffect(() => {
    if (!user) return
    const safeTerm = searchTermApp.replace(/["\\]/g, '')
    const searchFilter = safeTerm
      ? `patient_id.name ~ "${safeTerm}" || professional_id.name ~ "${safeTerm}"`
      : ''
    const roleFilter = getRoleFilter('professional_id.')
    const filter = combineFilters(roleFilter, searchFilter)
    loadData('appointments', filter, 'patient_id,professional_id', setLoadingApps, setAppointments)
  }, [searchTermApp, user, getRoleFilter, combineFilters])

  useEffect(() => {
    if (!user) return
    const safeTerm = searchTermRec.replace(/["\\]/g, '')
    const searchFilter = safeTerm
      ? `patient_id.name ~ "${safeTerm}" || professional_id.name ~ "${safeTerm}"`
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
  }, [searchTermRec, user, getRoleFilter, combineFilters])

  useEffect(() => {
    if (!user) return
    const safeTerm = searchTermPresc.replace(/["\\]/g, '')
    const searchFilter = safeTerm
      ? `patient_id.name ~ "${safeTerm}" || professional_id.name ~ "${safeTerm}" || medications ~ "${safeTerm}"`
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
  }, [searchTermPresc, user, getRoleFilter, combineFilters])

  useEffect(() => {
    if (!user) return
    loadData(
      'audit_logs',
      `resource_type = "health_records" || resource_type = "prescriptions"`,
      'user_id',
      setLoadingAudit,
      setAuditLogs,
    )
  }, [user])

  useEffect(() => {
    if (!user) return
    const safeTerm = searchTermTx.replace(/["\\]/g, '')
    const searchFilter = safeTerm
      ? `appointment_id.patient_id.name ~ "${safeTerm}" || employee_id.name ~ "${safeTerm}" || company_id.name ~ "${safeTerm}"`
      : ''

    loadData(
      'benefit_transactions',
      searchFilter,
      'appointment_id.patient_id,appointment_id.professional_id,employee_id,company_id',
      setLoadingTransactions,
      setTransactions,
    )
  }, [searchTermTx, user])

  useEffect(() => {
    const fetchMedicalDirector = async () => {
      try {
        const res = await pb
          .collection('users')
          .getList(1, 1, { filter: 'role = "medical_director" || name ~ "Fauzer"' })
        if (res.items.length > 0) {
          setMedicalDirector(res.items[0])
        } else {
          setMedicalDirector(null)
        }
      } catch (err: any) {
        // silently ignore to prevent console exceptions
      }
    }
    fetchMedicalDirector()
  }, [])

  const handleOpenBlockDialog = (prof: any) => {
    setSelectedProf(prof)
    setBlockReason(prof.block_reason || '')
    setIsBlockDialogOpen(true)
  }

  const handleOpenEditDialog = (prof: any) => {
    setSelectedProf(prof)
    setEditSpecialty(prof.specialty || '')
    setIsEditDialogOpen(true)
  }

  const handleSaveSpecialty = async () => {
    if (!selectedProf) return
    try {
      setSubmitting(true)
      await pb.collection('users').update(selectedProf.id, { specialty: editSpecialty })
      toast.success('Especialidade atualizada.')
      setIsEditDialogOpen(false)
      loadData('users', `role = "professional"`, '', setLoadingProfs, setProfessionals)
    } catch (error) {
      toast.error('Erro ao atualizar especialidade.')
    } finally {
      setSubmitting(false)
    }
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

  const recentRecordsCount = useMemo(() => {
    const thirtyDaysAgo = subDays(new Date(), 30)
    return (healthRecords || []).filter((r) => {
      try {
        if (!r.created) return false
        const d = new Date(r.created)
        if (isNaN(d.getTime())) return false
        return isAfter(d, thirtyDaysAgo)
      } catch {
        return false
      }
    }).length
  }, [healthRecords])

  const patternStyle = {
    backgroundImage:
      'linear-gradient(to right, hsl(var(--primary)/0.2) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--primary)/0.2) 1px, transparent 1px)',
  }

  return (
    <div className="relative min-h-[80vh] rounded-xl p-4 sm:p-6 overflow-hidden">
      {/* Visual Consistency Grid Pattern using style to prevent tailwind compile errors */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.15] z-0"
        style={{ ...patternStyle, backgroundSize: '40px 40px' }}
      />
      <div className="relative z-10 space-y-6">
        <AdminHeader
          title="Supervisão Clínica"
          description="Painel para gestão de profissionais, auditoria de prontuários, receitas e agendamentos."
          rightContent={
            <div className="flex items-center gap-4 bg-background/80 backdrop-blur-sm px-4 py-3 rounded-lg border border-primary/10 shadow-sm w-full lg:w-auto">
              <Avatar className="h-12 w-12 border-2 border-primary/30">
                <AvatarImage
                  src={
                    medicalDirector?.avatar
                      ? pb.files.getURL(medicalDirector, medicalDirector.avatar)
                      : ''
                  }
                />
                <AvatarFallback className="bg-primary/10 text-primary">
                  <Stethoscope className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-0.5">
                <p className="font-bold text-foreground leading-tight text-sm">
                  Diretor Médico: {medicalDirector?.name || 'Fauzer Andrigo Mendonça Simoes Rangel'}
                  {medicalDirector?.crm_state && medicalDirector?.crm_number
                    ? ` (CRM-${medicalDirector.crm_state} ${medicalDirector.crm_number})`
                    : ''}
                </p>
                <p className="text-xs text-muted-foreground font-semibold tracking-wide">
                  Responsável Técnico: Não atribuído
                </p>
              </div>
            </div>
          }
        />

        {/* Audit Logs Quick View */}
        <Card className="border-primary/20 bg-card shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Auditoria de Prontuários e Receitas
            </CardTitle>
            <CardDescription>
              Últimas 10 ações registradas em recursos clínicos sensíveis.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Recurso</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingAudit ? (
                    <TableLoading colSpan={6} />
                  ) : auditLogs.slice(0, 10).length === 0 ? (
                    <TableEmpty colSpan={6} message="Nenhum log de auditoria encontrado." />
                  ) : (
                    auditLogs.slice(0, 10).map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          {safeFormatDate(log.created)}
                        </TableCell>
                        <TableCell>{log.expand?.user_id?.name || 'Sistema'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.resource_type === 'health_records' ? 'Prontuário' : 'Receita'}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{log.resource_id}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              toast.info(`Visualizar detalhe do recurso: ${log.resource_id}`)
                            }
                          >
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-primary/5 relative overflow-hidden border-primary/20">
            <div
              className="absolute inset-0 pointer-events-none opacity-10"
              style={{ ...patternStyle, backgroundSize: '10px 10px' }}
            />
            <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px]"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium">Total de Agendamentos</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold">
                {loadingApps ? <Skeleton className="h-8 w-16" /> : appointments?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Consultas na plataforma</p>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 relative overflow-hidden border-primary/20">
            <div
              className="absolute inset-0 pointer-events-none opacity-10"
              style={{ ...patternStyle, backgroundSize: '10px 10px' }}
            />
            <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px]"></div>
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

          <Card className="bg-primary/5 relative overflow-hidden border-primary/20">
            <div
              className="absolute inset-0 pointer-events-none opacity-10"
              style={{ ...patternStyle, backgroundSize: '10px 10px' }}
            />
            <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px]"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium">Profissionais Registrados</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold">
                {loadingProfs ? <Skeleton className="h-8 w-16" /> : professionals?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Médicos e especialistas</p>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 relative overflow-hidden border-primary/20">
            <div
              className="absolute inset-0 pointer-events-none opacity-10"
              style={{ ...patternStyle, backgroundSize: '10px 10px' }}
            />
            <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px]"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium">Receitas Prescritas</CardTitle>
              <Pill className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold">
                {loadingPrescriptions ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  prescriptions?.length || 0
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total de prescrições</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="records" className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full h-auto gap-2 bg-transparent p-0">
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
            <TabsTrigger
              value="transactions"
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary border bg-card py-3"
            >
              <DollarSign className="mr-2 h-4 w-4" /> Transações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="records" className="mt-4">
            <Card className="border shadow-sm relative overflow-hidden">
              <CardHeader className="bg-primary/5 border-b pb-4 relative">
                <div
                  className="absolute inset-0 pointer-events-none opacity-5"
                  style={{ ...patternStyle, backgroundSize: '20px 20px' }}
                />
                <CardTitle className="relative z-10">Prontuários de Saúde</CardTitle>
                <CardDescription className="relative z-10">
                  Acesso aos registros clínicos de pacientes.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 relative z-10 bg-card">
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
                <div className="overflow-x-auto">
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
                      ) : !healthRecords || healthRecords.length === 0 ? (
                        <TableEmpty message="Nenhum prontuário encontrado." />
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments" className="mt-4">
            <Card className="border shadow-sm relative overflow-hidden">
              <CardHeader className="bg-primary/5 border-b pb-4 relative">
                <div
                  className="absolute inset-0 pointer-events-none opacity-5"
                  style={{ ...patternStyle, backgroundSize: '20px 20px' }}
                />
                <CardTitle className="relative z-10">Agendamentos Gerais</CardTitle>
                <CardDescription className="relative z-10">
                  Auditoria de todas as consultas na plataforma.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 relative z-10 bg-card">
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
                <div className="overflow-x-auto">
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
                      ) : !appointments || appointments.length === 0 ? (
                        <TableEmpty message="Nenhum agendamento encontrado." />
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prescriptions" className="mt-4">
            <Card className="border shadow-sm relative overflow-hidden">
              <CardHeader className="bg-primary/5 border-b pb-4 relative">
                <div
                  className="absolute inset-0 pointer-events-none opacity-5"
                  style={{ ...patternStyle, backgroundSize: '20px 20px' }}
                />
                <CardTitle className="relative z-10">Receitas Prescritas</CardTitle>
                <CardDescription className="relative z-10">
                  Auditoria de prescrições médicas na plataforma.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 relative z-10 bg-card">
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
                <div className="overflow-x-auto">
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
                      ) : !prescriptions || prescriptions.length === 0 ? (
                        <TableEmpty colSpan={4} message="Nenhuma receita encontrada." />
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="professionals" className="mt-4">
            <Card className="border shadow-sm relative overflow-hidden">
              <CardHeader className="bg-primary/5 border-b pb-4 relative">
                <div
                  className="absolute inset-0 pointer-events-none opacity-5"
                  style={{ ...patternStyle, backgroundSize: '20px 20px' }}
                />
                <CardTitle className="relative z-10">Verificação de Profissionais</CardTitle>
                <CardDescription className="relative z-10">
                  Gerencie acesso e verifique o CRM dos médicos.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 relative z-10 bg-card">
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
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Profissional</TableHead>
                        <TableHead>E-mail</TableHead>
                        <TableHead>CRM / UF</TableHead>
                        <TableHead>Especialidade</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingProfs ? (
                        <TableLoading colSpan={6} />
                      ) : !professionals || professionals.length === 0 ? (
                        <TableEmpty
                          colSpan={6}
                          message="Nenhum profissional encontrado com os filtros aplicados."
                        />
                      ) : (
                        professionals.map((prof) => (
                          <TableRow key={prof.id}>
                            <TableCell className="font-medium">{prof.name || 'Sem nome'}</TableCell>
                            <TableCell>{prof.email}</TableCell>
                            <TableCell>
                              {prof.crm_number ? `${prof.crm_number} - ${prof.crm_state}` : 'N/A'}
                            </TableCell>
                            <TableCell>{prof.specialty || 'Não informada'}</TableCell>
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
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenEditDialog(prof)}
                                >
                                  Editar
                                </Button>
                                <Button
                                  variant={prof.is_blocked ? 'outline' : 'destructive'}
                                  size="sm"
                                  onClick={() => handleOpenBlockDialog(prof)}
                                >
                                  {prof.is_blocked ? 'Desbloquear' : 'Bloquear'}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="mt-4">
            <Card className="border shadow-sm relative overflow-hidden">
              <CardHeader className="bg-primary/5 border-b pb-4 relative">
                <div
                  className="absolute inset-0 pointer-events-none opacity-5"
                  style={{ ...patternStyle, backgroundSize: '20px 20px' }}
                />
                <CardTitle className="relative z-10">Histórico de Transações</CardTitle>
                <CardDescription className="relative z-10">
                  Auditoria de pagamentos e splits processados pela plataforma.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 relative z-10 bg-card">
                <div className="p-4 border-b">
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por paciente ou profissional..."
                      className="pl-9"
                      value={searchTermTx}
                      onChange={(e) => setSearchTermTx(e.target.value)}
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Paciente</TableHead>
                        <TableHead>Profissional / Empresa</TableHead>
                        <TableHead>Serviço / Categoria</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingTransactions ? (
                        <TableLoading colSpan={6} />
                      ) : !transactions || transactions.length === 0 ? (
                        <TableEmpty
                          colSpan={6}
                          message="Nenhuma transação encontrada com os filtros aplicados."
                        />
                      ) : (
                        transactions.map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell className="font-medium whitespace-nowrap">
                              {safeFormatDate(tx.created)}
                            </TableCell>
                            <TableCell>
                              {tx.expand?.appointment_id?.expand?.patient_id?.name ||
                                tx.expand?.employee_id?.name ||
                                'N/A'}
                            </TableCell>
                            <TableCell>
                              {tx.expand?.appointment_id?.expand?.professional_id?.name ||
                                tx.expand?.company_id?.name ||
                                'N/A'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {tx.category || 'Serviço'}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-semibold text-emerald-600">
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(tx.amount || 0)}
                            </TableCell>
                            <TableCell>
                              {tx.payment_status === 'confirmed' ? (
                                <Badge className="bg-emerald-500 hover:bg-emerald-600">
                                  Confirmado
                                </Badge>
                              ) : tx.payment_status === 'pending' ? (
                                <Badge
                                  variant="secondary"
                                  className="bg-amber-500/20 text-amber-700 hover:bg-amber-500/30"
                                >
                                  Pendente
                                </Badge>
                              ) : tx.payment_status === 'failed' ? (
                                <Badge variant="destructive">Falhou</Badge>
                              ) : (
                                <Badge variant="outline">{tx.payment_status || 'N/A'}</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
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
                  ? `Você está prestes a restaurar o acesso de ${selectedProf?.name || 'este profissional'}.`
                  : `Você está prestes a revogar o acesso de ${selectedProf?.name || 'este profissional'}.`}
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

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Profissional</DialogTitle>
              <DialogDescription>
                Atualize a especialidade médica de {selectedProf?.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="specialty">Especialidade</Label>
                <Input
                  id="specialty"
                  placeholder="Ex: Cardiologia, Pediatria..."
                  value={editSpecialty}
                  onChange={(e) => setEditSpecialty(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button onClick={handleSaveSpecialty} disabled={submitting}>
                {submitting ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default function AdminSupervisionPage() {
  return (
    <ErrorBoundary>
      <AdminSupervisionContent />
    </ErrorBoundary>
  )
}
