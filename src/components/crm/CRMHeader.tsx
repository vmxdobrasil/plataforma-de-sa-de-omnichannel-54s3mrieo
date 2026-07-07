import { Search, Bell, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

const headerTabs = ['Resumo', 'Fundadores', 'Finanças', 'Contatos', 'Crescimento', 'Projetos']

interface CRMHeaderProps {
  activeHeaderTab: string
  onHeaderTabChange: (tab: string) => void
  searchQuery: string
  onSearchChange: (q: string) => void
  userName: string
  userEmail: string
  avatarUrl: string
}

export function CRMHeader({
  activeHeaderTab,
  onHeaderTabChange,
  searchQuery,
  onSearchChange,
  userName,
  userEmail,
  avatarUrl,
}: CRMHeaderProps) {
  return (
    <header className="sticky top-4 z-30 mb-6 backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-4 shadow-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {headerTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => onHeaderTabChange(tab)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200',
                activeHeaderTab === tab
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                  : 'text-white/60 hover:text-white hover:bg-white/10',
              )}
            >
              {tab}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-full w-40 lg:w-64"
            />
          </div>
          <button className="p-2 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all">
            <Bell className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <Avatar className="h-9 w-9 border-2 border-emerald-500/30">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-white/10">
                <User className="h-4 w-4 text-white/60" />
              </AvatarFallback>
            </Avatar>
            <div className="hidden lg:block">
              <p className="text-sm font-medium text-white">{userName}</p>
              <p className="text-xs text-white/50">{userEmail}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
