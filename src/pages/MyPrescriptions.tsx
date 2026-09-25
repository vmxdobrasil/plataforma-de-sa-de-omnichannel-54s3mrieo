import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  QrCode,
  ExternalLink,
  Stethoscope,
  Clock,
  CheckCircle2,
  Copy,
  Printer,
  Search,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { getPatientPrescriptions, PrescriptionRecord } from '@/services/prescriptions'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { DependentSwitcher } from '@/components/DependentSwitcher'

const typeLabels: Record<string, { label: string; color: string }> = {
  simples: {
    label: 'Receita Simples',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  controlado_azul: {
    label: 'Notif. B (Azul - Psicotrópicos)',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  controlado_amarelo: {
    label: 'Notif. A (Amarela - Entorpecentes)',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  exame: {
    label: 'Pedido de Exames',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  atestado: {
    label: 'Atestado Médico',
    color: 'bg-teal-50 text-teal-700 border-teal-200',
  },
}

export default function MyPrescriptions() {
  const { user } = useAuth()
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionRecord | null>(null)
  const [activePatientId, setActivePatientId] = useState<string>('')

  // Sincroniza o paciente ativo (próprio usuário ou dependente)
  useEffect(() => {
    if (user?.id && !activePatientId) {
      setActivePatientId(user.id)
    }
  }, [user?.id])

  const loadPrescriptions = async () => {
    const targetId = activePatientId || user?.id
    if (!targetId) return
    setLoading(true)
    try {
      const data = await getPatientPrescriptions(targetId)
      setPrescriptions(data)
    } catch (err: any) {
      console.error('[Minhas Receitas] Erro ao carregar prescrições:', err)
      toast.error('Não foi possível carregar as receitas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activePatientId || user?.id) {
      loadPrescriptions()
    }
  }, [activePatientId, user?.id])

  useRealtime('prescriptions', () => loadPrescriptions())

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success('Link de validação copiado para a área de transferência!')
  }

  const filteredPrescriptions = prescriptions.filter((p) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    const meds = (p.medications || '').toLowerCase()
    const docName = (p.expand?.professional_id?.name || '').toLowerCase()
    const memedId = (p.memed_prescription_id || '').toLowerCase()
    const typeLabel = (typeLabels[p.prescription_type || 'simples']?.label || '').toLowerCase()
    return meds.includes(q) || docName.includes(q) || memedId.includes(q) || typeLabel.includes(q)
  })

  return (
    <div className="space-y-6 pb-12 animate-fade-in-up">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="h-8 w-8 text-[#14805A]" /> Minhas Receitas
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Prescrições digitais oficiais emitidas via Memed, com assinatura eletrônica e validação
            por QR Code.
          </p>
        </div>

        {/* Alternador de Dependentes */}
        {user?.role === 'patient' && (
          <div className="w-full sm:w-auto">
            <DependentSwitcher activeId={activePatientId} setActiveId={setActivePatientId} />
          </div>
        )}
      </div>

      {/* Busca e Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por medicamento, médico ou código Memed..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>
      </div>

      {/* Lista de Receitas */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground space-y-2">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-[#14805A] border-r-transparent"></div>
          <p className="text-sm">Carregando suas prescrições digitais...</p>
        </div>
      ) : filteredPrescriptions.length === 0 ? (
        <div className="text-center py-16 bg-muted/20 rounded-2xl border border-dashed space-y-3">
          <FileText className="h-12 w-12 mx-auto opacity-40 text-muted-foreground" />
          <div className="space-y-1">
            <h3 className="font-semibold text-base">Nenhuma receita encontrada</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Quando seu médico prescrever receitas digitais durante ou após a teleconsulta, elas
              aparecerão aqui com link de validação oficial da Memed.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPrescriptions.map((px) => {
            const typeInfo = typeLabels[px.prescription_type || 'simples'] || {
              label: 'Receita Simples',
              color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            }

            const docName = px.expand?.professional_id?.name || 'Médico Prescritor'
            const docCrm = px.expand?.professional_id?.crm_number
              ? `CRM ${px.expand.professional_id.crm_number}/${px.expand.professional_id.crm_state || 'BR'}`
              : px.expand?.professional_id?.document_id || ''

            const dateStr = px.signed_at || px.created
            const formattedDate = dateStr
              ? format(new Date(dateStr), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })
              : 'Data não informada'

            const validationUrl =
              px.document_validation_url ||
              (px.memed_prescription_id
                ? `https://memed.com.br/receita/${px.memed_prescription_id}`
                : '')

            return (
              <Card
                key={px.id}
                className="hover:shadow-md transition-all border-border flex flex-col justify-between"
              >
                <CardHeader className="pb-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[11px] font-medium ${typeInfo.color}`}
                    >
                      {typeInfo.label}
                    </Badge>
                    <Badge
                      className={`text-[10px] uppercase font-semibold ${
                        px.status === 'assinada' || px.status === 'enviada'
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
                          : 'bg-amber-100 text-amber-800 hover:bg-amber-100'
                      }`}
                    >
                      {px.status === 'enviada'
                        ? 'Enviada'
                        : px.status === 'assinada'
                          ? 'Assinada'
                          : px.status || 'Ativa'}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{formattedDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      <Stethoscope className="h-4 w-4 text-[#14805A] shrink-0" />
                      <span className="line-clamp-1">{docName}</span>
                    </div>
                    {docCrm && (
                      <p className="text-[11px] text-muted-foreground pl-5 font-mono">{docCrm}</p>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0 flex-1 flex flex-col justify-between">
                  <div className="space-y-2 bg-muted/30 p-2.5 rounded-lg border text-xs">
                    <span className="font-semibold text-muted-foreground block text-[11px] uppercase tracking-wide">
                      Itens Prescritos
                    </span>
                    <p className="whitespace-pre-line text-foreground line-clamp-4 font-mono text-[11px] leading-relaxed">
                      {px.medications}
                    </p>
                  </div>

                  {px.pharmacy_instructions && (
                    <div className="text-[11px] text-muted-foreground italic bg-muted/20 p-2 rounded">
                      <span className="font-semibold not-italic">Obs:</span>{' '}
                      {px.pharmacy_instructions}
                    </div>
                  )}

                  {px.memed_prescription_id && (
                    <div className="text-[11px] text-muted-foreground flex items-center justify-between font-mono bg-muted/10 px-2 py-1 rounded">
                      <span>ID Memed:</span>
                      <span className="font-semibold text-foreground">
                        {px.memed_prescription_id}
                      </span>
                    </div>
                  )}

                  <div className="pt-2 border-t space-y-2">
                    {validationUrl ? (
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 text-[#14805A] border-emerald-300 hover:bg-emerald-50"
                          asChild
                        >
                          <a href={validationUrl} target="_blank" rel="noreferrer">
                            <QrCode className="h-3.5 w-3.5 mr-1.5" /> Validar QR
                          </a>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-8"
                          onClick={() => handleCopyLink(validationUrl)}
                        >
                          <Copy className="h-3.5 w-3.5 mr-1.5" /> Copiar Link
                        </Button>
                      </div>
                    ) : null}

                    <Button
                      variant="default"
                      size="sm"
                      className="w-full text-xs h-8 bg-[#14805A] hover:bg-[#116d4c] text-white"
                      onClick={() => setSelectedPrescription(px)}
                    >
                      <FileText className="h-3.5 w-3.5 mr-1.5" /> Visualizar Receita Completa
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal de Detalhes da Prescrição com QR e Impressão */}
      <Dialog
        open={selectedPrescription !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedPrescription(null)
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedPrescription && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      typeLabels[selectedPrescription.prescription_type || 'simples']?.color || ''
                    }`}
                  >
                    {typeLabels[selectedPrescription.prescription_type || 'simples']?.label ||
                      'Receita Digital'}
                  </Badge>
                  <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">
                    {selectedPrescription.status === 'enviada'
                      ? 'Enviada ao Paciente'
                      : 'Assinada com Sucesso'}
                  </Badge>
                </div>
                <DialogTitle className="text-xl mt-2">Receita Digital Oficial</DialogTitle>
                <DialogDescription className="text-xs">
                  Emitida conforme padrões do Conselho Federal de Medicina (CFM), ICP-Brasil e
                  Memed.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-3 text-sm">
                {/* Médico e Paciente */}
                <div className="grid sm:grid-cols-2 gap-3 p-3 bg-muted/40 rounded-lg text-xs">
                  <div className="space-y-1">
                    <span className="text-muted-foreground block font-medium">
                      Médico Responsável:
                    </span>
                    <p className="font-semibold text-foreground">
                      {selectedPrescription.expand?.professional_id?.name || 'Dr(a). Prescritor'}
                    </p>
                    <p className="text-muted-foreground font-mono">
                      {selectedPrescription.expand?.professional_id?.crm_number
                        ? `CRM ${selectedPrescription.expand.professional_id.crm_number}/${selectedPrescription.expand.professional_id.crm_state || 'BR'}`
                        : selectedPrescription.expand?.professional_id?.document_id}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground block font-medium">Paciente:</span>
                    <p className="font-semibold text-foreground">
                      {selectedPrescription.expand?.patient_id?.name || user?.name || 'Paciente'}
                    </p>
                    <p className="text-muted-foreground">
                      Data da Assinatura:{' '}
                      {selectedPrescription.signed_at
                        ? format(
                            new Date(selectedPrescription.signed_at),
                            "dd/MM/yyyy 'às' HH:mm",
                            { locale: ptBR },
                          )
                        : format(new Date(selectedPrescription.created), "dd/MM/yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                    </p>
                  </div>
                </div>

                {/* Medicamentos */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Medicamentos e Posologia
                  </h4>
                  <div className="p-4 bg-card rounded-lg border font-mono text-xs leading-relaxed whitespace-pre-line shadow-inner">
                    {selectedPrescription.medications}
                  </div>
                </div>

                {/* Instruções para Farmácia */}
                {selectedPrescription.pharmacy_instructions && (
                  <div className="space-y-1 text-xs">
                    <h4 className="font-semibold text-muted-foreground">Instruções à Farmácia:</h4>
                    <p className="p-2.5 bg-muted/30 rounded border text-muted-foreground italic">
                      {selectedPrescription.pharmacy_instructions}
                    </p>
                  </div>
                )}

                {/* Validação Memed / QR Code */}
                {selectedPrescription.document_validation_url ||
                selectedPrescription.memed_prescription_id ? (
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-emerald-800">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Documento Válido e Dispensável em Farmácias</span>
                    </div>
                    <p className="text-emerald-700 text-[11px]">
                      Apresente este link ou o QR Code ao farmacêutico. O documento é assinado
                      digitalmente pelo padrão ICP-Brasil e aceito em redes de farmácias em todo o
                      Brasil.
                    </p>
                    {selectedPrescription.document_validation_url && (
                      <div className="pt-1">
                        <a
                          href={selectedPrescription.document_validation_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 font-medium text-emerald-800 underline hover:text-emerald-950"
                        >
                          <span>Acessar Página de Validação Sanitária da Receita</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 border-t">
                {selectedPrescription.document_validation_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleCopyLink(selectedPrescription.document_validation_url!)}
                  >
                    <Copy className="h-3.5 w-3.5 mr-1.5" /> Copiar Link
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => window.print()}
                >
                  <Printer className="h-3.5 w-3.5 mr-1.5" /> Imprimir
                </Button>
                <Button
                  size="sm"
                  className="text-xs bg-[#14805A] hover:bg-[#116d4c] text-white"
                  onClick={() => setSelectedPrescription(null)}
                >
                  Fechar
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
