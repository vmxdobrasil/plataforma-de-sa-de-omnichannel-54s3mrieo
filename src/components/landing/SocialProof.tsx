import { Star, Quote } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const testimonials = [
  {
    name: 'Mariana Silva',
    role: 'Paciente',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=1',
    text: 'Agendei minha consulta em minutos e paguei com o crédito da empresa. Praticidade total!',
  },
  {
    name: 'Carlos Eduardo',
    role: 'Paciente',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=2',
    text: 'O simulador de crédito me mostrou na hora quanto eu tinha disponível. Atendimento excelente!',
  },
  {
    name: 'Patrícia Mendes',
    role: 'Paciente',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=3',
    text: 'Telemedicina funcionou perfeitamente. Recebi minha receita digital sem sair de casa.',
  },
]

export function SocialProof() {
  return (
    <section className="py-12 bg-muted/30">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-2">Prova Social</h2>
        <p className="text-center text-muted-foreground mb-8">O que dizem nossos membros</p>
        <div className="grid md:grid-cols-3 gap-4">
          {testimonials.map((t) => (
            <Card key={t.name} className="border-none shadow-md">
              <CardContent className="p-5">
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <Quote className="h-6 w-6 text-emerald-200 mb-2" />
                <p className="text-sm text-foreground/80 leading-relaxed mb-4">{t.text}</p>
                <div className="flex items-center gap-3">
                  <img src={t.avatar} alt={t.name} className="h-10 w-10 rounded-full" />
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
