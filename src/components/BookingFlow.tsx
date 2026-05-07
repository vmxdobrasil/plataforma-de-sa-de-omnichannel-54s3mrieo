import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Calendar } from '@/components/ui/calendar'
import { toast } from 'sonner'
import { CheckCircle2, Clock, CreditCard, Video, Home as HomeIcon, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { createAppointment } from '@/services/appointments'
import { getDependents } from '@/services/users'
import { getAvailabilitySlots } from '@/services/availability'
import pb from '@/lib/pocketbase/client'
import { useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface BookingFlowProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  professional: any
}

export function BookingFlow({ open, onOpenChange, professional }: BookingFlowProps) {
  const [step, setStep] = useState(1)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [time, setTime] = useState<string | null>(null)
  const [mode, setMode] = useState<'Presencial' | 'Online' | 'Domiciliar'>('Presencial')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()
  const [dependents, setDependents] = useState<any[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState<string>('')
  const [employeeData, setEmployeeData] = useState<any>(null)
  const [availableSlots, setAvailableSlots] = useState<any[]>([])
  const [paymentDetails, setPaymentDetails] = useState<{
    amount: number
    remaining: number
    method: string
  } | null>(null)

  useEffect(() => {
    if (professional?.id) {
      getAvailabilitySlots(professional.id).then(setAvailableSlots).catch(console.error)
    }
    if (user?.id) {
      setSelectedPatientId(user.id)
      getDependents(user.id).then(setDependents).catch(console.error)

      if (user.parent_id) {
        pb.collection('users').getOne(user.parent_id).then(setEmployeeData).catch(console.error)
      } else if (user.company_id) {
        pb.collection('users').getOne(user.id).then(setEmployeeData).catch(console.error)
      }
    }
  }, [user])

  const generatedTimeSlots = date
    ? (() => {
        const dayOfWeek = date.getDay().toString()
        const matchSlots = availableSlots.filter(
          (s) => s.day_of_week === dayOfWeek && s.slot_type === mode,
        )
        if (matchSlots.length === 0) return []
        const slots = []
        for (const s of matchSlots) {
          const startH = parseInt(s.start_time.split(':')[0])
          const endH = parseInt(s.end_time.split(':')[0])
          for (let h = startH; h < endH; h++) {
            slots.push(`${h.toString().padStart(2, '0')}:00`)
          }
        }
        return Array.from(new Set(slots)).sort()
      })()
    : []

  const timeSlots = generatedTimeSlots.length > 0 ? generatedTimeSlots : []

  const handleSelectTime = (t: string) => {
    setTime(t)
    setStep(2)
  }

  const handleSelectPayment = async (method: string) => {
    if (!date || !time || !user) return

    const appointmentCost = 150 // Mock cost
    const healthBalance = employeeData?.health_allowance || 0

    if (employeeData?.is_blocked) {
      toast.error('O acesso corporativo deste usuário está bloqueado.')
      return
    }

    if (method === 'corporate_full' || method === 'payroll') {
      if (!employeeData?.company_id) {
        toast.error('Vínculo corporativo não encontrado.')
        return
      }
      if (healthBalance < appointmentCost) {
        toast.error('Saldo em Reais insuficiente para o valor total.')
        return
      }
    } else if (method === 'wallet') {
      if (healthBalance < appointmentCost) {
        toast.error('Saldo em Reais insuficiente.')
        return
      }
    }

    setIsSubmitting(true)

    try {
      const [hours, minutes] = time.split(':')
      const dateTime = new Date(date)
      dateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0)

      const appointment = await createAppointment({
        patient_id: selectedPatientId || user.id,
        professional_id: professional.id,
        dateTime: dateTime.toISOString(),
        type: mode,
        status: 'scheduled',
      })

      if (method === 'corporate_full' || method === 'payroll' || method === 'wallet') {
        const newAllowance = healthBalance - appointmentCost

        await pb.collection('benefit_transactions').create({
          employee_id: employeeData.id,
          company_id: employeeData.company_id || employeeData.id,
          appointment_id: appointment.id,
          amount: appointmentCost,
          type: 'debit',
          category: 'health_service',
          description: `Pagamento de consulta: ${mode} (${method === 'payroll' ? 'Desconto em Folha' : 'Benefício Corporativo'})`,
        })

        await pb.collection('users').update(employeeData.id, {
          health_allowance: newAllowance,
        })

        setPaymentDetails({ amount: appointmentCost, remaining: newAllowance, method })
      } else if (method.startsWith('corporate_split')) {
        const splitAmount = appointmentCost - healthBalance
        const secMethod = method.split('_')[2]

        await pb.collection('benefit_transactions').create({
          employee_id: employeeData.id,
          company_id: employeeData.company_id || employeeData.id,
          appointment_id: appointment.id,
          amount: healthBalance,
          type: 'debit',
          category: 'health_service',
          description: `Pagamento de consulta (Parte Corporativa): ${mode}`,
        })

        await pb.collection('benefit_transactions').create({
          employee_id: employeeData.id,
          company_id: employeeData.company_id || employeeData.id,
          appointment_id: appointment.id,
          amount: splitAmount,
          type: 'debit',
          category: 'health_service',
          description: `Pagamento Direto (${secMethod.toUpperCase()}) - Complemento`,
        })

        await pb.collection('users').update(employeeData.id, {
          health_allowance: 0,
        })

        setPaymentDetails({ amount: appointmentCost, remaining: 0, method: 'corporate_split' })
      } else if (method === 'pix' || method === 'credit') {
        if (!employeeData.asaas_customer_id) {
          await pb.collection('users').update(employeeData.id, {
            asaas_customer_id: 'cus_mock_' + Math.random().toString(36).substr(2, 9),
          })
        }
        await pb.collection('benefit_transactions').create({
          employee_id: employeeData.id,
          company_id: employeeData.id,
          appointment_id: appointment.id,
          amount: appointmentCost,
          type: 'debit',
          category: 'health_service',
          description: `Pagamento Direto: ${mode} (${method.toUpperCase()})`,
        })
        setPaymentDetails({ amount: appointmentCost, remaining: healthBalance, method })
      }

      setStep(3)
      toast.success(`Agendamento Confirmado com ${professional.name}!`)

      setTimeout(
        () => {
          onOpenChange(false)
          setTimeout(() => {
            setStep(1)
            setTime(null)
            setPaymentDetails(null)
          }, 500)
        },
        method.includes('corporate') ? 4000 : 2000,
      )
    } catch (error) {
      toast.error('Erro ao confirmar agendamento. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agendar com {professional?.name}</DialogTitle>
          <DialogDescription>
            {step === 1 && 'Passo 1 de 2: Escolha o horário'}
            {step === 2 && 'Passo 2 de 2: Confirme a forma de pagamento'}
            {step === 3 && 'Agendamento Concluído!'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === 1 && (
            <div className="space-y-4 animate-fade-in-up">
              {dependents.length > 0 && (
                <div className="space-y-2 mb-4">
                  <Label>Para quem é a consulta?</Label>
                  <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o paciente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={user?.id || 'self'}>Para mim ({user?.name})</SelectItem>
                      {dependents.map((dep) => (
                        <SelectItem key={dep.id} value={dep.id}>
                          {dep.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-2 justify-center mb-4">
                <Button
                  size="sm"
                  variant={mode === 'Presencial' ? 'default' : 'outline'}
                  onClick={() => setMode('Presencial')}
                  className="flex-1"
                >
                  <MapPin className="mr-2 h-4 w-4" /> Presencial
                </Button>
                <Button
                  size="sm"
                  variant={mode === 'Online' ? 'default' : 'outline'}
                  onClick={() => setMode('Online')}
                  className="flex-1"
                >
                  <Video className="mr-2 h-4 w-4" /> Online
                </Button>
                <Button
                  size="sm"
                  variant={mode === 'Domiciliar' ? 'default' : 'outline'}
                  onClick={() => setMode('Domiciliar')}
                  className="flex-1"
                >
                  <HomeIcon className="mr-2 h-4 w-4" /> Domiciliar
                </Button>
              </div>

              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border p-2"
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </div>

              {date && timeSlots.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((t) => (
                    <Button
                      key={t}
                      variant="outline"
                      onClick={() => handleSelectTime(t)}
                      className="w-full hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      <Clock className="mr-2 h-4 w-4" /> {t}
                    </Button>
                  ))}
                </div>
              ) : date && timeSlots.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Profissional não possui horários para este dia/modalidade.
                </p>
              ) : null}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="bg-muted/50 p-4 rounded-lg mb-4 text-center">
                <p className="text-sm font-medium">Resumo do Agendamento</p>
                <div className="flex justify-center items-center gap-2 mt-2">
                  <Badge variant="secondary">{mode}</Badge>
                  <span className="text-sm font-semibold">
                    {date?.toLocaleDateString()} às {time}
                  </span>
                </div>
              </div>

              {employeeData?.company_id ? (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Saldo em Reais</h3>
                  {employeeData.allowance_type === 'payroll_deduction' ? (
                    <Button
                      variant="outline"
                      className="w-full justify-start h-auto py-4 hover:border-primary"
                      onClick={() => handleSelectPayment('payroll')}
                      disabled={isSubmitting || (employeeData.health_allowance || 0) < 150}
                    >
                      <div className="mr-4 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                        F
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-semibold">Desconto em Folha</p>
                        <p className="text-xs text-muted-foreground whitespace-normal">
                          O valor será descontado na sua próxima folha de pagamento. Limite
                          disponível: R$ {employeeData.health_allowance?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      {(employeeData.health_allowance || 0) >= 150 ? (
                        <Button
                          variant="outline"
                          className="w-full justify-start h-16 hover:border-primary bg-emerald-50 border-emerald-200"
                          onClick={() => handleSelectPayment('corporate_full')}
                          disabled={isSubmitting}
                        >
                          <div className="mr-4 h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm shrink-0">
                            $
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-emerald-900">Usar Saldo em Reais</p>
                            <p className="text-xs text-emerald-700">
                              Disponível: R$ {employeeData.health_allowance?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                        </Button>
                      ) : (employeeData.health_allowance || 0) > 0 ? (
                        <div className="p-4 border rounded-lg bg-amber-50 border-amber-200">
                          <p className="font-semibold text-amber-900 mb-1">
                            Saldo Parcial Disponível
                          </p>
                          <p className="text-sm text-amber-800 mb-3">
                            Você tem <strong>R$ {employeeData.health_allowance?.toFixed(2)}</strong>{' '}
                            em saldo corporativo. Faltam{' '}
                            <strong>R$ {(150 - employeeData.health_allowance).toFixed(2)}</strong>.
                          </p>
                          <p className="text-sm font-medium text-amber-900 mb-2">
                            Pagar o restante com:
                          </p>
                          <div className="flex gap-2">
                            <Button
                              className="flex-1 bg-amber-600 hover:bg-amber-700"
                              onClick={() => handleSelectPayment('corporate_split_pix')}
                              disabled={isSubmitting}
                            >
                              PIX
                            </Button>
                            <Button
                              className="flex-1 bg-amber-600 hover:bg-amber-700"
                              onClick={() => handleSelectPayment('corporate_split_credit')}
                              disabled={isSubmitting}
                            >
                              Cartão
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 border rounded-lg bg-muted/30">
                          <p className="text-sm font-medium text-destructive mb-3">
                            Saldo corporativo esgotado.
                          </p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleSelectPayment('pix')}
                              disabled={isSubmitting}
                            >
                              PIX
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleSelectPayment('credit')}
                              disabled={isSubmitting}
                            >
                              Cartão
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Pagamento Particular</h3>
                  {employeeData && (employeeData.health_allowance || 0) > 0 && (
                    <Button
                      variant="outline"
                      className="w-full justify-start h-16 hover:border-primary"
                      onClick={() => handleSelectPayment('wallet')}
                      disabled={isSubmitting}
                    >
                      <div className="mr-4 h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-sm shrink-0">
                        $
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">Saldo em Carteira (Asaas)</p>
                        <p className="text-xs text-muted-foreground">
                          Saldo: R$ {employeeData.health_allowance?.toFixed(2)}
                        </p>
                      </div>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="w-full justify-start h-16 hover:border-primary"
                    onClick={() => handleSelectPayment('credit')}
                    disabled={isSubmitting}
                  >
                    <CreditCard className="mr-4 h-6 w-6 text-primary shrink-0" />
                    <div className="text-left">
                      <p className="font-semibold">Cartão de Crédito (Asaas)</p>
                      <p className="text-xs text-muted-foreground">Adicionar novo cartão</p>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start h-16 hover:border-emerald-500"
                    onClick={() => handleSelectPayment('pix')}
                    disabled={isSubmitting}
                  >
                    <div className="mr-4 h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm shrink-0">
                      P
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">PIX (Asaas)</p>
                      <p className="text-xs text-muted-foreground">Aprovação imediata</p>
                    </div>
                  </Button>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fade-in-up text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="h-16 w-16 text-primary" />
              </div>
              <h3 className="font-semibold text-lg text-primary">Pronto!</h3>
              <p className="text-sm text-muted-foreground">
                Consulta {mode} agendada para {date?.toLocaleDateString()} às {time}.
              </p>
              {(paymentDetails?.method === 'corporate_full' ||
                paymentDetails?.method === 'corporate_split') && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg text-left border">
                  <p className="font-semibold text-sm mb-2 border-b pb-2">
                    Comprovante de Uso de Saldo
                  </p>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Valor deduzido do saldo:</span>
                    <span className="font-medium text-destructive">
                      - R${' '}
                      {paymentDetails.method === 'corporate_split'
                        ? employeeData?.health_allowance?.toFixed(2)
                        : paymentDetails.amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Saldo Saúde restante:</span>
                    <span className="font-medium">R$ {paymentDetails.remaining.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {step < 3 && (
          <div className="flex justify-start mt-4 border-t pt-4">
            <Button
              variant="ghost"
              onClick={() => (step > 1 ? setStep((s) => s - 1) : onOpenChange(false))}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
