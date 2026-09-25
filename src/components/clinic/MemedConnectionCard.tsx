import { useState, useEffect, useCallback } from 'react'
import {
  FileCheck2,
  Plug,
  Unplug,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  FileSignature,
  Info,
  Calendar,
  Lock,
  Award,
  KeyRound,
  ShieldCheck,
  Check,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Terminal,
} from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  MemedConnectionStatus,
  MemedIntegrationRecord,
  MemedStatusResponse,
  MemedSandboxTestResponse,
  getDoctorMemedIntegration,
  getMemedServerStatus,
  getMemedAuthorizeUrl,
  exchangeMemedOAuthCallback,
  refreshMemedToken,
  testMemedSandbox,
  disconnectMemedAccount,
} from '@/services/memed'
import { useRealtime } from '@/hooks/use-realtime'

interface MemedConnectionCardProps {
  doctorId: string
  doctorName?: string
  crmNumber?: string
  crmState?: string
}

export function MemedConnectionCard({
  doctorId,
  doctorName,
  crmNumber,
  crmState,
}: MemedConnectionCardProps) {
  const [integration, setIntegration] = useState<MemedIntegrationRecord | null>(null)
  const [serverStatus, setServerStatus] = useState<MemedStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showErrorDetails, setShowErrorDetails] = useState(false)

  // Controle do Onboarding Guiado (Passos 1, 2 e 3)
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1)
  const [certificateConfirmed, setCertificateConfirmed] = useState(false)
  const [sandboxResult, setSandboxResult] = useState<MemedSandboxTestResponse | null>(null)
  const [testingSandbox, setTestingSandbox] = useState(false)
  const [showSimulationModal, setShowSimulationModal] = useState(false)

  const loadData = useCallback(async () => {
    if (!doctorId) return
    try {
      const [record, status] = await Promise.all([
        getDoctorMemedIntegration(doctorId),
        getMemedServerStatus().catch(() => null),
      ])
      setIntegration(record)
      if (status) {
        setServerStatus(status)
      }

      // Sincroniza passo ativo do onboarding baseado no progresso
      if (record?.connection_status === 'conectado') {
        // Se já está conectado, permite transitar para certificado ou sandbox
        if (localStorage.getItem(`vmed_memed_cert_${doctorId}`) === 'true') {
          setCertificateConfirmed(true)
          setActiveStep(3)
        } else {
          setActiveStep(2)
        }
      } else {
        setActiveStep(1)
      }
    } catch (err) {
      console.error('[MemedConnectionCard] Erro ao carregar dados:', err)
    } finally {
      setLoading(false)
    }
  }, [doctorId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Processa retorno de Callback OAuth se houver parâmetros na URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const action = params.get('action')
    const code = params.get('code')
    const state = params.get('state')

    if (action === 'oauth-callback' && code) {
      const handleCallback = async () => {
        setActionLoading(true)
        try {
          toast.loading('Finalizando autenticação segura com a Memed...', { id: 'memed-callback' })
          const res = await exchangeMemedOAuthCallback(code, state || '')
          toast.success(res.message || 'Conta Memed conectada com sucesso!', {
            id: 'memed-callback',
          })
          // Limpa query params da URL sem recarregar a página
          const newUrl =
            window.location.pathname +
            window.location.search
              .replace(/&action=oauth-callback&code=[^&]*/, '')
              .replace(/\?action=oauth-callback&code=[^&]*/, '')
          window.history.replaceState({}, '', newUrl)
          await loadData()
          setActiveStep(2)
        } catch (err: any) {
          console.error('[MemedConnectionCard] Erro no callback OAuth:', err)
          toast.error('Falha ao concluir autorização OAuth da Memed.', {
            id: 'memed-callback',
            description: err?.message || 'Tente iniciar a conexão novamente.',
          })
        } finally {
          setActionLoading(false)
        }
      }
      handleCallback()
    }
  }, [loadData])

  // Atualização em tempo real via PocketBase
  useRealtime('memed_integrations', (e) => {
    if (e.record.doctor_id === doctorId) {
      loadData()
    }
  })

  const currentStatus: MemedConnectionStatus = integration?.connection_status || 'desconectado'
  const isConfigured = serverStatus?.isConfigured ?? false

  // Iniciar fluxo de conexão
  const handleConnectClick = async () => {
    setActionLoading(true)
    try {
      const res = await getMemedAuthorizeUrl()

      if (res.isConfigured && res.authorizeUrl) {
        // Redirecionamento oficial para o portal OAuth da Memed
        toast.info('Redirecionando para o portal de login da Memed...')
        window.location.href = res.authorizeUrl
      } else {
        // Credenciais ainda não cadastradas (situação atual de homologação de parceiro)
        setShowSimulationModal(true)
      }
    } catch (err: any) {
      console.error('Erro ao iniciar conexão Memed:', err)
      toast.error('Falha de rede ao conectar à Memed.', {
        description: err?.message || 'Verifique sua conexão e tente novamente.',
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Tentar reconectar ou refresh
  const handleRetryOrRefresh = async () => {
    setActionLoading(true)
    try {
      if (currentStatus === 'erro' && serverStatus?.hasAccessToken) {
        toast.loading('Renovando token de acesso...', { id: 'memed-refresh' })
        const res = await refreshMemedToken()
        toast.success(res.message || 'Sessão renovada com sucesso!', { id: 'memed-refresh' })
        await loadData()
      } else {
        await handleConnectClick()
      }
    } catch (err: any) {
      console.error('Erro ao renovar token:', err)
      toast.error('Não foi possível renovar a conexão automaticamente.', {
        id: 'memed-refresh',
        description: err?.message || 'Reconecte sua conta para gerar novas credenciais.',
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Desconectar integração
  const handleDisconnect = async () => {
    setActionLoading(true)
    try {
      await disconnectMemedAccount()
      localStorage.removeItem(`vmed_memed_cert_${doctorId}`)
      setCertificateConfirmed(false)
      setActiveStep(1)
      await loadData()
      toast.success('Integração Memed desconectada com sucesso.', {
        description: 'Suas prescrições emitidas anteriormente continuam válidas e acessíveis.',
      })
    } catch (err: any) {
      console.error('Erro ao desconectar Memed:', err)
      toast.error('Erro ao desconectar da Memed.', {
        description: err?.message || 'Tente novamente.',
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Confirmar certificado digital (Passo 2)
  const handleConfirmCertificate = () => {
    setCertificateConfirmed(true)
    localStorage.setItem(`vmed_memed_cert_${doctorId}`, 'true')
    setActiveStep(3)
    toast.success('Certificado registrado com sucesso!', {
      description: 'Agora realize o teste em ambiente sandbox para validar o fluxo.',
    })
  }

  // Executar teste sandbox (Passo 3)
  const handleRunSandboxTest = async () => {
    setTestingSandbox(true)
    try {
      toast.loading('Executando teste no sandbox da Memed...', { id: 'memed-sandbox' })
      const res = await testMemedSandbox('CFM_VIDAAS')
      setSandboxResult(res)
      toast.success('Teste sandbox finalizado!', {
        id: 'memed-sandbox',
        description: res.message,
      })
      await loadData()
    } catch (err: any) {
      console.error('Erro no teste sandbox:', err)
      toast.error('Falha na execução do teste sandbox.', {
        id: 'memed-sandbox',
        description: err?.message || 'Tente novamente em instantes.',
      })
    } finally {
      setTestingSandbox(false)
    }
  }

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return '—'
    try {
      return format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    } catch {
      return dateStr
    }
  }

  const renderStatusBadge = () => {
    switch (currentStatus) {
      case 'conectado':
        return (
          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 px-3 py-1 font-medium shadow-sm">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Conectado
          </Badge>
        )
      case 'conectando':
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600 text-white gap-1.5 px-3 py-1 font-medium animate-pulse">
            <Clock className="h-3.5 w-3.5" />
            Conectando
          </Badge>
        )
      case 'erro':
        return (
          <Badge variant="destructive" className="gap-1.5 px-3 py-1 font-medium">
            <AlertCircle className="h-3.5 w-3.5" />
            Falha na Conexão
          </Badge>
        )
      case 'desconectado':
      default:
        return (
          <Badge
            variant="outline"
            className="text-muted-foreground border-dashed gap-1.5 px-3 py-1 font-medium"
          >
            <Unplug className="h-3.5 w-3.5 text-muted-foreground" />
            Desconectado
          </Badge>
        )
    }
  }

  const errorLogJson =
    integration?.error_log && Object.keys(integration.error_log).length > 0
      ? JSON.stringify(integration.error_log, null, 2)
      : null

  return (
    <div className="space-y-6">
      {/* CARD PRINCIPAL DA INTEGRAÇÃO */}
      <Card className="border-border/60 shadow-sm overflow-hidden bg-card transition-all">
        <div className="h-1.5 bg-gradient-to-r from-emerald-600 via-[#14805A] to-teal-600" />
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#14805A] border border-emerald-200/50 dark:border-emerald-900/50">
                <FileSignature className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl font-bold tracking-tight">
                    Prescrição Digital — Memed
                  </CardTitle>
                </div>
                <CardDescription className="text-sm mt-0.5">
                  Emita receitas inteligentes com catálogo clínico integrado, assinatura ICP-Brasil
                  e dispensação em farmácias.
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center">
              {renderStatusBadge()}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={loadData}
                disabled={loading || actionLoading}
                title="Atualizar dados da integração"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 pt-0">
          {/* Alerta de credenciais de parceiro não configuradas */}
          {!isConfigured && (
            <Alert className="bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-foreground">
              <Info className="h-4 w-4 text-amber-700 dark:text-amber-400 mt-0.5" />
              <AlertTitle className="text-amber-800 dark:text-amber-300 font-semibold text-sm">
                Credenciamento de Parceiro Memed em Homologação
              </AlertTitle>
              <AlertDescription className="text-xs text-muted-foreground mt-1 leading-relaxed">
                As chaves de parceiro da Memed (<code>MEMED_CLIENT_ID</code> e{' '}
                <code>MEMED_CLIENT_SECRET</code>) ainda não foram cadastradas no backend Skip Cloud.
                Você pode conhecer os 3 passos do onboarding, testar a assinatura em modo simulado e
                orientar seu certificado digital. Assim que os segredos forem cadastrados, o fluxo
                OAuth com os servidores oficiais da Memed funcionará sem necessidade de atualização
                no código.
              </AlertDescription>
            </Alert>
          )}

          {/* ONBOARDING GUIADO EM 3 PASSOS */}
          <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-[#14805A]" />
                  Onboarding Guiado de Prescrição Digital (3 Passos)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Siga os passos abaixo para habilitar a emissão de receitas com validade jurídica
                  nacional.
                </p>
              </div>
              <Badge variant="secondary" className="text-xs self-start sm:self-center">
                Passo {activeStep} de 3
              </Badge>
            </div>

            {/* Stepper visual */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Passo 1 */}
              <div
                onClick={() => setActiveStep(1)}
                className={`cursor-pointer rounded-lg p-3 border transition-all text-left ${
                  activeStep === 1
                    ? 'border-[#14805A] bg-emerald-50/50 dark:bg-emerald-950/30 ring-1 ring-[#14805A]'
                    : currentStatus === 'conectado'
                      ? 'border-emerald-300 bg-emerald-50/20 dark:bg-emerald-950/10'
                      : 'border-border/50 bg-background/50 hover:bg-muted/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        currentStatus === 'conectado'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {currentStatus === 'conectado' ? <Check className="h-3.5 w-3.5" /> : '1'}
                    </div>
                    <span className="text-xs font-semibold text-foreground">Conectar Conta</span>
                  </div>
                  {currentStatus === 'conectado' && (
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] h-5">
                      OK
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                  Autorização OAuth com a Memed via login seguro server-to-server.
                </p>
              </div>

              {/* Passo 2 */}
              <div
                onClick={() => setActiveStep(2)}
                className={`cursor-pointer rounded-lg p-3 border transition-all text-left ${
                  activeStep === 2
                    ? 'border-[#14805A] bg-emerald-50/50 dark:bg-emerald-950/30 ring-1 ring-[#14805A]'
                    : certificateConfirmed
                      ? 'border-emerald-300 bg-emerald-50/20 dark:bg-emerald-950/10'
                      : 'border-border/50 bg-background/50 hover:bg-muted/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        certificateConfirmed
                          ? 'bg-emerald-600 text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {certificateConfirmed ? <Check className="h-3.5 w-3.5" /> : '2'}
                    </div>
                    <span className="text-xs font-semibold text-foreground">Certificado ICP</span>
                  </div>
                  {certificateConfirmed && (
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] h-5">
                      Habilitado
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                  Orientação para emissão gratuita via AR-CFM ou certificado em nuvem.
                </p>
              </div>

              {/* Passo 3 */}
              <div
                onClick={() => setActiveStep(3)}
                className={`cursor-pointer rounded-lg p-3 border transition-all text-left ${
                  activeStep === 3
                    ? 'border-[#14805A] bg-emerald-50/50 dark:bg-emerald-950/30 ring-1 ring-[#14805A]'
                    : sandboxResult?.success
                      ? 'border-emerald-300 bg-emerald-50/20 dark:bg-emerald-950/10'
                      : 'border-border/50 bg-background/50 hover:bg-muted/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        sandboxResult?.success
                          ? 'bg-emerald-600 text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {sandboxResult?.success ? <Check className="h-3.5 w-3.5" /> : '3'}
                    </div>
                    <span className="text-xs font-semibold text-foreground">Teste Sandbox</span>
                  </div>
                  {sandboxResult?.success && (
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] h-5">
                      Validado
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                  Simulação de assinatura digital e validação dos dados de emissão.
                </p>
              </div>
            </div>

            {/* CONTEÚDO DO PASSO ATIVO */}
            <div className="pt-2">
              {/* PASSO 1: CONECTAR CONTA */}
              {activeStep === 1 && (
                <div className="space-y-3 bg-card p-4 rounded-xl border border-border/60">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                        <KeyRound className="h-4 w-4 text-[#14805A]" />
                        Passo 1: Vinculação de Conta e Fluxo OAuth
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Conecte seu cadastro de médico credenciado à Memed. A comunicação é
                        realizada exclusivamente através de chamadas server-to-server seguras do
                        backend V MED.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-muted/30 p-3 rounded-lg border border-border/40">
                    <div>
                      <span className="text-muted-foreground font-medium">Médico Credenciado:</span>
                      <p className="font-semibold text-foreground">
                        {doctorName || 'Não identificado'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground font-medium">
                        CRM do Profissional:
                      </span>
                      <p className="font-semibold text-foreground">
                        {crmNumber
                          ? `${crmNumber}/${crmState || 'BR'}`
                          : 'Pendente de preenchimento no perfil'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Tokens de acesso salvos com isolamento criptográfico no backend.</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {currentStatus === 'conectado' ? (
                        <Button
                          size="sm"
                          onClick={() => setActiveStep(2)}
                          className="bg-[#14805A] hover:bg-[#116d4c] text-white text-xs gap-1.5"
                        >
                          Avançar para Passo 2 (Certificado) <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={handleConnectClick}
                          disabled={actionLoading}
                          className="bg-[#14805A] hover:bg-[#116d4c] text-white text-xs gap-2"
                        >
                          <Plug className="h-4 w-4" />
                          {actionLoading ? 'Conectando...' : 'Iniciar Conexão Memed'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* PASSO 2: HABILITAR CERTIFICADO ICP-BRASIL */}
              {activeStep === 2 && (
                <div className="space-y-4 bg-card p-4 rounded-xl border border-border/60">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                      <Award className="h-4 w-4 text-[#14805A]" />
                      Passo 2: Habilitar Certificado Digital de Assinatura (ICP-Brasil)
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Para emitir prescrições digitais legalmente aceitas em farmácias (inclusive
                      controlados e antimicrobianos), todo médico precisa de um certificado digital
                      padrão ICP-Brasil (A1, A3 ou Nuvem).
                    </p>
                  </div>

                  {/* Card do Certificado Gratuito CFM */}
                  <div className="p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2.5">
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0 mt-0.5">
                        <Award className="h-4 w-4" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          Certificado Digital Gratuito do CFM (AR-CFM)
                          <Badge
                            variant="outline"
                            className="text-[10px] text-emerald-700 dark:text-emerald-300 border-emerald-400"
                          >
                            100% Gratuito
                          </Badge>
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          O Conselho Federal de Medicina oferece <strong>gratuitamente</strong> a
                          todos os médicos com CRM regular um certificado digital em nuvem (ou A1)
                          emitido pela Autoridade de Registro AR-CFM.
                        </p>
                      </div>
                    </div>

                    <div className="pt-1 flex flex-wrap gap-2">
                      <a
                        href="https://prescricaoeletronica.cfm.org.br"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-[#14805A] hover:bg-[#116d4c] px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Emitir Certificado Grátis no CFM <ExternalLink className="h-3 w-3" />
                      </a>
                      <a
                        href="https://prescricao.cfm.org.br"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-border/70 bg-background/50 transition-colors"
                      >
                        Portal de Prescrição CFM <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>

                  {/* Provedores em nuvem compatíveis */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-[#14805A]" />
                      Provedores de Nuvem Homologados na Memed:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg border border-border/50 bg-muted/20 text-center">
                        <p className="font-semibold text-foreground">VIDaaS</p>
                        <span className="text-[10px] text-muted-foreground">Valid Cloud</span>
                      </div>
                      <div className="p-2.5 rounded-lg border border-border/50 bg-muted/20 text-center">
                        <p className="font-semibold text-foreground">BirdID</p>
                        <span className="text-[10px] text-muted-foreground">Soluti Nuvem</span>
                      </div>
                      <div className="p-2.5 rounded-lg border border-border/50 bg-muted/20 text-center">
                        <p className="font-semibold text-foreground">SafeID</p>
                        <span className="text-[10px] text-muted-foreground">Safeweb</span>
                      </div>
                      <div className="p-2.5 rounded-lg border border-border/50 bg-muted/20 text-center">
                        <p className="font-semibold text-foreground">Token/Smartcard</p>
                        <span className="text-[10px] text-muted-foreground">
                          Certisign / Serasa
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-border/50">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveStep(1)}
                      className="text-xs"
                    >
                      ← Voltar ao Passo 1
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleConfirmCertificate}
                      className="bg-[#14805A] hover:bg-[#116d4c] text-white text-xs gap-1.5"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Já possuo certificado habilitado / Avançar para o Teste
                    </Button>
                  </div>
                </div>
              )}

              {/* PASSO 3: TESTE DE ASSINATURA EM SANDBOX */}
              {activeStep === 3 && (
                <div className="space-y-4 bg-card p-4 rounded-xl border border-border/60">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                      <Terminal className="h-4 w-4 text-[#14805A]" />
                      Passo 3: Teste de Assinatura e Validação em Ambiente Sandbox
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Execute uma chamada de validação segura para certificar que seus dados
                      clínicos (nome, CRM, UF) e a assinatura digital estão aptos a gerar
                      prescrições com dispensação farmacêutica.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-muted/30 border border-border/60 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-medium">Ambiente do Teste:</span>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {serverStatus?.environment?.toUpperCase() || 'SANDBOX'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-medium">
                        Certificado Testado:
                      </span>
                      <span className="font-semibold text-foreground">
                        VIDaaS / ICP-Brasil Nuvem
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-medium">CRM a Validar:</span>
                      <span className="font-semibold text-foreground">
                        {crmNumber ? `${crmNumber}/${crmState || 'BR'}` : 'Não cadastrado'}
                      </span>
                    </div>
                  </div>

                  {/* Resultado do Teste Sandbox */}
                  {sandboxResult && (
                    <div
                      className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                        sandboxResult.testStatus === 'passed'
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-foreground'
                          : 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-semibold">
                        <CheckCircle2 className="h-4 w-4 text-[#14805A]" />
                        <span>{sandboxResult.message}</span>
                      </div>
                      {sandboxResult.details && (
                        <div className="text-[11px] text-muted-foreground space-y-1 pt-1 font-mono">
                          <p>• Médico: {sandboxResult.details.doctorName}</p>
                          <p>• CRM: {sandboxResult.details.crm}</p>
                          <p>
                            • Modo:{' '}
                            {sandboxResult.mode === 'simulation'
                              ? 'Simulação Estrutural'
                              : 'Sandbox Oficial Memed'}
                          </p>
                          {sandboxResult.details.simulatedAt && (
                            <p>
                              • Executado em: {formatDateDisplay(sandboxResult.details.simulatedAt)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-border/50">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveStep(2)}
                      className="text-xs"
                    >
                      ← Voltar ao Passo 2
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleRunSandboxTest}
                      disabled={testingSandbox}
                      className="bg-[#14805A] hover:bg-[#116d4c] text-white text-xs gap-2"
                    >
                      <Terminal className="h-3.5 w-3.5" />
                      {testingSandbox ? 'Executando Teste Sandbox...' : 'Executar Teste no Sandbox'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* DADOS TÉCNICOS DA CONEXÃO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-muted/30 p-3.5 rounded-xl border border-border/50 text-xs">
            <div className="space-y-1">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <Lock className="h-3 w-3" /> ID da Conta Memed
              </span>
              <p className="font-mono font-medium text-foreground truncate">
                {integration?.memed_account_id ? integration.memed_account_id : 'Não vinculada'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Conectado em
              </span>
              <p className="font-medium text-foreground">
                {formatDateDisplay(integration?.connected_at)}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <RefreshCw className="h-3 w-3" /> Última Sincronização
              </span>
              <p className="font-medium text-foreground">
                {formatDateDisplay(integration?.last_sync || integration?.updated)}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <FileCheck2 className="h-3 w-3" /> CRM do Profissional
              </span>
              <p className="font-medium text-foreground">
                {crmNumber ? `${crmNumber}/${crmState || 'BR'}` : 'Não informado'}
              </p>
            </div>
          </div>

          {/* SEÇÃO DE ERRO E LOGS (QUANDO STATUS FOR 'ERRO') */}
          {currentStatus === 'erro' && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-destructive">
                    Falha identificada na integração Memed
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Ocorreu uma falha na autenticação ou na renovação de token da Memed. Você pode
                    tentar uma renovação silenciosa com um clique ou reconectar sua conta.
                  </p>
                </div>
              </div>

              {errorLogJson && (
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowErrorDetails(!showErrorDetails)}
                    className="h-7 text-xs font-medium text-destructive hover:bg-destructive/10 px-2"
                  >
                    {showErrorDetails ? (
                      <>
                        <ChevronUp className="h-3.5 w-3.5 mr-1" /> Ocultar detalhes técnicos
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3.5 w-3.5 mr-1" /> Ver detalhes técnicos (Log)
                      </>
                    )}
                  </Button>

                  {showErrorDetails && (
                    <pre className="mt-2 p-3 bg-background/80 rounded-lg border border-destructive/30 text-[11px] font-mono text-destructive overflow-x-auto max-h-48 whitespace-pre-wrap">
                      {errorLogJson}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}

          {/* BENEFÍCIOS DO MÓDULO */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
            <div className="p-3 rounded-lg border border-border/40 bg-background/50 flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-[#14805A] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-foreground">Catálogo Clínico 60k+</p>
                <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                  Medicamentos atualizados com posologias, bulas e alertas de interação
                  medicamentosa.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border/40 bg-background/50 flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-[#14805A] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-foreground">Assinatura ICP-Brasil</p>
                <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                  Validade jurídica com suporte a certificados A1/A3 e nuvem (BirdID, VIDaaS,
                  SafeID).
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border/40 bg-background/50 flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-[#14805A] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-foreground">
                  Dispensação em 36k Farmácias
                </p>
                <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                  Paciente recebe por WhatsApp e SMS com link interativo aceito em farmácias de todo
                  o Brasil.
                </p>
              </div>
            </div>
          </div>
        </CardContent>

        {/* RODAPÉ DO CARD COM AÇÕES */}
        <CardFooter className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-border/50 bg-muted/10 py-3.5 px-6">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-[#14805A]" />
            <span>Ecossistema V MED BRASIL + Memed</span>
            <a
              href="https://memed.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-[#14805A] hover:underline ml-1 font-medium"
            >
              Sobre a Memed <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="flex items-center gap-2">
            {currentStatus === 'desconectado' ? (
              <Button
                onClick={handleConnectClick}
                disabled={actionLoading}
                className="bg-[#14805A] hover:bg-[#116d4c] text-white font-medium shadow-sm gap-2"
              >
                <Plug className="h-4 w-4" />
                Conectar Memed
              </Button>
            ) : (
              <>
                {currentStatus === 'conectando' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetryOrRefresh}
                    disabled={actionLoading}
                    className="text-xs"
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1" />
                    Tentar Conectar Novamente
                  </Button>
                )}

                {currentStatus === 'erro' && (
                  <Button
                    onClick={handleRetryOrRefresh}
                    disabled={actionLoading}
                    className="bg-[#14805A] hover:bg-[#116d4c] text-white text-xs gap-1.5"
                    size="sm"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Reconectar com 1 Clique
                  </Button>
                )}

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={actionLoading}
                      className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive gap-1.5"
                    >
                      <Unplug className="h-3.5 w-3.5" />
                      Desconectar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Desconectar da Memed?</AlertDialogTitle>
                      <AlertDialogDescription className="space-y-2 text-sm">
                        <p>
                          Ao desconectar, o conector oficial da Memed será desvinculado deste
                          painel.
                        </p>
                        <p className="font-medium text-foreground">
                          Importante: Todas as receitas digitais emitidas anteriormente permanecem
                          válidas para os pacientes e aceitas na rede de farmácias com seus QR Codes
                          e assinaturas digitais ICP-Brasil.
                        </p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDisconnect}
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                      >
                        Confirmar Desconexão
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* MODAL EXPLICATIVO QUANDO CREDENCIAIS DE PARCEIRO AINDA NÃO FORAM CADASTRADAS */}
      <Dialog open={showSimulationModal} onOpenChange={setShowSimulationModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-5 w-5 text-[#14805A]" />
              Conexão Memed: Credenciamento em Andamento
            </DialogTitle>
            <DialogDescription className="text-xs">
              Orientações sobre o credenciamento de parceiro e destravamento automático.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-1 text-xs">
            <Alert className="bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800">
              <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertTitle className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                Aguardando Chaves de Parceiro (Memed Med.Studio)
              </AlertTitle>
              <AlertDescription className="text-xs text-muted-foreground mt-1 leading-relaxed">
                O e-mail de formalização com o especialista de parcerias da Memed está pendente de
                resposta. Toda a infraestrutura técnica (OAuth 2.0, troca de token server-side,
                refresh e auditoria) já está pronta.
              </AlertDescription>
            </Alert>

            <div className="space-y-1.5 p-3 rounded-lg bg-muted/40 border">
              <p className="font-semibold text-foreground">O que acontece agora?</p>
              <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                <li>
                  Você pode avançar nos <strong>Passos 2 e 3</strong> do onboarding guiado acima.
                </li>
                <li>Obtenha seu certificado gratuito na AR-CFM (Passo 2).</li>
                <li>
                  Assim que o administrador cadastrar as credenciais nos segredos do backend, o
                  botão <strong>Conectar Memed</strong> redirecionará diretamente ao login oficial
                  da Memed sem necessidade de nova versão do app.
                </li>
              </ul>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowSimulationModal(false)}
            >
              Entendido
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setShowSimulationModal(false)
                setActiveStep(2)
              }}
              className="bg-[#14805A] hover:bg-[#116d4c] text-white"
            >
              Ir para Passo 2 (Certificado)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
