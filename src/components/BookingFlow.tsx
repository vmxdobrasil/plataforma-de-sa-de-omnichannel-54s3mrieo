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
import { CheckCircle2, Clock, CreditCard, Video, Home as HomeIcon, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface BookingFlowProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  professionalName: string
}

export function BookingFlow({ open, onOpenChange, professionalName }: BookingFlowProps) {
  const [step, setStep] = useState(1)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [time, setTime] = useState<string | null>(null)
  const [mode, setMode] = useState<'Presencial' | 'Online' | 'Domiciliar'>('Presencial')

  const timeSlots = ['09:00', '10:30', '14:00', '15:30', '16:00']

  const handleSelectTime = (t: string) => {
    setTime(t)
    setStep(2)
  }

  const handleSelectPayment = () => {
    setStep(3)
    toast({
      title: 'Agendamento Confirmado!',
      description: `Sua consulta ${mode} com ${professionalName} está marcada para as ${time}.`,
    })
    setTimeout(() => {
      onOpenChange(false)
      setTimeout(() => {
        setStep(1)
        setTime(null)
      }, 500)
    }, 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agendar com {professionalName}</DialogTitle>
          <DialogDescription>
            {step === 1 && 'Passo 1 de 2: Escolha o horário (Clique para avançar)'}
            {step === 2 && 'Passo 2 de 2: Forma de pagamento (Clique para confirmar)'}
            {step === 3 && 'Agendamento Concluído!'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === 1 && (
            <div className="space-y-4 animate-fade-in-up">
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
                />
              </div>

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

              <Button
                variant="outline"
                className="w-full justify-start h-16 hover:border-primary"
                onClick={handleSelectPayment}
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
                onClick={handleSelectPayment}
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
                onClick={handleSelectPayment}
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
            </div>
          )}
        </div>

        {step < 3 && (
          <div className="flex justify-start mt-4 border-t pt-4">
            <Button
              variant="ghost"
              onClick={() => (step > 1 ? setStep((s) => s - 1) : onOpenChange(false))}
            >
              Cancelar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
