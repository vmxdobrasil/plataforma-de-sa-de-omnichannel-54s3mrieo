import { Link, Outlet, useLocation } from 'react-router-dom'
import { Bell, HeartPulse, Home, Search, Stethoscope, Activity, User, Menu } from 'lucide-react'
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
import { AIAssistant } from './AIAssistant'

const navItems = [
  { title: 'Início', icon: Home, url: '/' },
  { title: 'Buscar Especialistas', icon: Search, url: '/search' },
  { title: 'Meu Perfil de Saúde', icon: HeartPulse, url: '/health-profile' },
  { title: 'Painel do Profissional', icon: Stethoscope, url: '/professional' },
]

export default function Layout() {
  const location = useLocation()

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background font-sans text-foreground">
        <Sidebar className="border-r border-border/50">
          <SidebarContent>
            <div className="p-6 flex items-center gap-3 border-b">
              <div className="bg-primary/10 p-2 rounded-xl text-primary">
                <Activity className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-bold text-xl tracking-tight text-primary">
                Vitalis
              </h1>
            </div>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu className="mt-4 gap-2 px-2">
                  {navItems.map((item) => {
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
          <header className="h-16 border-b flex items-center justify-between px-6 bg-card sticky top-0 z-30">
            <div className="flex items-center gap-4 flex-1">
              <SidebarTrigger />
              <div className="relative max-w-md w-full hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pergunte à IA: Como posso ajudar?"
                  className="pl-10 bg-muted/50 border-none rounded-full"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive rounded-full"
              >
                SOS Emergência
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="relative text-muted-foreground hover:text-primary"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 h-2 w-2 bg-amber-400 rounded-full animate-pulse"></span>
              </Button>
              <Avatar className="h-9 w-9 border-2 border-primary/20 cursor-pointer">
                <AvatarImage src="https://img.usecurling.com/ppl/thumbnail?gender=female&seed=1" />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6 max-w-7xl mx-auto w-full">
            <Outlet />
          </main>
        </div>

        <AIAssistant />
      </div>
    </SidebarProvider>
  )
}
