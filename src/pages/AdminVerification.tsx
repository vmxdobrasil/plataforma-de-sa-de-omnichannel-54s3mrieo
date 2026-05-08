import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useNavigate } from 'react-router-dom'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { getProfessionals, verifyProfessional } from '@/services/users'
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react'

export default function AdminVerification() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [professionals, setProfessionals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && user.role !== 'company') {
      navigate('/')
      return
    }
    loadProfessionals()
  }, [user, navigate])

  const loadProfessionals = async () => {
    try {
      const data = await getProfessionals()
      setProfessionals(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleVerify = async (id: string, currentStatus: boolean) => {
    try {
      await verifyProfessional(id, !currentStatus)
      setProfessionals((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_verified: !currentStatus } : p)),
      )
      toast({
        title: 'Status atualizado',
        description: `Profissional ${!currentStatus ? 'verificado' : 'desverificado'} com sucesso.`,
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível atualizar o status.',
      })
    }
  }

  if (loading) return null

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Verificação de Profissionais</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie o acesso e validação dos médicos cadastrados na plataforma.
          </p>
        </div>
        <Shield className="h-12 w-12 text-muted-foreground opacity-20" />
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader className="bg-primary/20 [&_th]:text-foreground">
            <TableRow className="hover:bg-transparent">
              <TableHead>Profissional</TableHead>
              <TableHead>CRM</TableHead>
              <TableHead>Estado (UF)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {professionals.map((prof) => (
              <TableRow key={prof.id}>
                <TableCell className="font-medium">{prof.name}</TableCell>
                <TableCell>{prof.crm_number || '-'}</TableCell>
                <TableCell>{prof.crm_state || '-'}</TableCell>
                <TableCell>
                  {prof.is_verified ? (
                    <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      Verificado
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-amber-600 bg-amber-500/10">
                      <ShieldAlert className="h-3 w-3 mr-1" />
                      Pendente
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant={prof.is_verified ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => handleToggleVerify(prof.id, prof.is_verified)}
                  >
                    {prof.is_verified ? 'Revogar' : 'Verificar'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {professionals.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum profissional encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
