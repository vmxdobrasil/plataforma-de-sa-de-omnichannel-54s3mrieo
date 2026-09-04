import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowRight, MessageCircle, Sparkles, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CreditSimulator, type SimulationData } from '@/components/landing/CreditSimulator'
import { WhatsAppLeadModal } from '@/components/landing/WhatsAppLeadModal'
import { SocialProof } from '@/components/landing/SocialProof'
import { SecuritySeals } from '@/components/landing/SecuritySeals'
import defaultLogo from '@/assets/1002440441png1782862869065-a785f.png'

export default function B2CLanding() {
  const navigate = useNavigate()
  const [modalOpen, setModalOpen] = useState(false)
  const [simulation, setSimulation] = useState<SimulationData | null>(null)

  const benefits = [
    'Consultas presenciais e online',
    'Crédito para farmácia e exames',
    'Telemedicina 24h',
    'Sem carência e sem burocracia',
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50/30">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-emerald-100">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <img src={defaultLogo} alt="V MED BRASIL" className="h-12 w-auto" />
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-emerald-600 text-emerald-700 hover:bg-emerald-50"
            onClick={() => navigate('/login')}
          >
            Entrar
          </Button>
        </div>
      </header>

      <section className="px-4 pt-10 pb-8 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium mb-4 animate-fade-in-up">
            <Sparkles className="h-3 w-3" /> Mais de 10.000 membros ativos
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-foreground leading-tight mb-4 animate-fade-in-up">
            Sua saúde e benefícios em um só lugar
          </h1>
          <p className="text-lg text-muted-foreground mb-6 animate-fade-in-up">
            Crédito para consultas, exames e farmácia. Sem carência, sem burocracia.
          </p>
          <Button
            size="lg"
            className="rounded-full h-14 px-8 text-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg animate-fade-in-up"
            onClick={() =>
              document.getElementById('simulator')?.scrollIntoView({ behavior: 'smooth' })
            }
          >
            Quero meu limite de crédito <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            {benefits.map((b) => (
              <div key={b} className="flex items-center gap-1 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-emerald-600" /> {b}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="simulator" className="px-4 py-8">
        <div className="max-w-md mx-auto">
          <CreditSimulator onSimulate={setSimulation} />
        </div>
      </section>

      <SocialProof />
      <SecuritySeals />

      <footer className="py-6 text-center text-xs text-muted-foreground border-t border-border/40 space-y-2">
        <p>V MED BRASIL © 2026 — Todos os direitos reservados</p>
        <p className="mt-1">CNPJ: 00.000.000/0001-00</p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            to="/termos-de-uso"
            className="hover:text-emerald-700 underline-offset-4 hover:underline"
          >
            Termos de Uso
          </Link>
          <span>•</span>
          <Link
            to="/politica-de-privacidade"
            className="hover:text-emerald-700 underline-offset-4 hover:underline"
          >
            Política de Privacidade
          </Link>
        </div>
      </footer>

      <button
        onClick={() => setModalOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-emerald-500 hover:bg-emerald-600 shadow-xl flex items-center justify-center transition-all hover:scale-110 animate-fade-in"
        aria-label="Falar no WhatsApp"
      >
        <MessageCircle className="h-7 w-7 text-white" />
        <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
      </button>

      <WhatsAppLeadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        simulation={simulation}
      />
    </div>
  )
}
