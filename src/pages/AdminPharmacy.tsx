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
import { Search, Pill, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function AdminPharmacy() {
  const [products, setProducts] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  const loadProducts = async () => {
    try {
      setLoading(true)
      const filter = searchTerm ? `name ~ "${searchTerm}" || description ~ "${searchTerm}"` : ''
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
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [searchTerm])

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este produto?')) return
    try {
      await pb.collection('pharmacy_products').delete(id)
      toast.success('Produto excluído com sucesso.')
      loadProducts()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao excluir produto.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Pill className="h-8 w-8 text-primary" /> Farmácias e Laboratórios
          </h1>
          <p className="text-muted-foreground mt-1">
            Painel de gestão para farmácias, drogarias e laboratórios parceiros.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-primary/20 p-4 rounded-xl border border-primary/20 shadow-sm">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome do produto..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-primary/20 [&_th]:text-foreground">
            <TableRow className="hover:bg-transparent">
              <TableHead>Produto</TableHead>
              <TableHead>Farmácia / Parceiro</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Status Promoção</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
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
                  <TableCell>{p.expand?.pharmacy_id?.name || 'Desconhecido'}</TableCell>
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
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
