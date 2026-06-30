import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
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
  Users,
  UserX,
  ReceiptText,
  Shield,
  ShieldCheck,
  Building2,
  ClipboardList,
  Pill,
  Wallet,
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
import defaultLogo from '@/assets/logo-v-med-c5c45.jpg'

const navItems = [
  { title: 'Início', icon: Home, url: '/', roles: ['patient', 'professional'] },
  {
    title: 'Dashboard VMX',
    icon: Shield,
    url: '/admin',
    roles: ['admin'],
    masterOnly: true,
  },
  {
    title: 'Supervisão Clínica',
    icon: Stethoscope,
    url: '/admin/supervision',
    roles: ['medical_director', 'admin'],
  },
  {
    title: 'Verificação CFM',
    icon: ShieldCheck,
    url: '/admin/verification',
    roles: ['medical_director', 'admin'],
  },
  {
    title: 'Especialidades Médicas',
    icon: Stethoscope,
    url: '/admin/specialties',
    roles: ['medical_director', 'admin'],
    masterOnly: true,
  },
  {
    title: 'CRM',
    icon: Users,
    url: '/admin/users',
    roles: ['medical_director', 'admin'],
    masterOnly: true,
  },
  {
    title: 'Gestão de Empresas',
    icon: Building2,
    url: '/admin/companies',
    roles: ['medical_director', 'admin'],
    masterOnly: true,
  },
  {
    title: 'Farmácias e Laboratórios',
    icon: Pill,
    url: '/admin/pharmacy',
    roles: ['medical_director', 'admin'],
    masterOnly: true,
  },
  {
    title: 'Agentes de IA',
    icon: Bot,
    url: '/admin/ai',
    roles: ['medical_director', 'admin'],
    masterOnly: true,
  },
  {
    title: 'Transações e Financeiro',
    icon: ReceiptText,
    url: '/admin/transactions',
    roles: ['medical_director', 'admin'],
    masterOnly: true,
  },
  {
    title: 'Parceiros de Seguro',
    icon: Building2,
    url: '/admin/insurance',
    roles: ['medical_director', 'admin'],
    masterOnly: true,
  },
  {
    title: 'Logs de Auditoria',
    icon: ClipboardList,
    url: '/admin/audit',
    roles: ['medical_director', 'admin'],
    masterOnly: true,
  },
  {
    title: 'Documentos Corporativos',
    icon: Folder,
    url: '/documents',
    roles: ['company', 'medical_director', 'admin'],
    masterOnly: true,
  },
  {
    title: 'Configurações do Sistema',
    icon: Sliders,
    url: '/admin/settings',
    roles: ['medical_director', 'admin'],
    masterOnly: true,
  },
  { title: 'Minha Empresa', icon: Building2, url: '/company/dashboard', roles: ['company'] },
  { title: 'Gestão de Funcionários', icon: Users, url: '/company/employees', roles: ['company'] },
  {
    title: 'Transações de Benefícios',
    icon: ReceiptText,
    url: '/company/transactions',
    roles: ['company'],
  },
  {
    title: 'Guia Saúde',
    icon: Search,
    url: '/search',
    roles: ['patient', 'company', 'professional'],
  },
  {
    title: 'Guia Saúde',
    icon: Search,
    url: '/admin/professionals',
    roles: ['medical_director', 'admin'],
  },
  { title: 'Meus Benefícios', icon: Wallet, url: '/benefits/statement', roles: ['patient'] },
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
  { title: 'MED Academy', icon: GraduationCap, url: '/dashboard/academy', roles: ['professional'] },
  { title: 'Hub de Agentes IA', icon: Bot, url: '/dashboard/agents', roles: ['professional'] },
  {
    title: 'Dashboard de Agência',
    icon: TrendingUp,
    url: '/dashboard/agency',
    roles: ['professional'],
  },
  {
    title: 'Configurações',
    icon: Settings,
    url: '/settings',
    roles: ['patient', 'professional', 'company', 'medical_director', 'admin'],
  },
]

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [linkedCompany, setLinkedCompany] = useState<any>(null)

  useEffect(() => {
    if (user?.company_id) {
      pb.collection('users')
        .getOne(user.company_id)
        .then((rec) => setLinkedCompany(rec))
        .catch(console.error)
    }
  }, [user?.company_id])

  const handleLogout = () => {
    signOut()
    navigate('/login')
  }

  const isMasterAdmin =
    (user?.role === 'medical_director' || user?.role === 'admin') &&
    (user?.email === 'valterpmendonca@gmail.com' ||
      user?.email === 'victorhugotmendonca@gmail.com' ||
      user?.name?.toLowerCase().includes('valter') ||
      user?.name?.toLowerCase().includes('victor'))

  const visibleNavItems = navItems.filter((item) => {
    if ((item as any).masterOnly && !isMasterAdmin) return false
    return item.roles.includes(user?.role || 'patient')
  })

  const avatarUrl = user?.avatar
    ? pb.files.getURL({ id: user.id, collectionId: 'users' }, user.avatar)
    : `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.name}`

  const [systemSettings, setSystemSettings] = useState<any>(null)
  const [brandKit, setBrandKit] = useState<any>(null)

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

    if (user?.role === 'professional') {
      pb.collection('brand_kits')
        .getFirstListItem(`user_id="${user.id}"`)
        .then((rec) => setBrandKit(rec))
        .catch(() => {
          /* ignore */
        })
    }
  }, [user])

  useRealtime('system_settings', (e) => {
    if (e.action === 'update' || e.action === 'create') {
      setSystemSettings(e.record)
      applyBrandColor(e.record.primary_color)
    }
  })

  useRealtime('brand_kits', (e) => {
    if (user?.role === 'professional' && e.record.user_id === user?.id) {
      if (e.action === 'update' || e.action === 'create') {
        setBrandKit(e.record)
      }
    }
  })

  const brandLogoUrl =
    user?.role === 'professional' && brandKit?.logo
      ? `${pb.files.getURL(brandKit, brandKit.logo)}?v=${brandKit.updated}`
      : user?.role === 'company' && user?.avatar
        ? `${pb.files.getURL({ id: user.id, collectionId: 'users' }, user.avatar)}?v=${user.updated}`
        : null

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background font-sans text-foreground">
        <Sidebar className="border-r border-border/50">
          <SidebarContent>
            <div className="p-8 flex border-b">
              <div className="flex flex-col gap-1 w-full">
                <Link
                  to="/"
                  className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity"
                  aria-label="V MED BRASIL Logo"
                >
                  {brandLogoUrl ? (
                    <img
                      src={brandLogoUrl}
                      alt={user?.name || 'Company Logo'}
                      className="w-full h-16 sm:h-20 object-contain object-left"
                    />
                  ) : (
                    <div className="bg-white/90 p-2 rounded-lg w-full flex items-center justify-start">
                      <img
                        src={defaultLogo}
                        alt="V MED BRASIL Logo"
                        className="w-full h-12 sm:h-16 object-contain object-left mix-blend-multiply"
                      />
                    </div>
                  )}
                </Link>{' '}
                {location.pathname.startsWith('/admin') && (
                  <div className="text-xs font-bold text-primary tracking-widest mt-1">
                    VMX ADMIN
                  </div>
                )}
                {linkedCompany && (
                  <div className="text-xs font-medium text-muted-foreground mt-2 border-t pt-2">
                    Vinculado a:{' '}
                    <span className="text-primary font-bold">{linkedCompany.name}</span>
                  </div>
                )}
                {(user?.role === 'pharmacy' || user?.role === 'laboratory') && (
                  <div className="text-xs font-medium text-muted-foreground mt-2 border-t pt-2">
                    Unidade: <span className="text-primary font-bold block">{user.name}</span>
                    {user.business_name && (
                      <span className="text-[10px] block opacity-80">{user.business_name}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu className="mt-4 gap-2 px-2">
                  {visibleNavItems.map((item) => {
                    const isActive =
                      location.pathname === item.url ||
                      (item.url !== '/' && location.pathname.startsWith(item.url))
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
          <header className="h-20 sm:h-24 border-b flex items-center justify-between px-4 sm:px-6 bg-card sticky top-0 z-30">
            <div className="flex items-center gap-2 sm:gap-4 flex-1">
              <SidebarTrigger />
              <div className="flex flex-col md:hidden">
                <Link
                  to="/"
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  aria-label="V MED BRASIL Logo"
                >
                  {brandLogoUrl ? (
                    <img
                      src={brandLogoUrl}
                      alt={user?.name || 'Company Logo'}
                      className="h-14 sm:h-16 w-auto max-w-[250px] object-contain"
                    />
                  ) : (
                    <div className="bg-white/90 p-1 rounded-lg flex items-center justify-center">
                      <img
                        src={defaultLogo}
                        alt="V MED BRASIL Logo"
                        className="h-10 sm:h-12 w-auto max-w-[200px] object-contain mix-blend-multiply"
                      />
                    </div>
                  )}
                </Link>{' '}
                {location.pathname.startsWith('/admin') && (
                  <div className="text-[10px] font-bold text-primary tracking-widest leading-none ml-1 mt-1">
                    VMX ADMIN
                  </div>
                )}
                {linkedCompany && (
                  <div className="text-[10px] font-medium text-muted-foreground mt-1 ml-1 leading-none">
                    Vinculado a: <span className="text-primary">{linkedCompany.name}</span>
                  </div>
                )}
                {(user?.role === 'pharmacy' || user?.role === 'laboratory') && (
                  <div className="text-[10px] font-medium text-muted-foreground mt-1 ml-1 leading-none">
                    Unidade: <span className="text-primary">{user.name}</span>
                    {user.business_name && (
                      <span className="block mt-0.5 opacity-80">{user.business_name}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="hidden md:flex items-center gap-4 flex-1">
                <div className="relative max-w-md w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="V MED BRASIL AI: Como posso ajudar?"
                    className="pl-10 bg-muted/50 border-none rounded-full"
                  />
                </div>
                {(user?.role === 'pharmacy' || user?.role === 'laboratory') && (
                  <div className="flex flex-col ml-4 pl-4 border-l border-border/50">
                    <span className="text-[10px] uppercase font-bold text-primary tracking-wider">
                      Unidade Operacional
                    </span>
                    <span className="text-sm font-semibold truncate max-w-[200px]">
                      {user.business_name || user.name}
                    </span>
                  </div>
                )}
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
              {user && <NotificationsPopover />}
              {user && user.role === 'patient' && (
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
              {user && (
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
              )}
              {user ? (
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
                        {linkedCompany && (
                          <p className="text-xs font-medium text-primary mt-1">
                            Vinculado a: {linkedCompany.name}
                          </p>
                        )}
                        {(user?.role === 'pharmacy' || user?.role === 'laboratory') && (
                          <div className="mt-1">
                            <p className="text-xs font-medium text-primary">Unidade: {user.name}</p>
                            {user.business_name && (
                              <p className="text-[10px] text-muted-foreground leading-tight">
                                {user.business_name}
                              </p>
                            )}
                          </div>
                        )}
                        {user?.role === 'admin' ? (
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary w-fit mt-1">
                            Administrador Master
                          </span>
                        ) : (
                          user?.role === 'medical_director' && (
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary w-fit mt-1">
                              Administrador da Plataforma
                            </span>
                          )
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-red-600 cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" /> Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={() => navigate('/login')} className="rounded-full px-6">
                  Entrar
                </Button>
              )}{' '}
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
