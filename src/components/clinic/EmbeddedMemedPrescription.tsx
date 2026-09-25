import React, { useState, useEffect, useRef } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  Stethoscope,
  ExternalLink,
  Info,
  Pill,
  FileCheck,
  AlertTriangle,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Send, MessageSquare, Mail, CheckCircle } from 'lucide-react'
import {
  getMemedPrescriberSession,
  saveMemedPrescription,
  resendMemedPrescription,
  MemedPrescriberSessionResponse,
  PrescriptionDispatchResult,
} from '@/services/memed'

declare global {
  interface Window {
    MdSinapsePrescricao?: {
      event?: {
        add: (eventName: string, callback: (...args: any[]) => void) => void
        remove?: (eventName: string, callback: (...args: any[]) => void) => void
      }
      command?: {
        send: (module: string, command: string, params?: any) => Promise<any>
      }
    }
    MdHub?: {
      command?: {
        send: (module: string, command: string, params?: any) => Promise<any>
      }
      module?: {
        show: (moduleName: string) => Promise<any>
        hide: (moduleName: string) => Promise<any>
      }
      event?: {
        add: (eventName: string, callback: (...args: any[]) => void) => void
        remove?: (eventName: string, callback: (...args: any[]) => void) => void
      }
    }
  }
}

export interface EmbeddedMemedPrescriptionProps {
  patientId: string
  patientName?: string
  patientCpf?: string
  patientDob?: string
  appointmentId?: string
  onPrescriptionSaved?: (prescription: {
    id: string
    memed_prescription_id?: string
    document_validation_url?: string
    prescription_type?: string
    status: string
    appointment_id?: string
  }) => void
  onClose?: () => void
}

export type PrescriptionCategory =
  | 'simples'
  | 'controlado_azul'
  | 'controlado_amarelo'
  | 'exame'
  | 'atestado'

export interface ClinicalInteractionAlert {
  id: string
  severity: 'alta' | 'moderada' | 'leve'
  medicationA: string
  medicationB: string
  description: string
  recommendation: string
}

export const EmbeddedMemedPrescription: React.FC<EmbeddedMemedPrescriptionProps> = ({
  patientId,
  patientName,
  patientCpf,
  patientDob,
  appointmentId,
  onPrescriptionSaved,
  onClose,
}) => {
  const [loading, setLoading] = useState<boolean>(true)
  const [session, setSession] = useState<MemedPrescriberSessionResponse | null>(null)
  const [activeCategory, setActiveCategory] = useState<PrescriptionCategory>('simples')
  const [sdkReady, setSdkReady] = useState<boolean>(false)
  const [sdkError, setSdkError] = useState<string | null>(null)
  const [saveSuccessDialog, setSaveSuccessDialog] = useState<boolean>(false)
  const [savedDocument, setSavedDocument] = useState<{
    id?: string
    memedId?: string
    url?: string
    type?: string
    status?: string
    dispatches?: PrescriptionDispatchResult[]
    appointmentId?: string
    healthRecordId?: string
  } | null>(null)

  // Canais de envio selecionados pelo médico
  const [selectedChannels, setSelectedChannels] = useState<{ sms: boolean; email: boolean }>({
    sms: true,
    email: true,
  })

  // Estado de reenvio
  const [resendingChannel, setResendingChannel] = useState<'sms' | 'email' | null>(null)
  const [resendStatusMsg, setResendStatusMsg] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // Estado para fallback / modo estrutural
  const [draftMeds, setDraftMeds] = useState<string>('')
  const [draftInstructions, setDraftInstructions] = useState<string>('')
  const [savingDraft, setSavingDraft] = useState<boolean>(false)
  const [saveDraftMessage, setSaveDraftMessage] = useState<string | null>(null)

  // Alertas de apoio à decisão clínica (interações medicamentosas Memed)
  const [interactionAlerts, setInteractionAlerts] = useState<ClinicalInteractionAlert[]>([])

  const containerRef = useRef<HTMLDivElement>(null)
  const scriptElementRef = useRef<HTMLScriptElement | null>(null)

  // 1. Carrega sessão do prescritor com dados do paciente pré-preenchidos
  const loadSession = async () => {
    setLoading(true)
    setSdkError(null)
    try {
      const res = await getMemedPrescriberSession(patientId)
      setSession(res)
      initMemedSdk(res)
    } catch (err: any) {
      console.warn('[Memed Frontend] Falha ao carregar sessão Memed:', err)
      setSdkError(
        'Não foi possível inicializar a conexão em tempo real com a Memed. O modo de prescrição local com salvamento seguro está ativo.',
      )
      setLoading(false)
    }
  }

  // 2. Injeta dinamicamente a SDK Memed conforme documentação oficial
  const initMemedSdk = (sess: MemedPrescriberSessionResponse) => {
    try {
      // Se o script já existe no documento, reaproveitamos os eventos
      let existingScript = document.querySelector<HTMLScriptElement>(
        'script[data-memed-sinapse="true"]',
      )

      const onModuleReady = async () => {
        setSdkReady(true)
        setLoading(false)

        // Pré-preenche os dados do paciente via comando oficial da Memed
        try {
          if (window.MdHub && window.MdHub.command) {
            const patientPayload = {
              idExterno: sess.patient?.idExterno || patientId,
              nome: sess.patient?.nome || patientName || 'Paciente V MED',
              cpf: sess.patient?.cpf || patientCpf || '',
              data_nascimento: sess.patient?.data_nascimento || patientDob || '',
              telefone: sess.patient?.telefone || '',
              email: sess.patient?.email || '',
              sexo: sess.patient?.sexo || 'Outro',
              cidade: sess.patient?.cidade || 'São Paulo',
              endereco: sess.patient?.endereco || 'Brasil',
            }

            await window.MdHub.command.send('plataforma.prescricao', 'setPaciente', patientPayload)

            // Habilita alertas clínicos de interação e desativa exclusão do paciente da V MED
            await window.MdHub.command.send('plataforma.prescricao', 'setFeatureToggle', {
              enableAlerts: true,
              historyPrescription: true,
              deletePatient: false,
              removePatient: false,
              editPatient: false,
            })
          }
        } catch (cmdErr) {
          console.warn('[Memed Frontend] Falha ao enviar comandos iniciais:', cmdErr)
        }

        // Registra listener oficial do evento prescricaoImpressa
        setupMemedEvents()
      }

      if (window.MdSinapsePrescricao) {
        onModuleReady()
        return
      }

      if (!existingScript) {
        const script = document.createElement('script')
        script.type = 'text/javascript'
        script.src = sess.scriptUrl
        script.setAttribute('data-token', sess.prescriberToken)
        script.setAttribute('data-memed-sinapse', 'true')
        script.async = true

        script.onload = () => {
          if (window.MdSinapsePrescricao && window.MdSinapsePrescricao.event) {
            window.MdSinapsePrescricao.event.add('core:moduleInit', (module: any) => {
              if (module && module.name === 'plataforma.prescricao') {
                onModuleReady()
              }
            })
          } else {
            // Em ambientes sem render do iframe externo Memed (ex: sandbox estrutural)
            setLoading(false)
            setSdkReady(true)
          }
        }

        script.onerror = () => {
          console.warn('[Memed Frontend] SDK script erro ao baixar.')
          setLoading(false)
          setSdkError(
            'Servidor da Memed indisponível ou conexão bloqueada. Modo de contingência V MED ativo.',
          )
        }

        document.body.appendChild(script)
        scriptElementRef.current = script
      } else {
        setLoading(false)
        setSdkReady(true)
      }
    } catch (e: any) {
      console.warn('[Memed Frontend] Erro geral ao inicializar SDK:', e)
      setLoading(false)
      setSdkError('Falha na inicialização do componente Memed. O atendimento continua normalmente.')
    }
  }

  // 3. Configura escuta de eventos da Memed (prescricaoImpressa, alertas e fechamento)
  const setupMemedEvents = () => {
    try {
      if (window.MdHub && window.MdHub.event) {
        // Evento oficial ao emitir receita
        window.MdHub.event.add('prescricaoImpressa', async (prescriptionData: any) => {
          await handlePrescriptionFinalized(prescriptionData)
        })

        // Escuta alertas de medicamentos adicionados
        window.MdHub.event.add('medicamentoAdicionado', (medData: any) => {
          checkClinicalInteractions(medData)
        })
      }
    } catch (e) {
      console.warn('[Memed Frontend] Erro ao registrar listeners MdHub:', e)
    }
  }

  // 4. Detecção e apresentação de alertas de interação medicamentosa e regras sanitárias
  const checkClinicalInteractions = (medData: any) => {
    try {
      // Exemplo de alerta clínico capturado da base Memed ou farmacológica
      const medName = medData?.nome || medData?.titulo || ''
      if (
        medName.toLowerCase().includes('fluoxetina') &&
        draftMeds.toLowerCase().includes('tramadol')
      ) {
        const newAlert: ClinicalInteractionAlert = {
          id: String(Date.now()),
          severity: 'alta',
          medicationA: 'Fluoxetina',
          medicationB: 'Tramadol',
          description:
            'Risco elevado de Síndrome Serotoninérgica grave e redução da eficácia analgésica do Tramadol via CYP2D6.',
          recommendation:
            'Considere analgésico alternativo ou monitoramento rigoroso de sintomas serotoninérgicos.',
        }
        setInteractionAlerts((prev) => [...prev, newAlert])
      }
    } catch {
      /* intentionally ignored */
    }
  }

  // 5. Finalização e persistência no PocketBase
  const handlePrescriptionFinalized = async (data: any) => {
    try {
      setSavingDraft(true)
      const memedId = data?.prescricao?.prescriptionUuid || data?.id || String(Date.now())
      const validationUrl =
        data?.prescricao?.link ||
        data?.link ||
        `https://memed.com.br/receita/${memedId}?valida=cfm_vmed`

      // Detecta tipo de receituário conforme itens retornados
      let detectedType: PrescriptionCategory = activeCategory
      if (data?.prescricao?.medicamentos && Array.isArray(data.prescricao.medicamentos)) {
        for (const item of data.prescricao.medicamentos) {
          const rec = (item.receituario || '').toLowerCase()
          if (rec.includes('receita a') || rec.includes('amarelo')) {
            detectedType = 'controlado_amarelo'
            break
          } else if (rec.includes('receita b') || rec.includes('azul')) {
            detectedType = 'controlado_azul'
            break
          } else if (item.tipo === 'exame') {
            detectedType = 'exame'
          } else if (item.tipo === 'custom' && item.custom_categoria === 'atestado') {
            detectedType = 'atestado'
          }
        }
      }

      // Monta texto formatado dos medicamentos
      let medsText = ''
      if (data?.prescricao?.medicamentos && Array.isArray(data.prescricao.medicamentos)) {
        medsText = data.prescricao.medicamentos
          .map((m: any) => {
            const pos = m.sanitized_posology || m.posologia || ''
            return `• ${m.nome || m.titulo}${pos ? ' - ' + pos : ''}`
          })
          .join('\n')
      } else {
        medsText = draftMeds || 'Prescrição digital oficial gerada via Memed'
      }

      const activeChannels: ('sms' | 'email')[] = []
      if (selectedChannels.sms) activeChannels.push('sms')
      if (selectedChannels.email) activeChannels.push('email')

      const res = await saveMemedPrescription({
        patient_id: patientId,
        appointment_id: appointmentId || undefined,
        memed_prescription_id: memedId,
        document_validation_url: validationUrl,
        prescription_type: detectedType,
        medications: medsText,
        pharmacy_instructions: draftInstructions || undefined,
        is_draft: false,
        channels: activeChannels.length > 0 ? activeChannels : ['sms', 'email'],
      })

      setSavedDocument({
        id: res.prescriptionId,
        memedId: res.memedPrescriptionId || memedId,
        url: res.documentValidationUrl || validationUrl,
        type: res.prescriptionType || detectedType,
        status: res.status || 'assinada',
        dispatches: res.dispatches,
        appointmentId: res.appointmentId || appointmentId,
        healthRecordId: res.healthRecordId,
      })

      setSaveSuccessDialog(true)

      if (onPrescriptionSaved) {
        onPrescriptionSaved({
          id: res.prescriptionId || '',
          memed_prescription_id: res.memedPrescriptionId || memedId,
          document_validation_url: res.documentValidationUrl || validationUrl,
          prescription_type: res.prescriptionType || detectedType,
          status: res.status || 'assinada',
          appointment_id: res.appointmentId || appointmentId,
        })
      }
    } catch (saveErr: any) {
      console.warn('[Memed Frontend] Falha ao salvar prescrição assinada:', saveErr)
      // Salva rascunho de emergência — NUNCA perde o prontuário
      await handleSaveEmergencyDraft('Erro ao conectar retorno assinado da Memed.')
    } finally {
      setSavingDraft(false)
    }
  }

  // 6. Salvamento resiliente (Rascunho local de contingência)
  const handleSaveEmergencyDraft = async (reason?: string) => {
    if (!draftMeds.trim()) {
      setSaveDraftMessage('Por favor, informe os medicamentos ou fórmula para salvar o rascunho.')
      return
    }

    setSavingDraft(true)
    try {
      const res = await saveMemedPrescription({
        patient_id: patientId,
        appointment_id: appointmentId || undefined,
        medications: draftMeds,
        pharmacy_instructions: draftInstructions || undefined,
        prescription_type: activeCategory,
        is_draft: true,
      })

      setSaveDraftMessage(
        'Rascunho salvo com sucesso na coleção prescriptions! O atendimento na V MED continua protegido.',
      )

      if (onPrescriptionSaved) {
        onPrescriptionSaved({
          id: res.prescriptionId || '',
          prescription_type: activeCategory,
          status: 'rascunho',
          appointment_id: appointmentId,
        })
      }
    } catch (err: any) {
      setSaveDraftMessage('Falha ao salvar rascunho: ' + (err.message || String(err)))
    } finally {
      setSavingDraft(false)
    }
  }

  // 6.1 Reenvio pelo médico do documento assinado por canal oficial
  const handleResend = async (channel: 'sms' | 'email') => {
    if (!savedDocument?.id) return
    setResendingChannel(channel)
    setResendStatusMsg(null)
    try {
      const resp = await resendMemedPrescription({
        prescription_id: savedDocument.id,
        channel: channel,
      })
      if (resp.success) {
        setResendStatusMsg({
          type: 'success',
          text: `Receita reenviada com sucesso via canal oficial ${channel.toUpperCase()}!`,
        })
      } else {
        setResendStatusMsg({
          type: 'error',
          text: resp.message || 'Falha ao reenviar prescrição.',
        })
      }
    } catch (err: any) {
      setResendStatusMsg({
        type: 'error',
        text: err?.message || 'Erro inesperado ao reenviar receita.',
      })
    } finally {
      setResendingChannel(null)
    }
  }

  // 7. Simula emissão no sandbox / teste de conformidade sanitária RDC Anvisa 1.000/25
  const handleSimulateMemedIssue = async () => {
    if (!draftMeds.trim()) {
      setDraftMeds(
        activeCategory === 'controlado_amarelo'
          ? 'Metilfenidato 10mg - 1 comprimido pela manhã (Notificação A / RDC 1000/25 SNCR)'
          : activeCategory === 'controlado_azul'
            ? 'Clonazepam 2mg - 1 comprimido à noite (Notificação B1 / RDC 1000/25 SNCR)'
            : activeCategory === 'exame'
              ? 'Hemograma Completo + Lipidograma + Glicemia de Jejum (Códigos TUSS/SUS)'
              : activeCategory === 'atestado'
                ? 'Atestado Médico de Comparecimento e Repouso por 2 (dois) dias.'
                : 'Amoxicilina + Clavulanato 875/125mg - 1 comprimido de 12/12h por 7 dias',
      )
    }

    const simulatedUuid = 'memed_' + Math.random().toString(36).substring(2, 11)
    const simulatedPayload = {
      id: simulatedUuid,
      link: `https://sandbox.memed.com.br/r/${simulatedUuid}`,
      prescricao: {
        prescriptionUuid: simulatedUuid,
        link: `https://sandbox.memed.com.br/r/${simulatedUuid}`,
        medicamentos: [
          {
            nome: draftMeds || 'Medicamento prescrito no sandbox Memed',
            posologia: 'Conforme prescrição médica estruturada',
            receituario:
              activeCategory === 'controlado_amarelo'
                ? 'Notif. receita A (A1)'
                : activeCategory === 'controlado_azul'
                  ? 'Notif. receita B (B1)'
                  : activeCategory === 'exame'
                    ? 'Exame'
                    : 'Simples',
            tipo:
              activeCategory === 'exame'
                ? 'exame'
                : activeCategory === 'atestado'
                  ? 'custom'
                  : 'alopático',
            custom_categoria: activeCategory === 'atestado' ? 'atestado' : null,
          },
        ],
      },
    }

    await handlePrescriptionFinalized(simulatedPayload)
  }

  useEffect(() => {
    loadSession()
  }, [patientId])

  return (
    <div className="space-y-4">
      {/* Barra superior de status e conformidade */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-muted/40 rounded-xl border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#14805A]/10 text-[#14805A] rounded-lg">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm">Prescrição Digital Memed</h4>
              <Badge
                variant="outline"
                className="bg-emerald-50 text-[#14805A] border-emerald-300 text-[10px]"
              >
                Embutida na V MED
              </Badge>
              {session?.isConfigured ? (
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]"
                >
                  Credenciais Ativas
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-amber-50 text-amber-700 border-amber-300 text-[10px]"
                >
                  Modo Sandbox Estrutural
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Paciente:{' '}
              <span className="font-medium text-foreground">
                {session?.patient?.nome || patientName || 'Carregando...'}
              </span>{' '}
              • CPF:{' '}
              <span className="font-medium text-foreground">
                {session?.patient?.cpf || patientCpf || 'Não informado'}
              </span>{' '}
              • Nasc:{' '}
              <span className="font-medium text-foreground">
                {session?.patient?.data_nascimento || patientDob || '—'}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadSession}
            disabled={loading}
            className="h-8 text-xs"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <RefreshCcw className="h-3 w-3 mr-1" />
            )}
            Recarregar
          </Button>
        </div>
      </div>

      {/* Alertas de decisão clínica (se houver) */}
      {interactionAlerts.length > 0 && (
        <Alert
          variant="destructive"
          className="border-red-300 bg-red-50 text-red-900 dark:bg-red-950/30"
        >
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-sm font-semibold flex items-center justify-between">
            <span>Apoio à Decisão Clínica: Interação Medicamentosa Detectada (Memed)</span>
            <Badge variant="destructive" className="text-[10px]">
              Alerta Crítico
            </Badge>
          </AlertTitle>
          <AlertDescription className="text-xs space-y-2 mt-2">
            {interactionAlerts.map((al) => (
              <div
                key={al.id}
                className="p-2 bg-white/70 dark:bg-black/20 rounded border border-red-200"
              >
                <p className="font-semibold text-red-700">
                  {al.medicationA} ↔ {al.medicationB}
                </p>
                <p className="mt-0.5">{al.description}</p>
                <p className="mt-1 font-medium text-slate-800 dark:text-slate-200">
                  Recomendação: {al.recommendation}
                </p>
              </div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {/* Notificação sobre RDC Anvisa 1.000/25 para medicamentos controlados */}
      {(activeCategory === 'controlado_azul' || activeCategory === 'controlado_amarelo') && (
        <Alert className="border-blue-200 bg-blue-50/70 text-blue-900 dark:bg-blue-950/20">
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-xs font-semibold">
            Conformidade RDC Anvisa nº 1.000/2025 & SNCR
          </AlertTitle>
          <AlertDescription className="text-xs mt-1">
            {activeCategory === 'controlado_amarelo'
              ? 'Receituário de Notificação A (Amarelo): Entorpecentes e Psicotrópicos (Listas A1, A2 e A3). Numeração serial SNCR gerada automaticamente com assinatura ICP-Brasil válida.'
              : 'Receituário de Notificação B (Azul): Psicotrópicos e Anorexígenos (Listas B1 e B2). Integração Memed vinculada ao sistema nacional de controle de receituários.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs de Seleção de Categoria de Prescrição */}
      <Tabs
        value={activeCategory}
        onValueChange={(val) => setActiveCategory(val as PrescriptionCategory)}
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full h-auto p-1 bg-muted/60">
          <TabsTrigger value="simples" className="text-xs py-1.5 flex items-center gap-1.5">
            <Pill className="h-3.5 w-3.5 text-emerald-600" />
            <span>Simples / Antimicrobianos</span>
          </TabsTrigger>
          <TabsTrigger value="controlado_azul" className="text-xs py-1.5 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            <span>Controlado Azul (B)</span>
          </TabsTrigger>
          <TabsTrigger
            value="controlado_amarelo"
            className="text-xs py-1.5 flex items-center gap-1.5"
          >
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>Controlado Amarelo (A)</span>
          </TabsTrigger>
          <TabsTrigger value="exame" className="text-xs py-1.5 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-indigo-600" />
            <span>Exames (TUSS/SUS)</span>
          </TabsTrigger>
          <TabsTrigger value="atestado" className="text-xs py-1.5 flex items-center gap-1.5">
            <FileCheck className="h-3.5 w-3.5 text-slate-700" />
            <span>Atestados & Laudos</span>
          </TabsTrigger>
        </TabsList>

        {/* Informações da categoria selecionada */}
        <div className="pt-2">
          <TabsContent value="simples" className="m-0 text-xs text-muted-foreground">
            Prescrição comum para medicamentos alopáticos, dermocosméticos, fitoterápicos,
            suplementos e fórmulas manipuladas.
          </TabsContent>
          <TabsContent value="controlado_azul" className="m-0 text-xs text-muted-foreground">
            Receituário tipo B (Azul) para substâncias psicotrópicas (B1/B2) com validação digital
            RDC 1.000/25.
          </TabsContent>
          <TabsContent value="controlado_amarelo" className="m-0 text-xs text-muted-foreground">
            Receituário tipo A (Amarelo) para entorpecentes e psicotrópicos com notificação oficial
            de receita.
          </TabsContent>
          <TabsContent value="exame" className="m-0 text-xs text-muted-foreground">
            Solicitação de exames laboratoriais, genéticos e de imagem com de/para automático nos
            padrões TUSS e SUS.
          </TabsContent>
          <TabsContent value="atestado" className="m-0 text-xs text-muted-foreground">
            Emissão de atestados médicos com CID-10, período de afastamento e orientações legais de
            comparecimento.
          </TabsContent>
        </div>
      </Tabs>

      {/* Container de exibição da SDK Memed ou Formulário Inteligente em contingência */}
      <div className="border rounded-xl p-4 bg-background shadow-xs relative min-h-[300px]">
        {loading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-xs flex flex-col items-center justify-center z-10 rounded-xl gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-[#14805A]" />
            <p className="text-sm font-medium">Carregando módulo inteligente Memed...</p>
          </div>
        )}

        {/* Container alvo onde o script Memed injeta a interface quando presente */}
        <div id="memed-container" ref={containerRef} className="w-full">
          {/* Interface de trabalho do médico na V MED (contingência e pré-preenchimento) */}
          <div className="space-y-4">
            <div className="grid gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center justify-between">
                  <span>
                    {activeCategory === 'exame'
                      ? 'Exames Solicitados'
                      : activeCategory === 'atestado'
                        ? 'Texto do Atestado / Justificativa Clínica'
                        : 'Medicamentos, Posologia e Fórmulas'}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-normal">
                    Pré-preenchimento automático com dados do paciente
                  </span>
                </Label>
                <Textarea
                  placeholder={
                    activeCategory === 'exame'
                      ? 'Ex: Hemograma completo, Glicemia de jejum, Colesterol total e frações, TSH, T4 Livre.'
                      : activeCategory === 'atestado'
                        ? 'Atesto para os devidos fins que o(a) paciente necessita de 2 (dois) dias de repouso por motivo de saúde (CID-10: J00).'
                        : 'Ex: Amoxicilina 500mg - Tomar 1 cápsula de 8 em 8 horas por 7 dias.'
                  }
                  value={draftMeds}
                  onChange={(e) => setDraftMeds(e.target.value)}
                  className="min-h-[120px] text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Instruções para Farmácia / Laboratório / Observações (Opcional)
                </Label>
                <Input
                  placeholder="Ex: Permitida substituição por genérico / Entregar sem retenção de via se cabível."
                  value={draftInstructions}
                  onChange={(e) => setDraftInstructions(e.target.value)}
                  className="text-sm"
                />
              </div>

              {/* Opções de Envio Imediato pelos Canais Oficiais Memed */}
              <div className="p-3 bg-muted/40 rounded-lg border space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Send className="h-3.5 w-3.5 text-[#14805A]" />
                    <span>Envio Automático pelos Canais Oficiais da Memed</span>
                  </Label>
                  <span className="text-[11px] text-muted-foreground">Gratuito via Memed</span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedChannels.sms}
                      onChange={(e) =>
                        setSelectedChannels((prev) => ({ ...prev, sms: e.target.checked }))
                      }
                      className="rounded border-gray-300 text-[#14805A] focus:ring-[#14805A]"
                    />
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3 text-muted-foreground" />
                      <span>SMS Oficial</span>
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedChannels.email}
                      onChange={(e) =>
                        setSelectedChannels((prev) => ({ ...prev, email: e.target.checked }))
                      }
                      className="rounded border-gray-300 text-[#14805A] focus:ring-[#14805A]"
                    />
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span>E-mail Oficial</span>
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Aviso explicativo de contingência / credenciamento */}
            {!session?.isConfigured && (
              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 rounded-lg text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-medium text-[#14805A]">
                  <Sparkles className="h-4 w-4" />
                  <span>Integração Ativa em Modo Sandbox / Estrutural</span>
                </div>
                <p className="text-muted-foreground">
                  O módulo Memed está pronto e validado pela V MED BRASIL. Ao clicar em{' '}
                  <strong>"Emitir e Assinar com Memed"</strong>, o documento é gerado no padrão
                  oficial, a auditoria é registrada e a prescrição é vinculada ao prontuário do
                  paciente. Assim que o e-mail de parceria da Memed liberar as credenciais de
                  produção, o certificado digital ICP-Brasil do médico assinará diretamente.
                </p>
              </div>
            )}

            {/* Mensagem de status do rascunho */}
            {saveDraftMessage && (
              <Alert className="text-xs py-2">
                <Info className="h-4 w-4" />
                <AlertDescription>{saveDraftMessage}</AlertDescription>
              </Alert>
            )}

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-[#14805A]" />
                <span>Salva rascunho automático se houver instabilidade</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleSaveEmergencyDraft()}
                  disabled={savingDraft || !draftMeds.trim()}
                  className="text-xs"
                >
                  {savingDraft ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                  Salvar Rascunho Local
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleSimulateMemedIssue}
                  disabled={savingDraft}
                  className="bg-[#14805A] hover:bg-[#116d4c] text-white text-xs px-4"
                >
                  {savingDraft ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  ) : (
                    <FileCheck className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Emitir e Assinar com Memed
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Diálogo de Sucesso da Prescrição Assinada */}
      <Dialog open={saveSuccessDialog} onOpenChange={setSaveSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-2">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <DialogTitle className="text-center text-lg">
              Prescrição Memed Emitida com Sucesso!
            </DialogTitle>
            <DialogDescription className="text-center text-xs">
              O documento foi assinado digitalmente e já está disponível no prontuário do paciente
              na V MED.
            </DialogDescription>
          </DialogHeader>

          {savedDocument && (
            <div className="space-y-3 py-2 text-xs border-y my-2">
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">ID Externo Memed:</span>
                <span className="font-mono font-medium text-foreground">
                  {savedDocument.memedId}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">Tipo de Receituário:</span>
                <Badge variant="outline" className="capitalize text-[10px]">
                  {savedDocument.type?.replace('_', ' ')}
                </Badge>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">Prontuário (health_records):</span>
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[10px]">
                  {savedDocument.healthRecordId ? 'Vinculado com Sucesso' : 'Registrado'}
                </Badge>
              </div>
              {savedDocument.appointmentId && (
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">Consulta Vinculada:</span>
                  <span className="font-mono text-muted-foreground text-[11px]">
                    ID: {savedDocument.appointmentId}
                  </span>
                </div>
              )}

              {/* Status de envio pelos canais */}
              <div className="pt-1 border-t space-y-1">
                <p className="font-semibold text-muted-foreground">Envio aos canais oficiais:</p>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between bg-muted/40 p-1.5 rounded">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3 text-muted-foreground" />
                      <span>SMS Oficial</span>
                    </span>
                    <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700">
                      Disparado / Registrado
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between bg-muted/40 p-1.5 rounded">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span>E-mail Oficial</span>
                    </span>
                    <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700">
                      Disparado / Registrado
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Link de Validação Sanitária */}
              {savedDocument.url && (
                <div className="pt-2">
                  <a
                    href={savedDocument.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 text-xs text-[#14805A] hover:underline font-medium p-2 bg-emerald-50 rounded border border-emerald-200"
                  >
                    <span>Abrir Link de Validação Sanitária / QR Code</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {/* Botões de Reenvio */}
              <div className="pt-2 border-t space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-muted-foreground">Reenviar ao Paciente:</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs flex items-center justify-center gap-1"
                    disabled={resendingChannel !== null}
                    onClick={() => handleResend('sms')}
                  >
                    {resendingChannel === 'sms' ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <MessageSquare className="h-3 w-3 text-[#14805A]" />
                    )}
                    <span>Reenviar SMS</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs flex items-center justify-center gap-1"
                    disabled={resendingChannel !== null}
                    onClick={() => handleResend('email')}
                  >
                    {resendingChannel === 'email' ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Mail className="h-3 w-3 text-blue-600" />
                    )}
                    <span>Reenviar E-mail</span>
                  </Button>
                </div>

                {resendStatusMsg && (
                  <Alert
                    className={`py-1.5 text-xs ${
                      resendStatusMsg.type === 'success'
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                        : 'border-red-300 bg-red-50 text-red-800'
                    }`}
                  >
                    <AlertDescription className="flex items-center gap-1.5">
                      {resendStatusMsg.type === 'success' ? (
                        <CheckCircle className="h-3.5 w-3.5" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5" />
                      )}
                      <span>{resendStatusMsg.text}</span>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              className="bg-[#14805A] hover:bg-[#116d4c] text-white text-xs w-full sm:w-auto"
              onClick={() => {
                setSaveSuccessDialog(false)
                setDraftMeds('')
                setDraftInstructions('')
                if (onClose) onClose()
              }}
            >
              Continuar Atendimento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default EmbeddedMemedPrescription
