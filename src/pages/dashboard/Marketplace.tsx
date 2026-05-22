import { useEffect, useState } from 'react'
import { getProducts, subscribeToProduct, getSubscriptions } from '@/services/ecosystem'
import { useAuth } from '@/hooks/use-auth'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Check, ShoppingCart } from 'lucide-react'
import { useRealtime } from '@/hooks/use-realtime'
import { Navigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import pb from '@/lib/pocketbase/client'

export default function Marketplace() {
  const [products, setProducts] = useState<any[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const { user } = useAuth()
  const { toast } = useToast()

  const [pixData, setPixData] = useState<any>(null)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [pendingTxId, setPendingTxId] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    const [prods, subs] = await Promise.all([getProducts(), getSubscriptions(user.id)])
    setProducts(prods)
    setSubscriptions(subs)
  }

  useRealtime('subscriptions', () => {
    if (user) loadData()
  })

  const handleSubscribe = async (product: any) => {
    try {
      const tx = await pb.collection('benefit_transactions').create({
        employee_id: user.id,
        company_id: user.company_id || user.id,
        amount: product.price,
        type: 'debit',
        description: `Compra: ${product.id}`,
        payment_status: 'pending',
      })

      const res = await pb.send('/backend/v1/asaas/pay', {
        method: 'POST',
        body: JSON.stringify({
          amount: product.price,
          billingType: 'PIX',
          description: `Compra na VMed: ${product.name}`,
          transactionId: tx.id,
        }),
      })

      if (res.pix) {
        setPixData(res.pix)
        setPendingTxId(tx.id)
        setIsPaymentDialogOpen(true)
      } else {
        toast({ title: 'Sucesso', description: 'Cobrança gerada com sucesso!' })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar a cobrança.',
        variant: 'destructive',
      })
    }
  }

  const simulatePayment = async () => {
    try {
      if (!pendingTxId) return
      await pb.send('/backend/v1/asaas/webhook', {
        method: 'POST',
        body: JSON.stringify({
          event: 'PAYMENT_MOCKED',
          externalReference: pendingTxId,
        }),
      })
      toast({ title: 'Sucesso', description: 'Pagamento confirmado!' })
      setIsPaymentDialogOpen(false)
      setPixData(null)
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const isSubscribed = (productId: string) => {
    return subscriptions.some((s) => s.product_id === productId && s.status === 'active')
  }

  if (user?.role !== 'professional') {
    return <Navigate to="/" />
  }

  const ProductList = ({ category }: { category: string }) => {
    const filtered = products.filter((p) => p.category === category)
    if (filtered.length === 0)
      return (
        <p className="text-muted-foreground py-8">Nenhum produto encontrado nesta categoria.</p>
      )

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
        {filtered.map((product) => (
          <Card key={product.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{product.name}</CardTitle>
              <CardDescription>{product.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-2xl font-bold">R$ {product.price.toFixed(2)}</p>
            </CardContent>
            <CardFooter>
              {isSubscribed(product.id) ? (
                <Button variant="secondary" className="w-full" disabled>
                  <Check className="mr-2 h-4 w-4" /> Assinado
                </Button>
              ) : (
                <Button className="w-full" onClick={() => handleSubscribe(product)}>
                  <ShoppingCart className="mr-2 h-4 w-4" /> Assinar
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagamento via PIX</DialogTitle>
            <DialogDescription>Escaneie o QR Code abaixo para concluir a compra.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center space-y-4 py-4">
            {pixData?.encodedImage ? (
              <img
                src={`data:image/png;base64,${pixData.encodedImage}`}
                alt="PIX QR Code"
                className="w-48 h-48"
              />
            ) : (
              <div className="w-48 h-48 bg-muted flex items-center justify-center text-muted-foreground rounded-lg">
                QR Code Simulado
              </div>
            )}
            <Input
              readOnly
              value={pixData?.payload || 'mock_pix_copy_paste_code'}
              className="font-mono text-xs"
            />
            <Button onClick={simulatePayment} className="w-full mt-4" variant="secondary">
              Simular Pagamento Confirmado
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
        <p className="text-muted-foreground">
          Expanda sua clínica com ferramentas, cursos e mentorias da V MED.
        </p>
      </div>

      <Tabs defaultValue="course" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="course">Cursos</TabsTrigger>
          <TabsTrigger value="agent">Agentes IA</TabsTrigger>
          <TabsTrigger value="mentorship">Mentorias</TabsTrigger>
          <TabsTrigger value="service">Serviços</TabsTrigger>
        </TabsList>
        <TabsContent value="course">
          <ProductList category="course" />
        </TabsContent>
        <TabsContent value="agent">
          <ProductList category="agent" />
        </TabsContent>
        <TabsContent value="mentorship">
          <ProductList category="mentorship" />
        </TabsContent>
        <TabsContent value="service">
          <ProductList category="service" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
