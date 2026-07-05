import { Phone, Mail, Calendar, FileText } from 'lucide-react'

const interactions = [
  {
    icon: Phone,
    title: 'Ligação - TechHealth Solutions',
    desc: 'Discussão sobre plano empresarial',
    time: '2h atrás',
    color: 'blue',
    avatar: 'TH',
  },
  {
    icon: Mail,
    title: 'Email - Grupo Vida Plena',
    desc: 'Proposta enviada para análise',
    time: '5h atrás',
    color: 'teal',
    avatar: 'VP',
  },
  {
    icon: Calendar,
    title: 'Reunião - Indústria MedBrasil',
    desc: 'Apresentação da plataforma',
    time: '1d atrás',
    color: 'yellow',
    avatar: 'IM',
  },
  {
    icon: FileText,
    title: 'Contrato - Clínica Vital',
    desc: 'Documento assinado digitalmente',
    time: '2d atrás',
    color: 'purple',
    avatar: 'CV',
  },
]

const colorMap: Record<string, string> = {
  blue: 'bg-blue-500/10 border-blue-500/20',
  teal: 'bg-teal-500/10 border-teal-500/20',
  yellow: 'bg-yellow-500/10 border-yellow-500/20',
  purple: 'bg-purple-500/10 border-purple-500/20',
}

export function CrmInteractionHistory() {
  return (
    <div className="glass-card p-5">
      <h3 className="text-lg font-bold mb-4">Histórico de Interações</h3>
      <div className="space-y-3">
        {interactions.map((item, i) => (
          <div
            key={i}
            className={`rounded-2xl border p-3 flex items-start gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.01] ${colorMap[item.color]}`}
          >
            <div className="w-10 h-10 rounded-xl bg-white/50 dark:bg-white/5 flex items-center justify-center shrink-0">
              <item.icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{item.title}</p>
              <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                {item.avatar}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
