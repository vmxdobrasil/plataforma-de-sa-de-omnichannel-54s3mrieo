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

const navItems = [
  { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'pipeline', label: 'Pipeline', icon: GitBranch },
  { id: 'activities', label: 'Atividades', icon: Activity },
  { id: 'tasks', label: 'Tarefas', icon: CheckSquare },
  { id: 'proposals', label: 'Propostas', icon: FileText },
  { id: 'reports', label: 'Relatórios', icon: BarChart3 },
]

export function CRMSidebar({
  activeTab,
  onTabChange,
}: {
  activeTab: string
  onTabChange: (tab: string) => void
}) {
  return (
    <aside className="sticky top-4 self-start hidden lg:flex flex-col items-center gap-2 bg-black rounded-3xl p-3 shadow-2xl shrink-0">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onTabChange(item.id)}
          title={item.label}
          className={cn(
            'group relative flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-300',
            activeTab === item.id
              ? 'bg-emerald-500 text-white scale-110 shadow-lg shadow-emerald-500/30'
              : 'text-white/50 hover:text-white hover:bg-white/10 hover:scale-105',
          )}
        >
          <item.icon className="h-5 w-5" />
          <span className="pointer-events-none absolute left-full ml-3 px-2 py-1 rounded-lg bg-black text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            {item.label}
          </span>
        </button>
      ))}
    </aside>
  )
}
