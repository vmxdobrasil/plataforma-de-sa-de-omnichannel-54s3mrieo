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
import { toast } from '@/hooks/use-toast'
import { CheckCircle2, Clock, CreditCard } from 'lucide-react'

interface BookingFlowProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  professionalName: string
}

export function BookingFlow({ open, onOpenChange, professionalName }: BookingFlowProps) {
  const [step, setStep] = useState(1)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [time, setTime] = useState<string | null>(null)

  const timeSlots = ['09:00', '10:30', '14:00', '15:30', '16:00']

  const handleNext = () => {
    if (step === 1 && (!date || !time)) {
      toast({ title: 'Selecione data e horário', variant: 'destructive' })
      return
    }
    if (step === 3) {
      toast({
        title: 'Agendamento Confirmado!',
        description: `Sua consulta com ${professionalName} está marcada.`,
      })
      onOpenChange(false)
      setTimeout(() => setStep(1), 500)
      return
    }
    setStep((s) => s + 1)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agendar com {professionalName}</DialogTitle>
          <DialogDescription>
            {step === 1 && 'Passo 1 de 3: Escolha a data e horário'}
            {step === 2 && 'Passo 2 de 3: Confirme a forma de pagamento'}
            {step === 3 && 'Passo 3 de 3: Revisão do agendamento'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === 1 && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map((t) => (
                  <Button
                    key={t}
                    variant={time === t ? 'default' : 'outline'}
                    onClick={() => setTime(t)}
                    className="w-full"
                  >
                    <Clock className="mr-2 h-4 w-4" /> {t}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in-up">
              <Button variant="outline" className="w-full justify-start h-14" onClick={handleNext}>
                <CreditCard className="mr-4 h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-semibold">Cartão de Crédito</p>
                  <p className="text-xs text-muted-foreground">Finalizado em 4242</p>
                </div>
              </Button>
              <Button variant="outline" className="w-full justify-start h-14" onClick={handleNext}>
                <div className="mr-4 h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                  P
                </div>
                <div className="text-left">
                  <p className="font-semibold">Plano de Saúde</p>
                  <p className="text-xs text-muted-foreground">Bradesco Saúde Top</p>
                </div>
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fade-in-up text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="h-16 w-16 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Tudo certo para agendar!</h3>
              <p className="text-sm text-muted-foreground">
                Sua consulta será dia {date?.toLocaleDateString()} às {time}.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-between mt-4">
          <Button
            variant="ghost"
            onClick={() => (step > 1 ? setStep((s) => s - 1) : onOpenChange(false))}
          >
            Voltar
          </Button>
          <Button onClick={handleNext}>{step === 3 ? 'Confirmar Agendamento' : 'Continuar'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
