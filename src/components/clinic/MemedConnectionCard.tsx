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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  MemedConnectionStatus,
  MemedIntegrationRecord,
  getDoctorMemedIntegration,
  saveDoctorMemedIntegration,
  disconnectDoctorMemed,
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
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showErrorDetails, setShowErrorDetails] = useState(false)
  const [connectModalOpen, setConnectModalOpen] = useState(false)
  const [manualAccountId, setManualAccountId] = useState('')

  const loadIntegration = useCallback(async () => {
    if (!doctorId) return
    try {
      const rec = await getDoctorMemedIntegration(doctorId)
      setIntegration(rec)
      if (rec?.memed_account_id) {
        setManualAccountId(rec.memed_account_id)
      }
    } catch (err) {
      console.error('Erro ao carregar integração Memed:', err)
    } finally {
      setLoading(false)
    }
  }, [doctorId])

  useEffect(() => {
    loadIntegration()
  }, [loadIntegration])

  // Atualização em tempo real caso o status mude via backend/webhook
  useRealtime('memed_integrations', (e) => {
    if (e.record.doctor_id === doctorId) {
      loadIntegration()
    }
  })

  const currentStatus: MemedConnectionStatus = integration?.connection_status || 'desconectado'

  const handleStartConnectFlow = () => {
    setConnectModalOpen(true)
  }

  const handleConfirmConnect = async () => {
    if (!doctorId) return
    setActionLoading(true)
    try {
      // Como o credenciamento Memed está em andamento, atualizamos o status para "conectando"
      // e persistimos opcionalmente o ID informado para testes
      const now = new Date().toISOString()
      const updated = await saveDoctorMemedIntegration(doctorId, {
        connection_status: 'conectando',
        memed_account_id: manualAccountId.trim() || integration?.memed_account_id || undefined,
        last_sync: now,
      })
      setIntegration(updated)
      setConnectModalOpen(false)
      toast.info('Solicitação de conexão iniciada!', {
        description:
          'Seu status foi alterado para "Conectando". A ativação definitiva será concluída assim que as credenciais Memed forem liberadas.',
      })
    } catch (err: any) {
      console.error('Erro ao iniciar conexão Memed:', err)
      toast.error('Não foi possível iniciar a conexão com a Memed.', {
        description: err?.message || 'Tente novamente em instantes.',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDisconnect = async () => {
    if (!doctorId) return
    setActionLoading(true)
    try {
      const res = await disconnectDoctorMemed(doctorId)
      setIntegration(res)
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
          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 px-3 py-1 font-medium">
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
                Emita receitas inteligentes com catálogo clínico integrado, assinatura ICP-Brasil e
                dispensação em farmácias.
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center">
            {renderStatusBadge()}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={loadIntegration}
              disabled={loading || actionLoading}
              title="Atualizar dados da integração"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* Banner Informativo de Parceria/Credenciamento em Andamento */}
        {currentStatus !== 'conectado' && (
          <Alert className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-foreground">
            <Info className="h-4 w-4 text-[#14805A]" />
            <AlertTitle className="text-[#14805A] font-semibold text-sm">
              Credenciamento de Parceiro Memed em Andamento
            </AlertTitle>
            <AlertDescription className="text-xs text-muted-foreground mt-1 leading-relaxed">
              A V MED BRASIL está formalizando as credenciais de parceiro desenvolvedor junto à
              Memed. Ao clicar em <strong>Conectar Memed</strong>, seu perfil fica pré-vinculado e o
              conector será ativado automaticamente assim que a chave de sandbox/produção for
              liberada.
            </AlertDescription>
          </Alert>
        )}

        {/* Informações detalhadas da conexão */}
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
              {crmNumber ? `${crmNumber}/${crmState || 'BR'}` : 'Não informado no perfil'}
            </p>
          </div>
        </div>

        {/* Seção de Erro (quando status for 'erro') */}
        {currentStatus === 'erro' && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-destructive">
                  Falha identificada na integração Memed
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Ocorreu um erro na autenticação ou na comunicação com a API da Memed. Verifique os
                  detalhes do log abaixo ou tente reconectar.
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

        {/* Recursos da Integração Memed */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
          <div className="p-3 rounded-lg border border-border/40 bg-background/50 flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-[#14805A] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-foreground">Catálogo Clínico 60k+</p>
              <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                Medicamentos atualizados com posologias, bulas e alertas de interação medicamentosa.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-border/40 bg-background/50 flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-[#14805A] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-foreground">Assinatura Digital ICP-Brasil</p>
              <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                Validade jurídica com suporte a certificados A1/A3 e nuvem (BirdID, VIDaaS, SafeID).
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-border/40 bg-background/50 flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-[#14805A] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-foreground">Dispensação em 36k Farmácias</p>
              <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                Paciente recebe por WhatsApp e SMS com link interativo aceito em farmácias de todo o
                Brasil.
              </p>
            </div>
          </div>
        </div>
      </CardContent>

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
              onClick={handleStartConnectFlow}
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
                  onClick={handleStartConnectFlow}
                  disabled={actionLoading}
                  className="text-xs"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  Atualizar Dados de Conexão
                </Button>
              )}

              {currentStatus === 'erro' && (
                <Button
                  onClick={handleStartConnectFlow}
                  disabled={actionLoading}
                  className="bg-[#14805A] hover:bg-[#116d4c] text-white text-xs gap-1.5"
                  size="sm"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Tentar Reconectar
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
                        Ao desconectar, o módulo embutido da Memed será desvinculado deste painel.
                      </p>
                      <p className="font-medium text-foreground">
                        Importante: Todas as receitas digitais emitidas anteriormente permanecem
                        válidas para os pacientes e aceitas na rede de farmácias com seus QR Codes e
                        assinaturas digitais ICP-Brasil.
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

      {/* Modal explicativo de Conexão com a Memed */}
      <Dialog open={connectModalOpen} onOpenChange={setConnectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <FileSignature className="h-5 w-5 text-[#14805A]" />
              Conectar Prescrição Digital Memed
            </DialogTitle>
            <DialogDescription className="text-xs">
              Vincule sua conta médica ao módulo oficial da Memed na V MED BRASIL.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <Alert className="bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50">
              <Info className="h-4 w-4 text-[#14805A]" />
              <AlertTitle className="text-xs font-semibold text-[#14805A]">
                Ambiente de Integração Preparado
              </AlertTitle>
              <AlertDescription className="text-xs text-muted-foreground mt-1 leading-relaxed">
                As credenciais de parceiro desenvolvedor junto à Memed estão em fase de homologação
                comercial. Ao prosseguir, seu status mudará para <strong>Conectando</strong> e nossa
                equipe técnica ativará o conector completo assim que as chaves forem liberadas pela
                Memed.
              </AlertDescription>
            </Alert>

            <div className="space-y-1.5 text-xs bg-muted/40 p-3 rounded-lg border">
              <p className="font-semibold text-foreground">Profissional Solicitante:</p>
              <p className="text-muted-foreground">{doctorName || 'Médico credenciado'}</p>
              <p className="text-muted-foreground">
                CRM:{' '}
                {crmNumber
                  ? `${crmNumber}/${crmState || 'BR'}`
                  : 'Pendente de preenchimento no perfil'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="memedAccountId" className="text-xs font-medium">
                ID da Conta Memed (Opcional / Testes)
              </Label>
              <Input
                id="memedAccountId"
                placeholder="Ex: memed_doc_12345 (opcional para testes)"
                value={manualAccountId}
                onChange={(e) => setManualAccountId(e.target.value)}
                className="text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                Se você já possui um identificador de conta fornecido pelo suporte da Memed, insira
                acima. Caso contrário, deixe em branco para provisionamento automático.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConnectModalOpen(false)}
              disabled={actionLoading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmConnect}
              disabled={actionLoading}
              className="bg-[#14805A] hover:bg-[#116d4c] text-white gap-2"
            >
              <Plug className="h-4 w-4" />
              {actionLoading ? 'Conectando...' : 'Confirmar e Iniciar Conexão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
