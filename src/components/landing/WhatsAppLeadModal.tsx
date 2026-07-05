import { useState } from 'react'
import { MessageCircle, Loader2, Send } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createLead } from '@/services/registration-leads'
import type { SimulationData } from './CreditSimulator'
import { toast } from 'sonner'

const WHATSAPP_NUMBER = '5511300000000'
const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export function WhatsAppLeadModal({
  open,
  onClose,
  simulation,
}: {
  open: boolean
  onClose: () => void
  simulation: SimulationData | null
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) {
      toast.error('Preencha seu nome e telefone.')
      return
    }
    setLoading(true)
    try {
      await createLead({
        name: name.trim(),
        email: `${phone.replace(/\D/g, '')}@landing.vmed.com.br`,
        phone: phone.trim(),
        type: 'individual',
        status: 'pending',
        metadata: {
          source: 'landing_page',
          simulation: simulation
            ? {
                salary: simulation.salary,
                consultationCredit: simulation.consultationCredit,
                pharmacyCredit: simulation.pharmacyCredit,
              }
            : null,
          whatsapp: true,
        },
      })
      const msg = `Olá! Meu nome é ${name}. Gostaria de saber mais sobre os benefícios da V MED BRASIL.${
        simulation
          ? `\n\nSimulação:\n• Salário: ${fmtBRL(simulation.salary)}\n• Limite Consultas: ${fmtBRL(simulation.consultationCredit)}\n• Limite Farmácia: ${fmtBRL(simulation.pharmacyCredit)}`
          : ''
      }`
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank')
      toast.success('Redirecionando para o WhatsApp...')
      setName('')
      setPhone('')
      onClose()
    } catch {
      toast.error('Erro ao enviar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-700">
            <MessageCircle className="h-5 w-5" /> Fale com nosso time
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Preencha seus dados e fale agora com nossa equipe comercial no WhatsApp.
          </p>
          <Input
            placeholder="Seu nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11"
          />
          <Input
            placeholder="(00) 00000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-11"
            inputMode="tel"
          />
          <Button
            className="w-full h-11 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" /> Ir para o WhatsApp
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
