import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Users,
  Building2,
  Stethoscope,
  ActivitySquare,
  Shield,
  ArrowRight,
  ShieldCheck,
  ClipboardList,
  FileText,
  Store,
  HeartPulse,
  BadgeAlert,
  Bot,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'

export default function AdminDashboard() {
  const { user } = useAuth()
  const isMasterAdmin =
    user?.role === 'medical_director' &&
    (user?.email === 'valterpmendonca@gmail.com' ||
      user?.name?.toLowerCase().includes('valter') ||
      user?.name?.toLowerCase().includes('victor'))

  const [stats, setStats] = useState({
    patients: 0,
    professionals: 0,
    companies: 0,
    appointments: 0,
  })
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchStats = async () => {
      if (!isMasterAdmin) {
        setLoading(false)
        return
      }

      try {
        const [patients, professionals, companies, appointments] = await Promise.all([
          pb.collection('users').getList(1, 1, { filter: 'role="patient"' }),
          pb.collection('users').getList(1, 1, { filter: 'role="professional"' }),
          pb.collection('users').getList(1, 1, { filter: 'role="company"' }),
          pb.collection('appointments').getList(1, 1),
        ])

        setStats({
          patients: patients.totalItems,
          professionals: professionals.totalItems,
          companies: companies.totalItems,
          appointments: appointments.totalItems,
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [isMasterAdmin])

  return (
    <div className="space-y-8 animate-fade-in-up pb-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-primary/5 p-6 rounded-2xl border border-primary/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-5 pointer-events-none translate-x-1/4 -translate-y-1/4">
          <Shield className="w-64 h-64" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Shield className="h-6 w-6" />
            <span className="font-bold uppercase tracking-wider text-sm">
              HUB CENTRAL MASTER ADMIN
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Painel de Controle <span className="text-primary">VMX</span>
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-base">
            Operado por <strong>VMX do Brasil Administradora de Cartões e Benefícios Ltda</strong>.
            Controle 100% da plataforma V MED BRASIL a partir deste ponto único.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              Gestor Master: Valter Paula Mendonça
            </Badge>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              Gestor Master: Victor Hugo Tavares Mendonça
            </Badge>
            <Badge variant="outline" className="border-amber-500/30 text-amber-700 bg-amber-500/10">
              Dir. Técnico: Fauzer Andrigo Mendonça Simoes Rangel
            </Badge>
          </div>
        </div>
      </div>

      {isMasterAdmin && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Pacientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.patients}</div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profissionais (Médicos)</CardTitle>
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.professionals}</div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Empresas Parceiras</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.companies}</div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Consultas Realizadas</CardTitle>
              <ActivitySquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.appointments}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
          <ActivitySquare className="h-5 w-5 text-primary" /> Módulos de Gestão da Plataforma
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Guia Saúde & Profissionais */}
          <Card
            className="group hover:border-primary/50 transition-all cursor-pointer hover:shadow-md"
            onClick={() => navigate('/admin/supervision')}
          >
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0" />
              </div>
              <CardTitle className="text-lg">Guia Saúde & Médicos</CardTitle>
              <CardDescription className="text-sm">
                Gestão de profissionais, bloqueios por irregularidades e portal do Diretor Técnico.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Verificação de Cadastros */}
          <Card
            className="group hover:border-primary/50 transition-all cursor-pointer hover:shadow-md"
            onClick={() => navigate('/admin/verification')}
          >
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0" />
              </div>
              <CardTitle className="text-lg">Verificação CFM</CardTitle>
              <CardDescription className="text-sm">
                Aprovação e validação de documentos e registros médicos da rede credenciada.
              </CardDescription>
            </CardHeader>
          </Card>

          {isMasterAdmin && (
            <>
              {/* CRM */}
              <Card
                className="group hover:border-primary/50 transition-all cursor-pointer hover:shadow-md"
                onClick={() => navigate('/admin/users')}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-600 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                      <Users className="h-6 w-6" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0" />
                  </div>
                  <CardTitle className="text-lg">CRM & Dados</CardTitle>
                  <CardDescription className="text-sm">
                    Acesso aos registros de todos os usuários, pacientes e parceiros da plataforma.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Empresas Corporativas */}
              <Card
                className="group hover:border-primary/50 transition-all cursor-pointer hover:shadow-md border-primary/20 bg-primary/5"
                onClick={() => navigate('/company/employees')}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2.5 bg-primary/20 rounded-xl text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-primary transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0" />
                  </div>
                  <CardTitle className="text-lg text-primary">
                    Gestão Corporativa (Empresas)
                  </CardTitle>
                  <CardDescription className="text-sm text-foreground/70">
                    Acesse a visão de RH para gerenciar os benefícios, saldos e lista de
                    funcionários corporativos.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Farmácias & Laboratórios */}
              <Card
                className="group hover:border-primary/50 transition-all cursor-pointer hover:shadow-md"
                onClick={() => navigate('/admin/pharmacy')}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2.5 bg-teal-500/10 rounded-xl text-teal-600 group-hover:bg-teal-500 group-hover:text-white transition-colors">
                      <Store className="h-6 w-6" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0" />
                  </div>
                  <CardTitle className="text-lg">Farmácias & Drogarias</CardTitle>
                  <CardDescription className="text-sm">
                    Gestão de parceiros farmacêuticos, laboratórios e controle de catálogos/IA.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Especialidades */}
              <Card
                className="group hover:border-primary/50 transition-all cursor-pointer hover:shadow-md"
                onClick={() => navigate('/admin/specialties')}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                      <FileText className="h-6 w-6" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0" />
                  </div>
                  <CardTitle className="text-lg">Especialidades & IA</CardTitle>
                  <CardDescription className="text-sm">
                    Gerencie a base de dados de especialidades e vetores sintomáticos para a IA de
                    Triagem.
                  </CardDescription>
                </CardHeader>
              </Card>
            </>
          )}
        </div>
      </div>

      {isMasterAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <Card className="bg-muted/30 border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardList className="h-5 w-5" /> Logs de Auditoria
              </CardTitle>
              <CardDescription>
                Rastreabilidade de todas as ações sensíveis no sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => navigate('/admin/audit')}>
                Acessar Auditoria <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-muted/30 border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bot className="h-5 w-5" /> Hub de Agentes IA
              </CardTitle>
              <CardDescription>
                Visão geral dos agentes de inteligência artificial da plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => navigate('/admin/ai')}>
                Acessar Agentes IA <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
