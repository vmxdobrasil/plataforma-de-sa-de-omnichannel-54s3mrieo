import { useEffect, useState, useCallback } from 'react'
import { Users, Download, Search, Trash2, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { useRealtime } from '@/hooks/use-realtime'
import {
  getLeads,
  updateLeadStatus,
  deleteLead,
  exportLeadsToCSV,
  type RegistrationLead,
} from '@/services/registration-leads'
import { toast } from 'sonner'

const statusConfig: Record<
  string,
  { label: string; variant: 'secondary' | 'default' | 'destructive' | 'outline' }
> = {
  pending: { label: 'Pendente', variant: 'secondary' },
  contacted: { label: 'Contatado', variant: 'default' },
  converted: { label: 'Convertido', variant: 'default' },
  rejected: { label: 'Rejeitado', variant: 'destructive' },
}

const typeLabels: Record<string, string> = {
  company: 'Empresa',
  partner: 'Parceiro',
  individual: 'Individual',
}

export default function AdminLeads() {
  const [leads, setLeads] = useState<RegistrationLead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const loadLeads = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getLeads()
      setLeads(data as RegistrationLead[])
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar leads.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadLeads()
  }, [loadLeads])

  useRealtime('registration_leads', () => {
    loadLeads()
  })

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.tax_id?.includes(searchTerm)
    const matchesType = filterType === 'all' || lead.type === filterType
    const matchesStatus = filterStatus === 'all' || lead.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateLeadStatus(id, status as any)
      toast.success('Status atualizado.')
      loadLeads()
    } catch (err) {
      toast.error('Erro ao atualizar status.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este lead?')) return
    try {
      await deleteLead(id)
      toast.success('Lead excluído.')
      loadLeads()
    } catch (err) {
      toast.error('Erro ao excluir lead.')
    }
  }

  const handleExport = () => {
    const csv = exportLeadsToCSV(filteredLeads)
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `leads_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Dados exportados com sucesso.')
  }

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      <AdminHeader
        title="Gestão de Leads de Cadastro"
        description="Gerencie leads das inscrições de Empresas, Parceiros e Individuais."
        icon={<Users className="h-8 w-8" />}
        rightContent={
          <Button onClick={handleExport} className="w-full lg:w-auto">
            <Download className="mr-2 h-4 w-4" /> Exportar Dados
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="Buscar por nome, e-mail ou CPF/CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="company">Empresas</SelectItem>
            <SelectItem value="partner">Parceiros</SelectItem>
            <SelectItem value="individual">Individuais</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="contacted">Contatado</SelectItem>
            <SelectItem value="converted">Convertido</SelectItem>
            <SelectItem value="rejected">Rejeitado</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={loadLeads} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Leads ({filteredLeads.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>CPF/CNPJ</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Funcionários</TableHead>
                  <TableHead>Benefício</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      Carregando leads...
                    </TableCell>
                  </TableRow>
                ) : filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      Nenhum lead encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell className="text-muted-foreground">{lead.email}</TableCell>
                      <TableCell className="text-muted-foreground">{lead.phone || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">{lead.tax_id || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{typeLabels[lead.type] || lead.type}</Badge>
                      </TableCell>
                      <TableCell>{lead.employee_count || '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {lead.benefit_intention || '-'}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={lead.status}
                          onValueChange={(v) => handleStatusChange(lead.id, v)}
                        >
                          <SelectTrigger className="h-8 w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="contacted">Contatado</SelectItem>
                            <SelectItem value="converted">Convertido</SelectItem>
                            <SelectItem value="rejected">Rejeitado</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(lead.created).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(lead.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
