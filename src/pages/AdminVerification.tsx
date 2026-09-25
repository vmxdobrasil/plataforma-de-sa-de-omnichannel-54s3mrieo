import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useNavigate } from 'react-router-dom'
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
import { useToast } from '@/hooks/use-toast'
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  Eye,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  getPendingCrmVerifications,
  getProfessionalVerifications,
  reviewCrmVerification,
  type ProfessionalVerificationRecord,
} from '@/services/crm-validation'
import { getProfessionals, verifyProfessional } from '@/services/users'

export default function AdminVerification() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [professionals, setProfessionals] = useState<any[]>([])
  const [pendingVerifications, setPendingVerifications] = useState<
    ProfessionalVerificationRecord[]
  >([])
  const [allVerifications, setAllVerifications] = useState<ProfessionalVerificationRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Modal de revisão manual justificada
  const [selectedVerification, setSelectedVerification] =
    useState<ProfessionalVerificationRecord | null>(null)
  const [reviewDecision, setReviewDecision] = useState<'approve' | 'reject' | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    if (!user) return
    if (user.role !== 'admin' && user.role !== 'medical_director') {
      navigate('/')
      return
    }
    loadData()
  }, [user, navigate])

  const loadData = async () => {
    setLoading(true)
    try {
      const [profs, pending, all] = await Promise.all([
        getProfessionals(),
        getPendingCrmVerifications(),
        getProfessionalVerifications(),
      ])
      setProfessionals(profs)
      setPendingVerifications(pending)
      setAllVerifications(all)
    } catch (error) {
      console.error('[AdminVerification] Erro ao carregar dados:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar a lista de profissionais e verificações.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleVerify = async (id: string, currentStatus: boolean) => {
    try {
      await verifyProfessional(id, !currentStatus)
      setProfessionals((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_verified: !currentStatus } : p)),
      )
      toast({
        title: 'Status atualizado',
        description: `Profissional ${!currentStatus ? 'verificado' : 'desverificado'} com sucesso.`,
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível atualizar o status.',
      })
    }
  }

  const openReviewModal = (
    record: ProfessionalVerificationRecord,
    decision: 'approve' | 'reject',
  ) => {
    setSelectedVerification(record)
    setReviewDecision(decision)
    setAdminNotes(
      decision === 'approve'
        ? 'Inscrição regular confirmada mediante conferência documental e certidão de quitação.'
        : 'Inscrição reprovada por inconsistência cadastral ou documentação vencida.',
    )
  }

  const handleConfirmReview = async () => {
    if (!selectedVerification || !reviewDecision) return
    if (!adminNotes.trim()) {
      toast({
        variant: 'destructive',
        title: 'Justificativa obrigatória',
        description:
          'Por conformidade CFM, é obrigatório registrar a justificativa técnica da decisão.',
      })
      return
    }

    setSubmittingReview(true)
    try {
      await reviewCrmVerification({
        verificationId: selectedVerification.id,
        approved: reviewDecision === 'approve',
        userId: selectedVerification.user,
        adminNotes: adminNotes.trim(),
        crmSituacao: reviewDecision === 'approve' ? 'ativo' : 'suspenso',
      })

      toast({
        title: reviewDecision === 'approve' ? 'CRM Aprovado' : 'CRM Rejeitado',
        description: `Decisão administrativa registrada com sucesso em auditoria.`,
      })

      setSelectedVerification(null)
      setReviewDecision(null)
      loadData()
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar revisão',
        description: err.message || 'Falha ao registrar decisão.',
      })
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando painel de verificação CFM...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Verificação & Regularidade CFM</h1>
          <p className="text-muted-foreground mt-1">
            Fila de validação de CRM e conformidade médica com as Resoluções CFM 2.129/15 e
            2.309/22.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-1.5" /> Atualizar
          </Button>
          <div className="p-3 bg-primary/10 rounded-xl text-primary">
            <Shield className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border bg-card">
          <p className="text-xs font-medium text-muted-foreground uppercase">
            Pendentes de Validação
          </p>
          <h3 className="text-2xl font-bold mt-1 text-amber-600">{pendingVerifications.length}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Requerem conferência manual ou certidão
          </p>
        </div>
        <div className="p-4 rounded-xl border bg-card">
          <p className="text-xs font-medium text-muted-foreground uppercase">Médicos Cadastrados</p>
          <h3 className="text-2xl font-bold mt-1">{professionals.length}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Total de contas no perfil profissional
          </p>
        </div>
        <div className="p-4 rounded-xl border bg-card">
          <p className="text-xs font-medium text-muted-foreground uppercase">
            Histórico de Verificações
          </p>
          <h3 className="text-2xl font-bold mt-1 text-emerald-600">{allVerifications.length}</h3>
          <p className="text-xs text-muted-foreground mt-1">Registros no histórico com auditoria</p>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="pending" className="relative">
            Fila Manual / Pendentes
            {pendingVerifications.length > 0 && (
              <Badge variant="destructive" className="ml-2 px-1.5 py-0 text-[10px]">
                {pendingVerifications.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="professionals">Todos os Médicos ({professionals.length})</TabsTrigger>
          <TabsTrigger value="history">Log Geral de Validações</TabsTrigger>
        </TabsList>

        {/* ABA 1: FILA DE PENDENTES */}
        <TabsContent value="pending" className="space-y-4">
          <div className="border rounded-lg bg-card overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Profissional</TableHead>
                  <TableHead>CRM / UF</TableHead>
                  <TableHead>Situação CFM</TableHead>
                  <TableHead>Status Validação</TableHead>
                  <TableHead>Divergência / Obs.</TableHead>
                  <TableHead className="text-right">Ação Justificada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingVerifications.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-semibold">
                        {item.expand?.user?.name || item.nome_cfm || 'Sem nome'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.expand?.user?.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {item.crm_numero}/{item.crm_uf}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={item.crm_situacao === 'ativo' ? 'default' : 'destructive'}
                        className="uppercase text-[11px]"
                      >
                        {item.crm_situacao}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="text-amber-700 bg-amber-100 dark:bg-amber-950/40"
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        {item.status_validacao.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {item.divergencia_nome && (
                        <p className="text-xs font-semibold text-amber-600 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          Divergência de Nome Detectada
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground truncate">
                        {item.observacoes_admin || 'Aguardando revisão'}
                      </p>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-emerald-600 hover:bg-emerald-700 h-8"
                        onClick={() => openReviewModal(item, 'approve')}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8"
                        onClick={() => openReviewModal(item, 'reject')}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Reprovar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {pendingVerifications.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-60" />
                      Nenhuma validação pendente na fila. Todos os médicos ativos estão
                      regularizados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ABA 2: LISTAGEM GERAL DE MÉDICOS */}
        <TabsContent value="professionals" className="space-y-4">
          <div className="border rounded-lg bg-card overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Profissional</TableHead>
                  <TableHead>CRM</TableHead>
                  <TableHead>Estado (UF)</TableHead>
                  <TableHead>Situação Cadastral</TableHead>
                  <TableHead>Permissão de Atendimento</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {professionals.map((prof) => (
                  <TableRow key={prof.id}>
                    <TableCell>
                      <div className="font-medium">{prof.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {prof.specialty || 'Clínico'}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{prof.crm_number || '-'}</TableCell>
                    <TableCell>{prof.crm_state || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={prof.crm_situacao === 'ativo' ? 'outline' : 'destructive'}
                        className="uppercase text-[11px]"
                      >
                        {prof.crm_situacao || (prof.is_verified ? 'ativo' : 'em_analise')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {prof.is_verified ? (
                        <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700">
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          Habilitado
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="text-red-700 bg-red-100 dark:bg-red-950/40"
                        >
                          <ShieldAlert className="h-3 w-3 mr-1" />
                          Bloqueado
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant={prof.is_verified ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => handleToggleVerify(prof.id, prof.is_verified)}
                      >
                        {prof.is_verified ? 'Revogar Acesso' : 'Habilitar Atendimento'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {professionals.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum profissional encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ABA 3: HISTÓRICO DE VALIDAÇÕES */}
        <TabsContent value="history" className="space-y-4">
          <div className="border rounded-lg bg-card overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Data / Hora</TableHead>
                  <TableHead>CRM / UF</TableHead>
                  <TableHead>Nome Retornado CFM</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Fonte</TableHead>
                  <TableHead>Resultado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allVerifications.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(item.created).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="font-mono">
                      {item.crm_numero}/{item.crm_uf}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {item.nome_cfm || '-'}
                      {item.divergencia_nome && (
                        <span className="text-amber-600 text-xs ml-2 font-normal">
                          ⚠️ divergência
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={item.crm_situacao === 'ativo' ? 'outline' : 'destructive'}
                        className="uppercase text-[10px]"
                      >
                        {item.crm_situacao}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {item.fonte_validacao}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={item.status_validacao === 'validado' ? 'default' : 'secondary'}
                        className="text-[11px] uppercase"
                      >
                        {item.status_validacao.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {allVerifications.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum registro de auditoria encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* MODAL DE REVISÃO MANUAL JUSTIFICADA */}
      <Dialog open={!!selectedVerification} onOpenChange={() => setSelectedVerification(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {reviewDecision === 'approve' ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Aprovar Inscrição Médica
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-600" />
                  Rejeitar / Suspender Inscrição
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              CRM {selectedVerification?.crm_numero}/{selectedVerification?.crm_uf} — Médico:{' '}
              {selectedVerification?.expand?.user?.name || selectedVerification?.nome_cfm}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-muted/40 p-3 text-xs space-y-1">
              <p>
                <strong>Nome Informado:</strong> {selectedVerification?.expand?.user?.name}
              </p>
              <p>
                <strong>Nome no CFM:</strong> {selectedVerification?.nome_cfm || 'Não retornado'}
              </p>
              <p>
                <strong>Especialidade:</strong> {selectedVerification?.crm_especialidade || 'Geral'}
              </p>
              {selectedVerification?.divergencia_nome && (
                <p className="text-amber-600 font-semibold">
                  ⚠️ Divergência relevante de grafia detectada pelo algoritmo.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-notes">Justificativa Técnica do Diretor Médico / Admin *</Label>
              <Textarea
                id="admin-notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Insira a justificativa regulatória e a verificação de certidão..."
                className="min-h-[90px]"
              />
              <p className="text-[11px] text-muted-foreground">
                Esta ação será assinada eletronicamente e salva de forma imutável na trilha de
                auditoria (`audit_logs`).
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedVerification(null)}
              disabled={submittingReview}
            >
              Cancelar
            </Button>
            <Button
              variant={reviewDecision === 'approve' ? 'default' : 'destructive'}
              className={reviewDecision === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
              onClick={handleConfirmReview}
              disabled={submittingReview || !adminNotes.trim()}
            >
              {submittingReview ? 'Registrando...' : 'Confirmar Decisão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
