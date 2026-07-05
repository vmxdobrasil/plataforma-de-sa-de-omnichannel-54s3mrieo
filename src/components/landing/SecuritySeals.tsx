import { ShieldCheck, Lock, HeartPulse, Award } from 'lucide-react'

const seals = [
  { icon: ShieldCheck, label: 'Dados Protegidos', desc: 'Conforme LGPD' },
  { icon: Lock, label: 'Pagamento Seguro', desc: 'Criptografia SSL' },
  { icon: HeartPulse, label: 'Profissionais Verificados', desc: 'CRM validado' },
  { icon: Award, label: 'Plataforma Certificada', desc: 'Qualidade garantida' },
]

export function SecuritySeals() {
  return (
    <section className="py-10 border-t border-border/40">
      <div className="max-w-4xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {seals.map((s) => (
            <div key={s.label} className="flex flex-col items-center text-center gap-2">
              <div className="p-3 rounded-full bg-emerald-50">
                <s.icon className="h-6 w-6 text-emerald-600" />
              </div>
              <p className="text-sm font-semibold">{s.label}</p>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
