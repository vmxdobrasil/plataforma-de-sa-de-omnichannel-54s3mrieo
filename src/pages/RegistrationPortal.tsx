import { Link } from 'react-router-dom'
import { Building2, Pill, Stethoscope, User, ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import defaultLogo from '@/assets/1002440441png1782862869065-a785f.png'

const paths = [
  {
    title: 'Para Empresas',
    description:
      'Cadastre sua empresa e ofereça benefícios de saúde e bem-estar aos colaboradores.',
    icon: Building2,
    href: '/register/company',
  },
  {
    title: 'Para Farmácias e Laboratórios',
    description: 'Junte-se à rede credenciada e amplie o alcance dos seus serviços.',
    icon: Pill,
    href: '/register/partner',
  },
  {
    title: 'Para Profissionais de Saúde',
    description: 'Médicos, dentistas, fisioterapeutas e nutricionistas: faça parte da rede.',
    icon: Stethoscope,
    href: '/register/professional',
  },
  {
    title: 'Para Você (Individual)',
    description: 'Acesse a rede de saúde e bem-estar da V MED Brasil como paciente.',
    icon: User,
    href: '/register/individual',
  },
]

const benefits = [
  'Agendamento online',
  'Prontuário digital',
  'Rede credenciada',
  'Suporte dedicado',
]

export default function RegistrationPortal() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <img src={defaultLogo} alt="V MED Brasil" className="h-12 sm:h-14 object-contain" />
          <Button
            asChild
            variant="outline"
            className="rounded-full border-primary text-primary hover:bg-primary/5"
          >
            <Link to="/login">Entrar</Link>
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-10 sm:py-16">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            Comece sua jornada na <span className="text-primary">V MED Brasil</span>
          </h1>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            Escolha o perfil que melhor se adapta a você e faça parte da maior plataforma integrada
            de saúde do Brasil.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
          {paths.map((p) => (
            <Card
              key={p.href}
              className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-border/50"
            >
              <CardContent className="p-6 sm:p-7">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <p.icon className="h-7 w-7 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-foreground mb-1">{p.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
                    <Button
                      asChild
                      className="mt-4 rounded-full bg-primary hover:bg-primary/90 text-sm"
                    >
                      <Link to={p.href}>
                        Cadastrar <ArrowRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-primary/5 rounded-2xl p-6 sm:p-8 border border-primary/10">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
            {benefits.map((b) => (
              <div key={b} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                  <Check className="h-3 w-3 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">{b}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-8">
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            ← Voltar para o início
          </Link>
        </div>

        <footer className="mt-12 pt-6 border-t border-border/50 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
          <Link
            to="/termos-de-uso"
            className="hover:text-primary transition-colors hover:underline"
          >
            Termos de Uso
          </Link>
          <span>•</span>
          <Link
            to="/politica-de-privacidade"
            className="hover:text-primary transition-colors hover:underline"
          >
            Política de Privacidade
          </Link>
        </footer>
      </div>
    </div>
  )
}
