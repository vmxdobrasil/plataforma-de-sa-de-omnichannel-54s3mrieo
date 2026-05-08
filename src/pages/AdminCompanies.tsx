import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Plus, Edit, Trash, Users, Search } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { CreateCompanyForm } from '@/components/admin/forms/CreateCompanyForm'
import { EditCompanyForm } from '@/components/admin/forms/EditCompanyForm'

export default function AdminCompanies() {
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<any>(null)
  const [employeeCounts, setEmployeeCounts] = useState<Record<string, number>>({})

  const fetchCompanies = async () => {
    try {
      setLoading(true)
      const records = await pb.collection('users').getFullList({
        filter: 'role = "company"',
        sort: '-created',
      })
      setCompanies(records)

      // Fetch employee counts for each company
      const employeeRecords = await pb.collection('users').getFullList({
        filter: 'role = "patient" && company_id != ""',
        fields: 'id,company_id',
      })

      const counts: Record<string, number> = {}
      employeeRecords.forEach((emp) => {
        if (emp.company_id) {
          counts[emp.company_id] = (counts[emp.company_id] || 0) + 1
        }
      })
      setEmployeeCounts(counts)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar empresas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCompanies()
  }, [])

  const filteredCompanies = companies.filter(
    (c) =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.tax_id?.includes(searchTerm) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        'Tem certeza que deseja excluir esta empresa? Todos os funcionários vinculados ficarão sem empresa.',
      )
    ) {
      return
    }
    try {
      await pb.collection('users').delete(id)
      toast.success('Empresa excluída com sucesso.')
      fetchCompanies()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao excluir empresa.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Empresas</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie empresas parceiras, subsídios e configurações de benefícios.
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Empresa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Cadastrar Nova Empresa</DialogTitle>
            </DialogHeader>
            <CreateCompanyForm
              onSuccess={() => {
                setIsCreateOpen(false)
                fetchCompanies()
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, CNPJ ou e-mail..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Funcionários</TableHead>
              <TableHead>Subsídio Saúde</TableHead>
              <TableHead>Subsídio Med.</TableHead>
              <TableHead>Renovação Auto.</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground mt-2 animate-pulse">
                    Carregando empresas...
                  </p>
                </TableCell>
              </TableRow>
            ) : filteredCompanies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Nenhuma empresa encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredCompanies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">{company.name || '-'}</TableCell>
                  <TableCell>{company.tax_id || '-'}</TableCell>
                  <TableCell>{company.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {employeeCounts[company.id] || 0}
                    </div>
                  </TableCell>
                  <TableCell>
                    {company.health_allowance ? `R$ ${company.health_allowance.toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell>
                    {company.medication_allowance
                      ? `R$ ${company.medication_allowance.toFixed(2)}`
                      : '-'}
                  </TableCell>
                  <TableCell>{company.auto_renew_benefits ? 'Sim' : 'Não'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingCompany(company)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(company.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingCompany} onOpenChange={(open) => !open && setEditingCompany(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
          </DialogHeader>
          {editingCompany && (
            <EditCompanyForm
              company={editingCompany}
              onSuccess={() => {
                setEditingCompany(null)
                fetchCompanies()
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
