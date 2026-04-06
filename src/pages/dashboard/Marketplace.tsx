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

export default function Marketplace() {
  const [products, setProducts] = useState<any[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const { user } = useAuth()
  const { toast } = useToast()

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

  const handleSubscribe = async (productId: string) => {
    try {
      await subscribeToProduct(productId, user.id)
      toast({ title: 'Sucesso', description: 'Assinatura realizada com sucesso!' })
      loadData()
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível realizar a assinatura.',
        variant: 'destructive',
      })
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
                <Button className="w-full" onClick={() => handleSubscribe(product.id)}>
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
