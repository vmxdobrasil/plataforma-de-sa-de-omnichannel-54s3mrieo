import {
  LayoutDashboard,
  Users,
  GitBranch,
  Activity,
  CheckSquare,
  FileText,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const navItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Painel' },
  { id: 'leads', icon: Users, label: 'Leads' },
  { id: 'pipeline', icon: GitBranch, label: 'Pipeline' },
  { id: 'activities', icon: Activity, label: 'Atividades' },
  { id: 'tasks', icon: CheckSquare, label: 'Tarefas' },
  { id: 'proposals', icon: FileText, label: 'Propostas' },
  { id: 'reports', icon: BarChart3, label: 'Relatórios' },
]

interface CrmSidebarProps {
  activeView: string
  onViewChange: (view: string) => void
}

export function CrmSidebar({ activeView, onViewChange }: CrmSidebarProps) {
  return (
    <div className="glass-sidebar-crm sticky top-0 self-start flex flex-col items-center gap-2 p-3 h-fit min-h-[400px] w-16 shrink-0">
      <div className="w-10 h-10 rounded-2xl bg-brand-gradient flex items-center justify-center mb-2 shrink-0">
        <span className="text-white font-bold text-sm">V</span>
      </div>
      {navItems.map((item) => (
        <Tooltip key={item.id}>
          <TooltipTrigger asChild>
            <button
              onClick={() => onViewChange(item.id)}
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200',
                activeView === item.id
                  ? 'bg-brand-gradient text-white shadow-lg'
                  : 'text-white/60 hover:text-white hover:bg-white/10',
              )}
            >
              <item.icon className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {item.label}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}
