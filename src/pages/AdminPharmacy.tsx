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
import { Search, Pill, Trash2, Edit, Plus, Store } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { CreatePharmacyLabForm } from '@/components/admin/forms/CreatePharmacyLabForm'
import { PharmacyDocuments } from '@/components/admin/PharmacyDocuments'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useRealtime } from '@/hooks/use-realtime'
import { AdminHeader } from '@/components/admin/AdminHeader'

export default function AdminPharmacy() {
  const [products, setProducts] = useState<any[]>([])
  const [partners, setPartners] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  const [searchPartner, setSearchPartner] = useState('')
  const [searchCity, setSearchCity] = useState('')
  const [searchNeighborhood, setSearchNeighborhood] = useState('')

  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loadingPartners, setLoadingPartners] = useState(true)
  const [isPartnerDialogOpen, setIsPartnerDialogOpen] = useState(false)
  const [selectedPartner, setSelectedPartner] = useState<any>(null)

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
      let filter = `(role = "pharmacy" || role = "laboratory")`

      const safePartner = searchPartner.replace(/["\\]/g, '')
      const safeCity = searchCity.replace(/["\\]/g, '')
      const safeNeigh = searchNeighborhood.replace(/["\\]/g, '')

      if (safePartner) {
        filter += ` && (name ~ "${safePartner}" || business_name ~ "${safePartner}")`
      }
      if (safeCity) {
        filter += ` && city ~ "${safeCity}"`
      }
      if (safeNeigh) {
        filter += ` && address_neighborhood ~ "${safeNeigh}"`
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
  }, [searchPartner, searchCity, searchNeighborhood])

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

  const handlePartnerSuccess = () => {
    setIsPartnerDialogOpen(false)
    // Delay clearing the state to allow dialog closing animation
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
            <div className="flex flex-col md:flex-row gap-4 items-center w-full">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nome fantasia ou razão social..."
                  className="pl-9 bg-background"
                  value={searchPartner}
                  onChange={(e) => setSearchPartner(e.target.value)}
                />
              </div>
              <div className="relative flex-1 w-full">
                <Input
                  placeholder="Filtrar por cidade..."
                  className="bg-background"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                />
              </div>
              <div className="relative flex-1 w-full">
                <Input
                  placeholder="Filtrar por bairro..."
                  className="bg-background"
                  value={searchNeighborhood}
                  onChange={(e) => setSearchNeighborhood(e.target.value)}
                />
              </div>
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
                  <Button className="w-full md:w-auto shrink-0">
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
                        />
                      </TabsContent>
                      <TabsContent value="documents">
                        <PharmacyDocuments partner={selectedPartner} />
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <CreatePharmacyLabForm onSuccess={handlePartnerSuccess} />
                  )}
                </DialogContent>
              </Dialog>
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
                              {p.name || '-'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase text-muted-foreground block leading-tight">
                              Razão Social
                            </span>
                            <span className="text-xs font-medium text-muted-foreground leading-tight">
                              {p.business_name || '-'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] uppercase h-5">
                              {p.role === 'pharmacy' ? 'Farmácia' : 'Laboratório'}
                            </Badge>
                            {p.tax_id && (
                              <span className="text-[10px] text-muted-foreground">
                                CNPJ: {p.tax_id}
                              </span>
                            )}
                          </div>
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
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditPartner(p)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePartner(p.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
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
    </div>
  )
}
