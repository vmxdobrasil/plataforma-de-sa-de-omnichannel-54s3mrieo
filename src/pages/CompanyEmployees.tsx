import { useEffect, useState } from 'react'
import {
  getEmployees,
  linkEmployee,
  registerEmployee,
  updateEmployeeBenefit,
} from '@/services/companies'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { useSearchParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import pb from '@/lib/pocketbase/client'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Users,
  Search,
  Plus,
  Edit,
  Download,
  Loader2,
  AlertCircle,
  Ban,
  CheckCircle,
  Upload,
  ArrowLeft,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from 'sonner'
import { updateUser } from '@/services/users'

export default function CompanyEmployees() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const targetCompanyId =
    user?.role === 'medical_director' ? searchParams.get('companyId') : user?.id

  const [employees, setEmployees] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])

  useEffect(() => {
    if (user?.role === 'medical_director') {
      pb.collection('users')
        .getFullList({ filter: 'role="company"', sort: 'name' })
        .then(setCompanies)
    }
  }, [user?.role])
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [documentId, setDocumentId] = useState('')
  const [allowance, setAllowance] = useState('0')
  const [medicationAllowance, setMedicationAllowance] = useState('0')
  const [type, setType] = useState('benefit')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [bulkFile, setBulkFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const loadData = async (isInitial = false) => {
    if (targetCompanyId) {
      if (isInitial) setLoading(true)
      try {
        const data = await getEmployees(targetCompanyId)
        setEmployees(data)
        setError(null)
      } catch (e: any) {
        console.error(e)
        setError('Não foi possível carregar os dados dos colaboradores.')
      } finally {
        if (isInitial) setLoading(false)
      }
    } else {
      setEmployees([])
    }
  }

  useEffect(() => {
    loadData(true)
  }, [targetCompanyId])

  useRealtime('users', () => {
    loadData(false)
  })

  if (user?.role !== 'company' && user?.role !== 'medical_director') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground text-lg">
          Acesso negado. Apenas contas corporativas ou administradores podem visualizar esta página.
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
    if (!name || !email || !documentId) {
      toast.error('Preencha os campos obrigatórios (Nome, Email, CPF/Documento).')
      return
    }
    try {
      await registerEmployee(
        targetCompanyId!,
        name,
        email,
        documentId,
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
    setDocumentId('')
    setAllowance('0')
    setMedicationAllowance('0')
    setType('benefit')
    setBulkFile(null)
  }

  const handleToggleBlock = async (empId: string, isBlocked: boolean) => {
    try {
      await updateUser(empId, { is_blocked: !isBlocked })
      toast.success(!isBlocked ? 'Funcionário bloqueado (suspenso).' : 'Funcionário desbloqueado.')
      loadData()
    } catch (e) {
      toast.error('Erro ao alterar status do funcionário.')
    }
  }

  const handleBulkImport = async () => {
    if (!bulkFile) {
      toast.error('Selecione um arquivo CSV para importar.')
      return
    }
    setIsUploading(true)
    try {
      const text = await bulkFile.text()
      const rows = text
        .split('\n')
        .map((r) => r.trim())
        .filter((r) => r)

      let successCount = 0
      let errorCount = 0

      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split(',')
        const rowName = cols[0]?.trim()
        const rowEmail = cols[1]?.trim()
        const rowDoc = cols[2]?.trim()
        const health = parseFloat(cols[3] || '0')
        const med = parseFloat(cols[4] || '0')

        if (!rowName || !rowEmail || !rowDoc) {
          errorCount++
          continue
        }

        try {
          await registerEmployee(
            targetCompanyId!,
            rowName,
            rowEmail,
            rowDoc,
            health,
            'benefit',
            med,
          )
          successCount++
        } catch (e) {
          errorCount++
        }
      }

      toast.success(`Importação concluída: ${successCount} sucesso(s), ${errorCount} erro(s).`)
      setIsAddOpen(false)
      resetForm()
      loadData()
    } catch (e) {
      toast.error('Erro ao processar o arquivo CSV.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-8 pb-10 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          {user?.role === 'medical_director' && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="mb-4 bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary transition-all"
            >
              <Link to="/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para o Hub Central (Admin)
              </Link>
            </Button>
          )}
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" /> Gestão de Funcionários
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie os colaboradores vinculados à empresa.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {user?.role === 'medical_director' && (
            <Select
              value={targetCompanyId || ''}
              onValueChange={(val) => {
                setSearchParams({ companyId: val })
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecione a Empresa" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name || c.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            variant="outline"
            onClick={() => {
              const exportData = employees.map((emp) => ({
                id: emp.id,
                name: emp.name,
                email: emp.email,
                document_id: emp.document_id,
                role: emp.role,
                health_allowance: emp.health_allowance || 0,
                medication_allowance: emp.medication_allowance || 0,
                allowance_type: emp.allowance_type || 'benefit',
                auto_renew: emp.auto_renew_benefits || false,
                is_blocked: emp.is_blocked || false,
              }))
              const csv = [
                'ID,Name,Email,Document ID,Role,Health Allowance,Medication Allowance,Allowance Type,Auto Renew,Blocked',
                ...exportData.map(
                  (e) =>
                    `${e.id},${e.name},${e.email},${e.document_id},${e.role},${e.health_allowance},${e.medication_allowance},${e.allowance_type},${e.auto_renew},${e.is_blocked}`,
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
                  <TableHead>Email / Doc</TableHead>
                  <TableHead>Saúde</TableHead>
                  <TableHead>Farmácia</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhum colaborador encontrado.
                    </TableCell>
                  </TableRow>
                )}
                {filteredEmployees.map((emp) => (
                  <TableRow key={emp.id} className={emp.is_blocked ? 'opacity-60' : ''}>
                    <TableCell className="font-medium">{emp.name}</TableCell>
                    <TableCell>
                      <div className="text-sm">{emp.email}</div>
                      <div className="text-xs text-muted-foreground">
                        {emp.document_id || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>R$ {(emp.health_allowance || 0).toFixed(2)}</TableCell>
                    <TableCell>R$ {(emp.medication_allowance || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={emp.is_blocked ? 'destructive' : 'secondary'}
                        className={
                          !emp.is_blocked && emp.allowance_type === 'benefit'
                            ? 'bg-purple-100 text-purple-800 border-purple-200'
                            : !emp.is_blocked && emp.allowance_type === 'payroll_deduction'
                              ? 'bg-blue-100 text-blue-800 border-blue-200'
                              : ''
                        }
                      >
                        {emp.is_blocked
                          ? 'Bloqueado'
                          : emp.allowance_type === 'benefit'
                            ? 'Benefício'
                            : 'Desconto'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(emp)}
                          disabled={emp.is_blocked}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleBlock(emp.id, emp.is_blocked)}
                          title={emp.is_blocked ? 'Desbloquear' : 'Bloquear Acesso'}
                          className={emp.is_blocked ? 'text-emerald-600' : 'text-red-600'}
                        >
                          {emp.is_blocked ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <Ban className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Colaborador</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="new" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="new">Individual</TabsTrigger>
              <TabsTrigger value="bulk">Em Massa</TabsTrigger>
              <TabsTrigger value="link">Vincular</TabsTrigger>
            </TabsList>

            <TabsContent value="new" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Nome Completo *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="João Silva"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="joao@empresa.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CPF / Documento *</Label>
                  <Input
                    value={documentId}
                    onChange={(e) => setDocumentId(e.target.value)}
                    placeholder="000.000.000-00"
                  />
                </div>
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

            <TabsContent value="bulk" className="space-y-4 mt-4">
              <DialogDescription>
                Importe uma lista de colaboradores via arquivo CSV. O arquivo deve conter as
                colunas: <strong>Nome, Email, CPF, Credito_Saude, Credito_Farmacia</strong>.
              </DialogDescription>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="csv">Arquivo CSV</Label>
                <Input
                  id="csv"
                  type="file"
                  accept=".csv"
                  onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                />
              </div>
              <Button
                className="w-full mt-4"
                onClick={handleBulkImport}
                disabled={isUploading || !bulkFile}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Importar Lista
              </Button>
            </TabsContent>

            <TabsContent value="link" className="space-y-4 mt-4">
              <DialogDescription>
                Vincule uma conta existente de paciente à sua empresa.
              </DialogDescription>
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
