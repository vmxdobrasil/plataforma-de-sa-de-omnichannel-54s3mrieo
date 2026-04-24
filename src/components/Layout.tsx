import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  HeartPulse,
  Home,
  Search,
  Stethoscope,
  Activity,
  User,
  LogOut,
  MessageSquare,
  Folder,
  Settings,
  Sliders,
  ShoppingBag,
  Palette,
  GraduationCap,
  Bot,
  TrendingUp,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from './ThemeToggle'
import { AIAssistant } from './AIAssistant'
import { useAuth } from '@/hooks/use-auth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { SOSCard } from './SOSCard'
import { ChatApp } from './ChatApp'
import { NotificationsPopover } from './NotificationsPopover'
import pb from '@/lib/pocketbase/client'
import { useState, useEffect } from 'react'
import { useRealtime } from '@/hooks/use-realtime'
import logoUrl from '@/assets/image-editing3-e6f7b.png'

const navItems = [
  { title: 'Início', icon: Home, url: '/', roles: ['patient', 'professional'] },
  { title: 'Painel da Empresa', icon: Activity, url: '/company/dashboard', roles: ['company'] },
  { title: 'Buscar Especialistas', icon: Search, url: '/search', roles: ['patient'] },
  { title: 'Meu Perfil de Saúde', icon: HeartPulse, url: '/health-profile', roles: ['patient'] },
  { title: 'Documentos', icon: Folder, url: '/documents', roles: ['patient', 'professional'] },
  {
    title: 'Painel do Profissional',
    icon: Stethoscope,
    url: '/professional',
    roles: ['professional'],
  },
  {
    title: 'Marketplace',
    icon: ShoppingBag,
    url: '/dashboard/marketplace',
    roles: ['professional'],
  },
  { title: 'Brand Kit', icon: Palette, url: '/dashboard/brand-kit', roles: ['professional'] },
  {
    title: 'MED Academy',
    icon: GraduationCap,
    url: '/dashboard/academy',
    roles: ['professional'],
  },
  { title: 'Hub de Agentes IA', icon: Bot, url: '/dashboard/agents', roles: ['professional'] },
  {
    title: 'Dashboard de Agência',
    icon: TrendingUp,
    url: '/dashboard/agency',
    roles: ['professional'],
  },
  { title: 'Configurações', icon: Settings, url: '/settings', roles: ['company'] },
  {
    title: 'Admin Settings',
    icon: Sliders,
    url: '/admin/settings',
    roles: ['company', 'professional'],
  },
]

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const handleLogout = () => {
    signOut()
    navigate('/login')
  }

  const visibleNavItems = navItems.filter((item) => item.roles.includes(user?.role || 'patient'))

  const avatarUrl = user?.avatar
    ? pb.files.getURL({ id: user.id, collectionId: 'users' }, user.avatar)
    : `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.name}`

  const [systemSettings, setSystemSettings] = useState<any>(null)

  const applyBrandColor = (color: string) => {
    if (!color) return
    const hex = color.replace(/^#/, '')
    const r = parseInt(hex.slice(0, 2), 16) / 255
    const g = parseInt(hex.slice(2, 4), 16) / 255
    const b = parseInt(hex.slice(4, 6), 16) / 255
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b)
    let h = 0,
      s = 0,
      l = (max + min) / 2
    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0)
          break
        case g:
          h = (b - r) / d + 2
          break
        case b:
          h = (r - g) / d + 4
          break
      }
      h /= 6
    }
    const hsl = `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
    document.documentElement.style.setProperty('--primary', hsl)
  }

  useEffect(() => {
    pb.collection('system_settings')
      .getFirstListItem('')
      .then((rec) => {
        setSystemSettings(rec)
        applyBrandColor(rec.primary_color)
      })
      .catch(() => {
        /* ignore */
      })
  }, [])

  useRealtime('system_settings', (e) => {
    if (e.action === 'update' || e.action === 'create') {
      setSystemSettings(e.record)
      applyBrandColor(e.record.primary_color)
    }
  })

  const brandLogoUrl = systemSettings?.logo
    ? pb.files.getURL(systemSettings, systemSettings.logo)
    : user?.role === 'company' && user?.avatar
      ? pb.files.getURL({ id: user.id, collectionId: 'users' }, user.avatar)
      : null

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background font-sans text-foreground">
        <Sidebar className="border-r border-border/50">
          <SidebarContent>
            <div className="p-6 flex border-b">
              <Link
                to="/"
                className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity"
                aria-label="MED Logo"
              >
                {brandLogoUrl ? (
                  <img
                    src={brandLogoUrl}
                    alt={user?.name || 'Company Logo'}
                    className="w-full h-14 object-contain object-left"
                  />
                ) : (
                  <img
                    src={logoUrl}
                    alt="MED Logo"
                    className="w-full h-14 object-contain object-left mix-blend-multiply dark:mix-blend-normal dark:bg-white dark:p-1.5 dark:rounded-md"
                  />
                )}
              </Link>
            </div>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu className="mt-4 gap-2 px-2">
                  {visibleNavItems.map((item) => {
                    const isActive = location.pathname === item.url
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.title}
                          className="h-11"
                        >
                          <Link to={item.url} className="flex items-center gap-3 px-3">
                            <item.icon className="h-5 w-5" />
                            <span className="font-medium">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-16 border-b flex items-center justify-between px-4 sm:px-6 bg-card sticky top-0 z-30">
            <div className="flex items-center gap-2 sm:gap-4 flex-1">
              <SidebarTrigger />
              <Link
                to="/"
                className="flex items-center gap-2 md:hidden hover:opacity-80 transition-opacity"
                aria-label="MED Logo"
              >
                {brandLogoUrl ? (
                  <img
                    src={brandLogoUrl}
                    alt={user?.name || 'Company Logo'}
                    className="h-12 w-auto max-w-[180px] object-contain"
                  />
                ) : (
                  <img
                    src={logoUrl}
                    alt="MED Logo"
                    className="h-12 w-auto max-w-[180px] object-contain mix-blend-multiply dark:mix-blend-normal dark:bg-white dark:p-1 dark:rounded-md"
                  />
                )}
              </Link>
              <div className="relative max-w-md w-full hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="MED AI: Como posso ajudar?"
                  className="pl-10 bg-muted/50 border-none rounded-full"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <ThemeToggle />

              <Button
                variant="ghost"
                size="icon"
                onClick={() => document.documentElement.classList.toggle('text-lg')}
                title="Aumentar Fonte"
                className="text-muted-foreground hover:text-primary"
              >
                <span className="font-bold text-lg">A+</span>
              </Button>

              <NotificationsPopover />

              {user?.role === 'patient' && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="hidden md:flex text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive rounded-full"
                    >
                      SOS Emergência
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md p-0 border-none bg-transparent shadow-none">
                    <SOSCard user={user} />
                  </DialogContent>
                </Dialog>
              )}

              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative text-muted-foreground hover:text-primary"
                  >
                    <MessageSquare className="h-5 w-5" />
                    <span className="absolute top-2 right-2 h-2 w-2 bg-blue-500 rounded-full border border-background"></span>
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[400px] sm:w-[540px]">
                  <SheetHeader>
                    <SheetTitle>Mensagens Clínicas</SheetTitle>
                  </SheetHeader>
                  <ChatApp />
                </SheetContent>
              </Sheet>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-9 w-9 border-2 border-primary/20 cursor-pointer">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6 max-w-7xl mx-auto w-full">
            <Outlet />
          </main>
        </div>

        {user?.role === 'patient' && <AIAssistant />}
      </div>
    </SidebarProvider>
  )
}
