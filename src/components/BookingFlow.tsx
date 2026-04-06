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

    if (method === 'corporate') {
      if (!employeeData?.company_id) {
        toast.error('Benefício corporativo não encontrado.')
        return
      }
      if (
        employeeData.allowance_type === 'benefit' &&
        (employeeData.health_allowance || 0) < appointmentCost
      ) {
        toast.error('Saldo de benefício insuficiente para realizar este agendamento.')
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

      if (method === 'corporate') {
        const newAllowance = (employeeData.health_allowance || 0) - appointmentCost

        await pb.collection('benefit_transactions').create({
          employee_id: employeeData.id,
          company_id: employeeData.company_id,
          appointment_id: appointment.id,
          amount: appointmentCost,
          type: 'debit',
          category: 'health_service',
          description: `Pagamento de consulta: ${mode}`,
        })

        await pb.collection('users').update(employeeData.id, {
          health_allowance: newAllowance,
        })

        setPaymentDetails({ amount: appointmentCost, remaining: newAllowance, method })
      } else {
        setPaymentDetails({ amount: appointmentCost, remaining: 0, method })
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
        method === 'corporate' ? 4000 : 2000,
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

              {employeeData?.company_id && (
                <Button
                  variant="outline"
                  className="w-full justify-start h-16 hover:border-primary"
                  onClick={() => handleSelectPayment('corporate')}
                  disabled={isSubmitting}
                >
                  <div className="mr-4 h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">
                    C
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Crédito Corporativo</p>
                    <p className="text-xs text-muted-foreground">
                      Saldo: R$ {employeeData.health_allowance?.toFixed(2) || '0.00'}
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
                <CreditCard className="mr-4 h-6 w-6 text-primary" />
                <div className="text-left">
                  <p className="font-semibold">Cartão de Crédito</p>
                  <p className="text-xs text-muted-foreground">Finalizado em 4242</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start h-16 hover:border-primary"
                onClick={() => handleSelectPayment('insurance')}
                disabled={isSubmitting}
              >
                <div className="mr-4 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                  P
                </div>
                <div className="text-left">
                  <p className="font-semibold">Plano de Saúde</p>
                  <p className="text-xs text-muted-foreground">Bradesco Saúde Top</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start h-16 hover:border-emerald-500"
                onClick={() => handleSelectPayment('pix')}
                disabled={isSubmitting}
              >
                <div className="mr-4 h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm">
                  $
                </div>
                <div className="text-left">
                  <p className="font-semibold">PIX</p>
                  <p className="text-xs text-muted-foreground">Aprovação imediata</p>
                </div>
              </Button>
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
              {paymentDetails?.method === 'corporate' && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg text-left border">
                  <p className="font-semibold text-sm mb-2 border-b pb-2">
                    Comprovante de Uso de Benefício
                  </p>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Valor deduzido:</span>
                    <span className="font-medium text-destructive">
                      - R$ {paymentDetails.amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Saldo restante:</span>
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
