import { Search, Bell, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

const tabs = ['Resumo', 'Fundadores', 'Finanças', 'Contatos', 'Crescimento', 'Projetos']

interface CrmHeaderProps {
  search: string
  onSearchChange: (value: string) => void
  activeTab: string
  onTabChange: (tab: string) => void
  userName: string
  userRole: string
}

export function CrmHeader({
  search,
  onSearchChange,
  activeTab,
  onTabChange,
  userName,
  userRole,
}: CrmHeaderProps) {
  return (
    <div className="glass-header-crm p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar leads ou empresas..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-white/40 dark:bg-white/5 border-white/20 rounded-xl"
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="w-9 h-9 rounded-xl bg-white/30 dark:bg-white/5 flex items-center justify-center hover:bg-white/40 transition-colors relative">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
          </button>
          <div className="flex items-center gap-2 cursor-pointer">
            <Avatar className="h-9 w-9 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold leading-tight">{userName}</p>
              <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={cn(
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap',
              activeTab === tab
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/20',
            )}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  )
}
