import { useNavigate } from 'react-router-dom'
import { Building2, Pill, HeartPulse, ArrowRight, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import defaultLogo from '@/assets/1002440441png1782862869065-a785f.png'

export default function RegistrationPortal() {
  const navigate = useNavigate()

  const cards = [
    {
      icon: Building2,
      title: 'Para Empresas',
      description:
        'Cadastre sua empresa e ofereça benefícios de saúde e farmácia aos seus colaboradores.',
      path: '/register/company',
      accent: 'bg-blue-600',
    },
    {
      icon: Pill,
      title: 'Para Farmácias e Laboratórios',
      description:
        'Junte-se à nossa rede credenciada e amplie o alcance dos seus serviços de saúde.',
      path: '/register/partner',
      accent: 'bg-cyan-600',
    },
    {
      icon: HeartPulse,
      title: 'Para Você (Individual)',
      description:
        'Acesse consultas, exames e farmácia com a qualidade V MED BRASIL. Cadastro rápido e fácil.',
      path: '/register/individual',
      accent: 'bg-teal-600',
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800">
      <header className="px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={defaultLogo} alt="V MED BRASIL" className="h-12 w-auto object-contain" />
        </div>
        <Button
          variant="outline"
          className="border-white/30 text-white hover:bg-white/10 hover:text-white"
          onClick={() => navigate('/login')}
        >
          Já tenho conta
        </Button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
            <ShieldCheck className="h-4 w-4 text-blue-300" />
            <span className="text-sm font-medium text-blue-100">Plataforma Integrada de Saúde</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Comece sua jornada com a <span className="text-blue-300">V MED BRASIL</span>
          </h1>
          <p className="text-lg text-blue-100/80 max-w-2xl mx-auto">
            Escolha a opção que melhor se adequa ao seu perfil e inicie seu cadastro agora mesmo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
          {cards.map((card, i) => (
            <Card
              key={card.title}
              className="border-white/20 bg-white/95 backdrop-blur-sm shadow-2xl hover:scale-[1.02] transition-transform cursor-pointer animate-fade-in-up overflow-hidden"
              style={{ animationDelay: `${i * 0.1}s` }}
              onClick={() => navigate(card.path)}
            >
              <CardContent className="p-8 flex flex-col items-center text-center h-full">
                <div className={`${card.accent} p-5 rounded-2xl mb-6 shadow-lg`}>
                  <card.icon className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-blue-950 mb-3">{card.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">
                  {card.description}
                </p>
                <Button
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-full"
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(card.path)
                  }}
                >
                  Iniciar Cadastro <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-blue-200/60 text-sm mt-12">
          V MED BRASIL © 2026 — Administradora de Cartões e Benefícios Ltda
        </p>
      </main>
    </div>
  )
}
