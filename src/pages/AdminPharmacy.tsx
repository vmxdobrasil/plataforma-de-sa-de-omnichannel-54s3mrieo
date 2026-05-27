import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import {
  Search,
  Pill,
  Trash2,
  Edit,
  Plus,
  Store,
  MoreVertical,
  DollarSign,
  Percent,
  Check,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { CreatePharmacyLabForm } from '@/components/admin/forms/CreatePharmacyLabForm'
import { PharmacyDocuments } from '@/components/admin/PharmacyDocuments'
import { PharmacyFinancialHistory } from '@/components/admin/PharmacyFinancialHistory'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useRealtime } from '@/hooks/use-realtime'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { useAuth } from '@/hooks/use-auth'

export default function AdminPharmacy() {
  const { user } = useAuth()
  const isMasterAdmin = user?.role === 'admin'
  const canApprove = user?.role === 'admin' || user?.role === 'medical_director'

  const [products, setProducts] = useState<any[]>([])
  const [partners, setPartners] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  const [searchPartner, setSearchPartner] = useState('')
  const [searchCity, setSearchCity] = useState('')
  const [searchNeighborhood, setSearchNeighborhood] = useState('')
  const [searchRole, setSearchRole] = useState('all')
  const [searchStatus, setSearchStatus] = useState('all')

  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loadingPartners, setLoadingPartners] = useState(true)
  const [isPartnerDialogOpen, setIsPartnerDialogOpen] = useState(false)
  const [selectedPartner, setSelectedPartner] = useState<any>(null)

  const [commissionDialogOpen, setCommissionDialogOpen] = useState(false)
  const [commissionPartner, setCommissionPartner] = useState<any>(null)
  const [commissionRate, setCommissionRate] = useState<string>('')

  const [financialDialogOpen, setFinancialDialogOpen] = useState(false)
  const [financialPartner, setFinancialPartner] = useState<any>(null)

  const loadProducts = async () => {
    try {
      setLoadingProducts(true)
      const safeTerm = searchTerm.replace(/["\\]/g, '')
      const filter = safeTerm ? `name ~ "${safeTerm}" || description ~ "${safeTerm}"` : ''
      const res = await pb.collection('pharmacy_products').getList(1, 50, {
        filter,
        sort: '-created',
        expand: 'pharmacy_id',
      })
      setProducts(res.items)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar produtos de farmácia.')
    } finally {
      setLoadingProducts(false)
    }
  }

  const loadPartners = async () => {
    try {
      setLoadingPartners(true)
      let filter =
        searchRole === 'all'
          ? `(role = "pharmacy" || role = "laboratory")`
          : `role = "${searchRole}"`

      const safePartner = searchPartner.replace(/["\\]/g, '')
      const safeCity = searchCity.replace(/["\\]/g, '')
      const safeNeigh = searchNeighborhood.replace(/["\\]/g, '')

      if (safePartner) {
        filter += ` && (name ~ "${safePartner}" || business_name ~ "${safePartner}" || tax_id ~ "${safePartner}")`
      }
      if (safeCity) {
        filter += ` && city ~ "${safeCity}"`
      }
      if (safeNeigh) {
        filter += ` && address_neighborhood ~ "${safeNeigh}"`
      }
      if (searchStatus !== 'all') {
        if (searchStatus === 'pending') {
          filter += ` && (registration_status = "pending" || registration_status = "" || registration_status = null)`
        } else {
          filter += ` && registration_status = "${searchStatus}"`
        }
      }

      const res = await pb.collection('users').getList(1, 50, {
        filter,
        sort: '-created',
      })
      setPartners(res.items)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar parceiros.')
    } finally {
      setLoadingPartners(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [searchTerm])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadPartners()
    }, 300)
    return () => clearTimeout(delayDebounceFn)
  }, [searchPartner, searchCity, searchNeighborhood, searchRole, searchStatus])

  useRealtime('users', () => loadPartners())
  useRealtime('pharmacy_products', () => loadProducts())

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Deseja excluir este produto?')) return
    try {
      await pb.collection('pharmacy_products').delete(id)
      toast.success('Produto excluído com sucesso.')
    } catch (error) {
      console.error(error)
      toast.error('Erro ao excluir produto.')
    }
  }

  const handleDeletePartner = async (id: string) => {
    if (!confirm('Deseja excluir este parceiro? A ação não pode ser desfeita.')) return
    try {
      await pb.collection('users').delete(id)
      toast.success('Parceiro excluído com sucesso.')
    } catch (error) {
      console.error(error)
      toast.error('Erro ao excluir parceiro.')
    }
  }

  const openEditPartner = (partner: any) => {
    setSelectedPartner(partner)
    setIsPartnerDialogOpen(true)
  }

  const openEditCommission = (partner: any) => {
    setCommissionPartner(partner)
    setCommissionRate(partner.commission_rate?.toString() || '')
    setCommissionDialogOpen(true)
  }

  const handleSaveCommission = async () => {
    const rate = parseFloat(commissionRate)
    if (isNaN(rate) || rate < 7.99 || rate > 13.89) {
      toast.error('A taxa de comissão deve estar entre 7,99% e 13,89%')
      return
    }

    try {
      if (isMasterAdmin) {
        await pb.collection('users').update(commissionPartner.id, {
          commission_rate: rate,
          pending_commission_rate: null,
        })
        await pb.collection('audit_logs').create({
          user_id: user?.id,
          action: 'update',
          resource_type: 'users',
          resource_id: commissionPartner.id,
          details: {
            field: 'commission_rate',
            old_value: commissionPartner.commission_rate,
            new_value: rate,
          },
        })
        toast.success('Comissão atualizada com sucesso!')
      } else {
        await pb.collection('users').update(commissionPartner.id, {
          pending_commission_rate: rate,
        })
        toast.success('Solicitação enviada para aprovação do Master Admin.')
      }
      setCommissionDialogOpen(false)
      loadPartners()
    } catch (e: any) {
      toast.error(
        e?.response?.data?.commission_rate?.message ||
          e?.response?.data?.pending_commission_rate?.message ||
          'Erro ao salvar comissão.',
      )
    }
  }

  const handleApproveCommission = async (partner: any) => {
    try {
      await pb.collection('users').update(partner.id, {
        commission_rate: partner.pending_commission_rate,
        pending_commission_rate: null,
      })
      await pb.collection('audit_logs').create({
        user_id: user?.id,
        action: 'update',
        resource_type: 'users',
        resource_id: partner.id,
        details: {
          field: 'commission_rate',
          old_value: partner.commission_rate,
          new_value: partner.pending_commission_rate,
          approved_by: user?.id,
        },
      })
      toast.success('Comissão aprovada com sucesso!')
      loadPartners()
    } catch (e) {
      toast.error('Erro ao aprovar comissão.')
    }
  }

  const handleApprovePartner = async (partner: any, status: 'approved' | 'rejected') => {
    try {
      await pb.collection('users').update(partner.id, {
        registration_status: status,
      })
      await pb.collection('audit_logs').create({
        user_id: user?.id,
        action: 'update',
        resource_type: 'users',
        resource_id: partner.id,
        details: {
          field: 'registration_status',
          old_value: partner.registration_status,
          new_value: status,
          approved_by: user?.id,
        },
      })
      toast.success(`Parceiro ${status === 'approved' ? 'aprovado' : 'rejeitado'} com sucesso!`)
      loadPartners()
    } catch (e) {
      toast.error('Erro ao atualizar status do parceiro.')
    }
  }

  const handlePartnerSuccess = () => {
    setIsPartnerDialogOpen(false)
    setTimeout(() => setSelectedPartner(null), 300)
  }

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Farmácias e Laboratórios"
        description="Painel de gestão para farmácias, drogarias e laboratórios parceiros."
        icon={<Pill className="h-8 w-8" />}
      />

      <Tabs defaultValue="partners" className="w-full">
        <TabsList className="mb-4 bg-muted/50 p-1">
          <TabsTrigger value="partners" className="rounded-md">
            Parceiros
          </TabsTrigger>
          <TabsTrigger value="products" className="rounded-md">
            Produtos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="partners" className="space-y-4">
          <div className="flex flex-col gap-4 bg-primary/5 p-4 rounded-xl border border-primary/10 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-center w-full">
              <div className="relative w-full sm:col-span-2 md:col-span-3 lg:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nome fantasia, razão social ou CNPJ..."
                  className="pl-9 bg-background"
                  value={searchPartner}
                  onChange={(e) => setSearchPartner(e.target.value)}
                />
              </div>
              <div className="relative w-full">
                <Select value={searchRole} onValueChange={setSearchRole}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Tipos</SelectItem>
                    <SelectItem value="pharmacy">Farmácia</SelectItem>
                    <SelectItem value="laboratory">Laboratório</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="relative w-full">
                <Select value={searchStatus} onValueChange={setSearchStatus}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Status</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="approved">Aprovado</SelectItem>
                    <SelectItem value="rejected">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="relative w-full">
                <Input
                  placeholder="Cidade..."
                  className="bg-background"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                />
              </div>
              <div className="w-full flex items-center justify-end">
                <Dialog
                  open={isPartnerDialogOpen}
                  onOpenChange={(open) => {
                    setIsPartnerDialogOpen(open)
                    if (!open) {
                      setTimeout(() => setSelectedPartner(null), 300)
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button className="w-full shrink-0">
                      <Plus className="h-4 w-4 mr-2" /> Novo Parceiro
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>
                        {selectedPartner ? 'Editar Parceiro' : 'Cadastrar Novo Parceiro'}
                      </DialogTitle>
                    </DialogHeader>

                    {selectedPartner ? (
                      <Tabs defaultValue="info" className="w-full mt-2">
                        <TabsList className="mb-4 w-full grid grid-cols-2">
                          <TabsTrigger value="info">Informações</TabsTrigger>
                          <TabsTrigger value="documents">Documentos</TabsTrigger>
                        </TabsList>
                        <TabsContent value="info">
                          <CreatePharmacyLabForm
                            partner={selectedPartner}
                            onSuccess={handlePartnerSuccess}
                            onConflict={(existing) => {
                              setIsPartnerDialogOpen(false)
                              setTimeout(() => {
                                setSelectedPartner(existing)
                                setIsPartnerDialogOpen(true)
                              }, 300)
                            }}
                          />
                        </TabsContent>
                        <TabsContent value="documents">
                          <PharmacyDocuments partner={selectedPartner} />
                        </TabsContent>
                      </Tabs>
                    ) : (
                      <CreatePharmacyLabForm
                        onSuccess={handlePartnerSuccess}
                        onConflict={(existing) => {
                          setIsPartnerDialogOpen(false)
                          setTimeout(() => {
                            setSelectedPartner(existing)
                            setIsPartnerDialogOpen(true)
                          }, 300)
                        }}
                      />
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[80px]">Logo</TableHead>
                  <TableHead>Identificação</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingPartners ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : partners.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum parceiro encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  partners.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Avatar className="h-10 w-10 border bg-muted">
                          <AvatarImage src={p.avatar ? pb.files.getURL(p, p.avatar) : ''} />
                          <AvatarFallback>
                            <Store className="h-4 w-4 text-muted-foreground" />
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div>
                            <span className="text-[10px] uppercase text-muted-foreground block leading-tight">
                              Nome Fantasia
                            </span>
                            <span className="font-bold text-base text-foreground leading-tight">
                              {p.business_name || '-'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase text-muted-foreground block leading-tight">
                              Razão Social
                            </span>
                            <span className="text-xs font-medium text-muted-foreground leading-tight">
                              {p.name || '-'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="outline" className="text-[10px] uppercase h-5">
                              {p.role === 'pharmacy' ? 'Farmácia' : 'Laboratório'}
                            </Badge>
                            {p.registration_status === 'approved' && (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-[10px] h-5">
                                Aprovado
                              </Badge>
                            )}
                            {(p.registration_status === 'pending' || !p.registration_status) && (
                              <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 text-[10px] h-5">
                                Pendente
                              </Badge>
                            )}
                            {p.registration_status === 'rejected' && (
                              <Badge className="bg-red-100 text-red-800 hover:bg-red-100 text-[10px] h-5">
                                Rejeitado
                              </Badge>
                            )}
                            {p.tax_id && (
                              <span className="text-[10px] text-muted-foreground">
                                CNPJ: {p.tax_id}
                              </span>
                            )}
                          </div>
                          {p.pending_commission_rate ? (
                            <div className="mt-1 flex items-center gap-2">
                              <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 text-[10px] h-5">
                                Pendente: {p.pending_commission_rate}%
                              </Badge>
                              {isMasterAdmin && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-5 text-[10px] px-2 py-0"
                                  onClick={() => handleApproveCommission(p)}
                                >
                                  Aprovar
                                </Button>
                              )}
                            </div>
                          ) : p.commission_rate ? (
                            <div className="mt-1">
                              <Badge variant="secondary" className="text-[10px] h-5">
                                Comissão: {p.commission_rate}%
                              </Badge>
                            </div>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{p.email}</div>
                        {p.phone && <div className="text-xs text-muted-foreground">{p.phone}</div>}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {p.city ? `${p.city} - ${p.state || ''}` : 'Não informada'}
                        </div>
                        {p.address_neighborhood && (
                          <div className="text-xs text-muted-foreground">
                            {p.address_neighborhood}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditPartner(p)}>
                                <Edit className="h-4 w-4 mr-2" /> Editar Perfil
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditCommission(p)}>
                                <Percent className="h-4 w-4 mr-2" /> Taxa de Comissão
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setFinancialPartner(p)
                                  setFinancialDialogOpen(true)
                                }}
                              >
                                <DollarSign className="h-4 w-4 mr-2" /> Histórico Financeiro
                              </DropdownMenuItem>
                              {canApprove && p.registration_status !== 'approved' && (
                                <DropdownMenuItem
                                  onClick={() => handleApprovePartner(p, 'approved')}
                                >
                                  <Check className="h-4 w-4 mr-2 text-green-600" /> Aprovar Cadastro
                                </DropdownMenuItem>
                              )}
                              {canApprove && p.registration_status !== 'rejected' && (
                                <DropdownMenuItem
                                  onClick={() => handleApprovePartner(p, 'rejected')}
                                >
                                  <X className="h-4 w-4 mr-2 text-red-600" /> Rejeitar Cadastro
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeletePartner(p.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <div className="flex items-center gap-4 bg-primary/5 p-4 rounded-xl border border-primary/10 shadow-sm">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto por nome..."
                className="pl-9 bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Farmácia / Parceiro</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Status Promoção</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingProducts ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum produto encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6 border">
                            <AvatarImage
                              src={
                                p.expand?.pharmacy_id?.avatar
                                  ? pb.files.getURL(
                                      p.expand.pharmacy_id,
                                      p.expand.pharmacy_id.avatar,
                                    )
                                  : ''
                              }
                            />
                            <AvatarFallback>
                              <Store className="h-3 w-3" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-sm">
                              {p.expand?.pharmacy_id?.name || 'Desconhecido'}
                            </div>
                            {p.expand?.pharmacy_id?.business_name && (
                              <div className="text-xs text-muted-foreground">
                                {p.expand.pharmacy_id.business_name}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>R$ {p.price?.toFixed(2)}</TableCell>
                      <TableCell>
                        {p.is_promotion ? (
                          <Badge className="bg-red-500 hover:bg-red-600">
                            Oferta: R$ {p.promo_price?.toFixed(2)}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Normal</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteProduct(p.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={commissionDialogOpen} onOpenChange={setCommissionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Taxa de Comissão</DialogTitle>
            <DialogDescription>
              Defina a taxa de comissão para {commissionPartner?.name}. Alterações exigem aprovação
              do Master Admin se feitas por outros níveis.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nova Taxa (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                placeholder="Ex: 10.5"
              />
              <p className="text-xs text-muted-foreground">
                A taxa deve estar entre 7.99% e 13.89%.
              </p>
            </div>
            <Button onClick={handleSaveCommission} className="w-full">
              {isMasterAdmin ? 'Salvar Comissão' : 'Solicitar Aprovação'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={financialDialogOpen} onOpenChange={setFinancialDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Histórico Financeiro - {financialPartner?.name}</DialogTitle>
            <DialogDescription>
              Visualize as transações e repasses vinculados a este parceiro.
            </DialogDescription>
          </DialogHeader>
          {financialPartner && <PharmacyFinancialHistory partner={financialPartner} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
