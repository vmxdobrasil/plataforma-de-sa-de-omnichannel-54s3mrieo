import { useEffect, useState } from 'react'
import {
  getEmployees,
  linkEmployee,
  registerEmployee,
  updateEmployeeBenefit,
} from '@/services/companies'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, Users, DollarSign, Search, Plus, Edit } from 'lucide-react'
import { toast } from 'sonner'

export default function CompanyDashboard() {
  const { user } = useAuth()
  const [employees, setEmployees] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [allowance, setAllowance] = useState('0')
  const [type, setType] = useState('benefit')

  const loadData = async () => {
    if (user?.id) {
      try {
        const data = await getEmployees(user.id)
        setEmployees(data)
      } catch (e) {
        console.error(e)
      }
    }
  }

  useEffect(() => {
    loadData()
  }, [user?.id])

  useRealtime('users', () => {
    loadData()
  })

  useRealtime('benefit_transactions', () => {
    loadData()
  })

  const totalBudget = employees.reduce((acc, emp) => acc + (emp.health_allowance || 0), 0)

  const filteredEmployees = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleLink = async () => {
    try {
      await linkEmployee(email, parseFloat(allowance), type)
      toast.success('Funcionário vinculado com sucesso!')
      setIsAddOpen(false)
      resetForm()
      loadData()
    } catch (e: any) {
      toast.error(e?.data?.message || 'Erro ao vincular funcionário. Verifique o email.')
    }
  }

  const handleRegister = async () => {
    try {
      await registerEmployee(user.id, name, email, parseFloat(allowance), type)
      toast.success('Funcionário cadastrado com sucesso!')
      setIsAddOpen(false)
      resetForm()
      loadData()
    } catch (e: any) {
      toast.error(e?.data?.message || 'Erro ao cadastrar funcionário.')
    }
  }

  const handleUpdate = async () => {
    if (!selectedEmployee) return
    try {
      await updateEmployeeBenefit(selectedEmployee.id, parseFloat(allowance), type)
      toast.success('Benefício atualizado com sucesso!')
      setIsEditOpen(false)
      setSelectedEmployee(null)
      loadData()
    } catch (e) {
      toast.error('Erro ao atualizar benefício.')
    }
  }

  const openEdit = (emp: any) => {
    setSelectedEmployee(emp)
    setAllowance((emp.health_allowance || 0).toString())
    setType(emp.allowance_type || 'benefit')
    setIsEditOpen(true)
  }

  const resetForm = () => {
    setName('')
    setEmail('')
    setAllowance('0')
    setType('benefit')
  }

  return (
    <div className="space-y-8 pb-10 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" /> Painel Corporativo
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie os benefícios de saúde dos seus colaboradores.
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setIsAddOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Adicionar Colaborador
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Colaboradores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div className="text-3xl font-bold">{employees.length}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Orçamento Total Distribuído
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="bg-emerald-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="text-3xl font-bold text-emerald-700">R$ {totalBudget.toFixed(2)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Colaboradores</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Saldo Atual</TableHead>
                  <TableHead>Tipo de Repasse</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhum colaborador encontrado.
                    </TableCell>
                  </TableRow>
                )}
                {filteredEmployees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-medium">{emp.name}</TableCell>
                    <TableCell>{emp.email}</TableCell>
                    <TableCell>R$ {(emp.health_allowance || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          emp.allowance_type === 'benefit'
                            ? 'bg-purple-100 text-purple-800 border-purple-200'
                            : 'bg-blue-100 text-blue-800 border-blue-200'
                        }
                      >
                        {emp.allowance_type === 'benefit'
                          ? 'Benefício Direto'
                          : 'Desconto em Folha'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(emp)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adicionar Colaborador</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="link" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="link">Vincular Existente</TabsTrigger>
              <TabsTrigger value="new">Novo Cadastro</TabsTrigger>
            </TabsList>

            <TabsContent value="link" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Email do Colaborador</Label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor do Benefício (R$)</Label>
                  <Input
                    type="number"
                    value={allowance}
                    onChange={(e) => setAllowance(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="benefit">Benefício Direto</SelectItem>
                      <SelectItem value="payroll_deduction">Desconto em Folha</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full mt-4" onClick={handleLink}>
                Vincular Conta
              </Button>
            </TabsContent>

            <TabsContent value="new" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="João Silva"
                />
              </div>
              <div className="space-y-2">
                <Label>Email Corporativo</Label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="joao@empresa.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor Inicial (R$)</Label>
                  <Input
                    type="number"
                    value={allowance}
                    onChange={(e) => setAllowance(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="benefit">Benefício Direto</SelectItem>
                      <SelectItem value="payroll_deduction">Desconto em Folha</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full mt-4" onClick={handleRegister}>
                Cadastrar Colaborador
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Benefício: {selectedEmployee?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Saldo Disponível (R$)</Label>
              <Input
                type="number"
                value={allowance}
                onChange={(e) => setAllowance(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Repasse</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="benefit">Benefício Direto</SelectItem>
                  <SelectItem value="payroll_deduction">Desconto em Folha</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full mt-4" onClick={handleUpdate}>
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
