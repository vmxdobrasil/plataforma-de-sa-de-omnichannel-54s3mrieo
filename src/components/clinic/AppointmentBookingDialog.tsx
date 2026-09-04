import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Clock } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { getAvailabilitySlots, checkDoubleBooking, logAudit } from '@/services/clinic'
import { createAppointment } from '@/services/appointments'
import { getFinancasMedPacientes, FinancasMedPatient } from '@/services/financasmed'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  onSuccess: () => void
  defaultDoctorId?: string
}

export function AppointmentBookingDialog({
  open,
  onOpenChange,
  onSuccess,
  defaultDoctorId,
}: Props) {
  const [patients, setPatients] = useState<any[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  const [patientId, setPatientId] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [financasPacientes, setFinancasPacientes] = useState<FinancasMedPatient[]>([])
  const [loadingFinancas, setLoadingFinancas] = useState(false)
  const [financasStatus, setFinancasStatus] = useState<string | null>(null)
  const [date, setDate] = useState('')
  const [type, setType] = useState('Presencial')
  const [classification, setClassification] = useState('first_visit')
  const [slots, setSlots] = useState<string[]>([])
  const [selectedTime, setSelectedTime] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  // Campos financeiros (integração GestãoMed)
  const [valor, setValor] = useState('')
  const [formaPagamento, setFormaPagamento] = useState('')
  const [statusPagamento, setStatusPagamento] = useState('')
  const [repassePct, setRepassePct] = useState('')

  useEffect(() => {
    if (open) {
      if (defaultDoctorId) {
        setDoctorId(defaultDoctorId)
      }
      pb.collection('users')
        .getFullList({
          filter: 'role = "patient"',
          sort: 'name',
        })
        .then(setPatients)
        .catch(() => {})
      pb.collection('users')
        .getFullList({
          filter: 'role = "professional"',
          sort: 'name',
        })
        .then((docs) => {
          setDoctors(docs)
          if (defaultDoctorId && !doctorId) {
            setDoctorId(defaultDoctorId)
          }
        })
        .catch(() => {})
    }
  }, [open, defaultDoctorId])

  // Busca pacientes do FinançasMed sempre que o médico for selecionado
  useEffect(() => {
    if (!doctorId) {
      setFinancasPacientes([])
      setFinancasStatus(null)
      return
    }

    const doc = doctors.find((d) => d.id === doctorId)
    const email = doc?.email
    if (!email) {
      setFinancasPacientes([])
      setFinancasStatus(null)
      return
    }

    let isMounted = true
    setLoadingFinancas(true)
    setFinancasStatus(null)

    getFinancasMedPacientes(email)
      .then((list) => {
        if (!isMounted) return
        setFinancasPacientes(list || [])
        setFinancasStatus(
          list && list.length > 0
            ? `${list.length} paciente(s) sincronizado(s) do FinançasMed`
            : 'Nenhum paciente cadastrado para este médico no FinançasMed ainda',
        )
      })
      .catch(() => {
        if (!isMounted) return
        setFinancasPacientes([])
        setFinancasStatus('FinançasMed indisponível no momento')
      })
      .finally(() => {
        if (isMounted) setLoadingFinancas(false)
      })

    return () => {
      isMounted = false
    }
  }, [doctorId, doctors])

  useEffect(() => {
    if (!doctorId || !date) return
    const dayOfWeek = new Date(date + 'T00:00:00').getDay().toString()
    Promise.all([
      getAvailabilitySlots(doctorId),
      pb.collection('appointments').getFullList({
        filter: `professional_id = "${doctorId}" && dateTime >= "${date} 00:00:00" && dateTime <= "${date} 23:59:59" && status != "cancelled"`,
      }),
    ])
      .then(([allSlots, booked]) => {
        const daySlots = allSlots.filter(
          (s: any) => s.day_of_week === dayOfWeek && s.slot_type === type,
        )
        const bookedTimes = booked.map((b: any) => {
          const d = new Date(b.dateTime)
          return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
        })
        const generated: string[] = []
        daySlots.forEach((s: any) => {
          const [sh, sm] = s.start_time.split(':').map(Number)
          const [eh, em] = s.end_time.split(':').map(Number)
          const dur = s.slot_duration || 30
          let cur = sh * 60 + sm
          const end = eh * 60 + em
          while (cur + dur <= end) {
            const h = Math.floor(cur / 60)
              .toString()
              .padStart(2, '0')
            const m = (cur % 60).toString().padStart(2, '0')
            const ts = `${h}:${m}`
            if (!bookedTimes.includes(ts)) generated.push(ts)
            cur += dur
          }
        })
        setSlots(generated)
        setSelectedTime('')
      })
      .catch(() => {
        setSlots([])
      })
  }, [doctorId, date, type])

  const handleSubmit = async () => {
    if (!patientId || !doctorId || !date || !selectedTime) {
      toast.error('Preencha todos os campos.')
      return
    }
    setLoading(true)
    try {
      let resolvedPatientId = patientId

      // Se selecionou um paciente do FinançasMed que ainda não está cadastrado no users do PocketBase:
      if (patientId.startsWith('financas:')) {
        const financasId = patientId.replace('financas:', '')
        const fp = financasPacientes.find((p) => p.id === financasId)
        if (fp) {
          const fallbackEmail =
            fp.email ||
            `${(fp.cpf || fp.name || 'paciente').replace(/\D/g, '') || Math.random().toString(36).slice(2, 8)}@paciente.vmed`
          try {
            const newPatient = await pb.collection('users').create({
              role: 'patient',
              name: fp.name,
              email: fallbackEmail,
              phone: fp.phone || '',
              document_id: fp.cpf || '',
              date_of_birth: fp.birth_date || undefined,
              registration_status: 'approved',
              password: 'Skip@Pass' + Math.floor(1000 + Math.random() * 9000),
              passwordConfirm: 'Skip@Pass' + Math.floor(1000 + Math.random() * 9000),
            })
            resolvedPatientId = newPatient.id
            toast.success(`Paciente ${fp.name} importado do FinançasMed!`)
          } catch (importErr: any) {
            console.warn('Falha ao instanciar paciente local do FinançasMed:', importErr)
            // Tenta buscar se já existia pelo email
            try {
              const existing = await pb
                .collection('users')
                .getFirstListItem(`email="${fallbackEmail}"`)
              resolvedPatientId = existing.id
            } catch (_) {
              toast.error('Erro ao importar paciente do FinançasMed para a base local.')
              setLoading(false)
              return
            }
          }
        }
      }

      const [h, m] = selectedTime.split(':')
      const dt = new Date(date + 'T00:00:00')
      dt.setHours(parseInt(h), parseInt(m), 0, 0)
      const isoStr = dt.toISOString()
      if (await checkDoubleBooking(doctorId, isoStr)) {
        toast.error('Já existe um agendamento neste horário.')
        setLoading(false)
        return
      }

      const payment: Record<string, unknown> = {}
      if (valor) payment.valor = parseFloat(valor)
      if (formaPagamento) payment.forma_pagamento = formaPagamento
      if (statusPagamento) payment.status_pagamento = statusPagamento
      if (repassePct) payment.repasse_pct = parseFloat(repassePct)

      const appt = await createAppointment({
        patient_id: resolvedPatientId,
        professional_id: doctorId,
        dateTime: isoStr,
        type,
        status: 'scheduled',
        notes,
        classification,
        ...payment,
      })
      await logAudit('create', 'appointments', appt.id, {
        patientId: resolvedPatientId,
        doctorId,
        classification,
      })
      toast.success('Agendamento criado e paciente sincronizado com FinançasMed!')
      onOpenChange(false)
      onSuccess()
    } catch (e: any) {
      toast.error('Erro ao criar agendamento.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Agendamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Médico *</Label>
            <Select value={doctorId} onValueChange={setDoctorId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o médico" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name} {d.specialty ? `- ${d.specialty}` : ''} ({d.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Paciente *</Label>
              {doctorId && (
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  {loadingFinancas ? (
                    'Consultando FinançasMed...'
                  ) : financasStatus ? (
                    <Badge
                      variant="outline"
                      className="text-[10px] py-0 border-blue-200 text-blue-700 bg-blue-50/50"
                    >
                      {financasStatus}
                    </Badge>
                  ) : null}
                </span>
              )}
            </div>

            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o paciente" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {/* Pacientes cadastrados no FinançasMed para este médico */}
                {financasPacientes.length > 0 && (
                  <div className="px-2 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50/70 rounded-sm mb-1">
                    Pacientes no FinançasMed ({financasPacientes.length})
                  </div>
                )}
                {financasPacientes.map((fp) => {
                  // Procura se já existe correspondente na V MED pelo CPF, e-mail ou nome
                  const match = patients.find(
                    (p) =>
                      (fp.cpf && (p.document_id === fp.cpf || p.tax_id === fp.cpf)) ||
                      (fp.email && p.email && p.email.toLowerCase() === fp.email.toLowerCase()) ||
                      p.name?.toLowerCase() === fp.name?.toLowerCase(),
                  )
                  const targetValue = match?.id || `financas:${fp.id}`
                  return (
                    <SelectItem key={`financas-${fp.id}`} value={targetValue}>
                      <span className="flex items-center gap-2">
                        <span className="font-medium">{fp.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold">
                          FinançasMed{fp.origin ? ` • ${fp.origin}` : ''}
                        </span>
                        {fp.phone && (
                          <span className="text-muted-foreground text-xs">{fp.phone}</span>
                        )}
                      </span>
                    </SelectItem>
                  )
                })}

                {/* Todos os pacientes cadastrados na plataforma V MED */}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/40 rounded-sm my-1">
                  Base V MED BRASIL ({patients.length})
                </div>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} {p.document_id ? `(${p.document_id})` : p.email ? `(${p.email})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Ao confirmar o agendamento, os dados do paciente são enviados automaticamente para o
              FinançasMed do médico.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Data *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Presencial">Presencial</SelectItem>
                  <SelectItem value="Online">Online</SelectItem>
                  <SelectItem value="Domiciliar">Domiciliar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Classificação *</Label>
            <Select value={classification} onValueChange={setClassification}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="first_visit">Primeira Consulta</SelectItem>
                <SelectItem value="follow_up">Retorno</SelectItem>
                <SelectItem value="emergency">Emergência</SelectItem>
                <SelectItem value="telemedicine">Telemedicina</SelectItem>
                <SelectItem value="exam">Exame</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {date && doctorId && (
            <div className="space-y-2">
              <Label>Horários Disponíveis *</Label>
              {slots.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {slots.map((t) => (
                    <Button
                      key={t}
                      variant={selectedTime === t ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedTime(t)}
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      {t}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhum horário disponível para esta data/tipo.
                </p>
              )}
            </div>
          )}
          <div className="space-y-2 rounded-lg border p-3 bg-muted/30">
            <Label className="text-sm font-semibold">Dados Financeiros (GestãoMed)</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">% Repasse</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={repassePct}
                  onChange={(e) => setRepassePct(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Forma de Pagamento</Label>
                <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="cartao">Cartão</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Status Pagamento</Label>
                <Select value={statusPagamento} onValueChange={setStatusPagamento}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pago">Pago</SelectItem>
                    <SelectItem value="Aguardando">Aguardando</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Agendando...' : 'Confirmar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
