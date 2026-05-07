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
import { Switch } from '@/components/ui/switch'
import { Users, Search, Plus, Edit, Download, Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from 'sonner'
import { updateUser } from '@/services/users'

export default function CompanyEmployees() {
  const { user } = useAuth()
  const [employees, setEmployees] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [allowance, setAllowance] = useState('0')
  const [medicationAllowance, setMedicationAllowance] = useState('0')
  const [type, setType] = useState('benefit')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async (isInitial = false) => {
    if (user?.id) {
      if (isInitial) setLoading(true)
      try {
        const data = await getEmployees(user.id)
        setEmployees(data)
        setError(null)
      } catch (e: any) {
        console.error(e)
        setError('Não foi possível carregar os dados dos colaboradores.')
      } finally {
        if (isInitial) setLoading(false)
      }
    }
  }

  useEffect(() => {
    loadData(true)
  }, [user?.id])

  useRealtime('users', () => {
    loadData(false)
  })

  if (user?.role !== 'company') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground text-lg">
          Acesso negado. Apenas contas corporativas podem visualizar esta página.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Carregando colaboradores...</p>
        </div>
      </div>
    )
  }

  const filteredEmployees = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleLink = async () => {
    try {
      await linkEmployee(email, parseFloat(allowance), type, parseFloat(medicationAllowance))
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
      await registerEmployee(
        user.id,
        name,
        email,
        parseFloat(allowance),
        type,
        parseFloat(medicationAllowance),
      )
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
      await updateEmployeeBenefit(
        selectedEmployee.id,
        parseFloat(allowance),
        type,
        parseFloat(medicationAllowance),
      )
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
    setMedicationAllowance((emp.medication_allowance || 0).toString())
    setType(emp.allowance_type || 'benefit')
    setIsEditOpen(true)
  }

  const resetForm = () => {
    setName('')
    setEmail('')
    setAllowance('0')
    setMedicationAllowance('0')
    setType('benefit')
  }

  const handleToggleAutoRenew = async (empId: string, currentValue: boolean) => {
    try {
      await updateUser(empId, { auto_renew_benefits: !currentValue })
      if (!currentValue) {
        toast.success('Renovação automática ativada!')
      } else {
        toast.success('Renovação automática cancelada com sucesso.')
      }
      loadData()
    } catch (e) {
      toast.error('Erro ao atualizar renovação automática.')
    }
  }

  return (
    <div className="space-y-8 pb-10 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" /> Gestão de Funcionários
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie os colaboradores vinculados à sua empresa.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const exportData = employees.map((emp) => ({
                id: emp.id,
                name: emp.name,
                email: emp.email,
                role: emp.role,
                health_allowance: emp.health_allowance || 0,
                medication_allowance: emp.medication_allowance || 0,
                allowance_type: emp.allowance_type || 'benefit',
                auto_renew: emp.auto_renew_benefits || false,
              }))
              const csv = [
                'ID,Name,Email,Role,Health Allowance,Medication Allowance,Allowance Type,Auto Renew',
                ...exportData.map(
                  (e) =>
                    `${e.id},${e.name},${e.email},${e.role},${e.health_allowance},${e.medication_allowance},${e.allowance_type},${e.auto_renew}`,
                ),
              ].join('\n')
              const blob = new Blob([csv], { type: 'text/csv' })
              const url = window.URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'employees.csv'
              a.click()
              window.URL.revokeObjectURL(url)
            }}
          >
            <Download className="mr-2 h-4 w-4" /> Exportar
          </Button>
          <Button
            onClick={() => {
              resetForm()
              setIsAddOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Adicionar
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Colaboradores ({employees.length})</CardTitle>
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
                  <TableHead>Crédito Saúde</TableHead>
                  <TableHead>Crédito Farmácia</TableHead>
                  <TableHead>Tipo de Repasse</TableHead>
                  <TableHead>Renovação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Nenhum colaborador encontrado.
                    </TableCell>
                  </TableRow>
                )}
                {filteredEmployees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-medium">{emp.name}</TableCell>
                    <TableCell>{emp.email}</TableCell>
                    <TableCell>R$ {(emp.health_allowance || 0).toFixed(2)}</TableCell>
                    <TableCell>R$ {(emp.medication_allowance || 0).toFixed(2)}</TableCell>
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
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={!!emp.auto_renew_benefits}
                          onCheckedChange={() =>
                            handleToggleAutoRenew(emp.id, !!emp.auto_renew_benefits)
                          }
                        />
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {emp.auto_renew_benefits ? 'Auto' : 'Manual'}
                        </span>
                      </div>
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
                  <Label>Crédito Saúde (R$)</Label>
                  <Input
                    type="number"
                    value={allowance}
                    onChange={(e) => setAllowance(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Crédito Farmácia (R$)</Label>
                  <Input
                    type="number"
                    value={medicationAllowance}
                    onChange={(e) => setMedicationAllowance(e.target.value)}
                  />
                </div>
                <div className="space-y-2 col-span-2">
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
                  <Label>Crédito Saúde (R$)</Label>
                  <Input
                    type="number"
                    value={allowance}
                    onChange={(e) => setAllowance(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Crédito Farmácia (R$)</Label>
                  <Input
                    type="number"
                    value={medicationAllowance}
                    onChange={(e) => setMedicationAllowance(e.target.value)}
                  />
                </div>
                <div className="space-y-2 col-span-2">
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
              <Label>Crédito Saúde (R$)</Label>
              <Input
                type="number"
                value={allowance}
                onChange={(e) => setAllowance(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Crédito Farmácia Mensal (R$)</Label>
              <Input
                type="number"
                value={medicationAllowance}
                onChange={(e) => setMedicationAllowance(e.target.value)}
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
