import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Users,
  Building2,
  Stethoscope,
  FileText,
  ActivitySquare,
  Shield,
  ArrowRight,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function AdminDashboard() {
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
  }, [])

  return (
    <div className="space-y-8 animate-fade-in-up pb-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Shield className="h-5 w-5" />
            <span className="font-semibold uppercase tracking-wider text-sm">
              V MED BRASIL ADMIN
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Painel de Administração</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Bem-vindo ao centro de comando operado por{' '}
            <strong>Vmx do Brasil Administradora de Cartoes e Beneficios Ltda</strong>.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 hover:border-primary/20 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pacientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.patients}</div>
            <p className="text-xs text-muted-foreground mt-1">Usuários diretos e corporativos</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:border-primary/20 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profissionais (Médicos)</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.professionals}</div>
            <p className="text-xs text-muted-foreground mt-1">Especialistas cadastrados</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:border-primary/20 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas Parceiras</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.companies}</div>
            <p className="text-xs text-muted-foreground mt-1">Clientes corporativos</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:border-primary/20 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consultas Realizadas</CardTitle>
            <ActivitySquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.appointments}</div>
            <p className="text-xs text-muted-foreground mt-1">Atendimentos na plataforma</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Comando do Diretor Médico</CardTitle>
            <CardDescription>Ações de fiscalização e suporte técnico-médico.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Responsável Técnico: <strong>Fauzer Andrigo Mendonça Simoes Rangel</strong>
            </p>
            <Button
              className="w-full justify-between"
              variant="outline"
              onClick={() => navigate('/admin/supervision')}
            >
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" /> Fiscalização de Profissionais
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              className="w-full justify-between"
              variant="outline"
              onClick={() => navigate('/admin/specialties')}
            >
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Gerir Especialidades e CFM
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acesso Corporativo</CardTitle>
            <CardDescription>Acesse a visão de RH das empresas parceiras.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Como administrador, você pode visualizar e gerenciar o painel de funcionários de
              qualquer empresa cadastrada na plataforma.
            </p>
            <Button
              className="w-full justify-between"
              onClick={() => navigate('/company/employees')}
            >
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" /> Acessar Gestão de Funcionários
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
