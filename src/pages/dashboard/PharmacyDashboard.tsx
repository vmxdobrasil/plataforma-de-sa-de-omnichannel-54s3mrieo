import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Pill, ShoppingCart, DollarSign, Plus, Trash2, Package, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'

export default function PharmacyDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newProduct, setNewProduct] = useState({ name: '', price: '', description: '' })

  useEffect(() => {
    if (user && user.role !== 'pharmacy') {
      navigate('/forbidden')
    }
  }, [user, navigate])

  const loadData = useCallback(async () => {
    if (!user?.id) return
    try {
      const [prods, txs] = await Promise.all([
        pb.collection('pharmacy_products').getFullList({
          filter: `pharmacy_id = "${user.id}"`,
          sort: '-created',
        }),
        pb.collection('benefit_transactions').getFullList({
          filter: `partner_id = "${user.id}" && category = "medication"`,
          sort: '-created',
          expand: 'employee_id,company_id',
        }),
      ])
      setProducts(prods)
      setTransactions(txs)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime('pharmacy_products', () => loadData())
  useRealtime('benefit_transactions', () => loadData())

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProduct.name || !newProduct.price) return
    try {
      await pb.collection('pharmacy_products').create({
        pharmacy_id: user.id,
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        description: newProduct.description,
      })
      toast.success('Produto adicionado!')
      setNewProduct({ name: '', price: '', description: '' })
      setShowAddForm(false)
    } catch {
      toast.error('Erro ao adicionar produto.')
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Excluir este produto?')) return
    try {
      await pb.collection('pharmacy_products').delete(id)
      toast.success('Produto excluído.')
    } catch {
      toast.error('Erro ao excluir.')
    }
  }

  const totalSales = transactions.reduce((sum, t) => sum + (t.amount || 0), 0)
  const commissionRate = user?.commission_rate || 10
  const commission = totalSales * (commissionRate / 100)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Pill className="h-8 w-8 text-emerald-600" /> Portal da Farmácia
        </h1>
        <p className="text-muted-foreground mt-1">Gerencie produtos e acompanhe vendas.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-emerald-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total de Produtos</p>
              <p className="text-2xl font-bold text-emerald-700">{products.length}</p>
            </div>
            <Package className="h-8 w-8 text-emerald-600" />
          </CardContent>
        </Card>
        <Card className="border-emerald-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Vendas Totais</p>
              <p className="text-2xl font-bold text-emerald-700">R$ {totalSales.toFixed(2)}</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-emerald-600" />
          </CardContent>
        </Card>
        <Card className="border-emerald-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Repasse ({commissionRate}%)</p>
              <p className="text-2xl font-bold text-emerald-700">R$ {commission.toFixed(2)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-emerald-600" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Meus Produtos</CardTitle>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </Button>
        </CardHeader>
        <CardContent>
          {showAddForm && (
            <form
              onSubmit={handleAddProduct}
              className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-4 p-4 bg-muted/30 rounded-lg"
            >
              <Input
                placeholder="Nome"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                required
              />
              <Input
                placeholder="Preço"
                type="number"
                step="0.01"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                required
              />
              <Input
                placeholder="Descrição"
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              />
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                Salvar
              </Button>
            </form>
          )}
          {products.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Nenhum produto cadastrado.</p>
          ) : (
            <div className="space-y-2">
              {products.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-sm text-muted-foreground">{p.description || '-'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-emerald-700">R$ {p.price?.toFixed(2)}</span>
                    {p.is_promotion && <Badge className="bg-red-500">Oferta</Badge>}
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(p.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Nenhuma venda registrada.</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{t.description || 'Venda'}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.expand?.employee_id?.name || 'Funcionário'} •{' '}
                      {format(new Date(t.created), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold">R$ {t.amount?.toFixed(2)}</span>
                    <Badge
                      variant={t.payment_status === 'confirmed' ? 'default' : 'secondary'}
                      className={
                        t.payment_status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : ''
                      }
                    >
                      {t.payment_status || 'pending'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
