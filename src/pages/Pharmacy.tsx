import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import pb from '@/lib/pocketbase/client'
import { Search, ShoppingCart, Pill, Loader2, QrCode } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

export default function Pharmacy() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [employeeData, setEmployeeData] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [processing, setProcessing] = useState<string | null>(null)
  const [processingAsaas, setProcessingAsaas] = useState<any>(null)

  const loadData = async () => {
    try {
      const existing = await pb.collection('pharmacy_products').getList(1, 50)
      if (existing.items.length === 0) {
        let pharmacyUser
        try {
          pharmacyUser = await pb.collection('users').getFirstListItem('role="pharmacy"')
        } catch (e) {
          pharmacyUser = user
        }

        const mockProducts = [
          {
            name: 'Vitamina C 500mg',
            price: 45.9,
            description: 'Suplemento vitamínico',
            is_promotion: true,
            promo_price: 39.9,
          },
          {
            name: 'Dipirona 1g',
            price: 12.5,
            description: 'Analgésico e antitérmico',
            is_promotion: false,
          },
          {
            name: 'Ômega 3',
            price: 89.9,
            description: 'Óleo de peixe em cápsulas',
            is_promotion: true,
            promo_price: 75.0,
          },
          {
            name: 'Ibuprofeno 500mg',
            price: 8.9,
            description: 'Analgésico e anti-inflamatório',
            is_promotion: false,
          },
          {
            name: 'Protetor Solar FPS 50',
            price: 65.0,
            description: 'Proteção UVA/UVB',
            is_promotion: false,
          },
        ]

        for (const p of mockProducts) {
          await pb.collection('pharmacy_products').create({
            pharmacy_id: pharmacyUser?.id || user?.id,
            ...p,
          })
        }
      }

      const res = await pb
        .collection('pharmacy_products')
        .getFullList({ sort: 'name', expand: 'pharmacy_id' })
      setProducts(res)

      if (user?.parent_id) {
        const parent = await pb.collection('users').getOne(user.parent_id)
        setEmployeeData(parent)
      } else if (user?.id) {
        const u = await pb.collection('users').getOne(user.id)
        setEmployeeData(u)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  const handlePurchase = async (product: any) => {
    if (!employeeData) return

    if (employeeData.is_blocked) {
      toast.error('O acesso corporativo deste usuário está bloqueado.')
      return
    }

    const price = product.is_promotion ? product.promo_price : product.price

    setProcessing(product.id)

    try {
      const commissionRate = product.expand?.pharmacy_id?.commission_rate || 10
      const asaasWalletId = product.expand?.pharmacy_id?.asaas_wallet_id
      const partnerId = product.expand?.pharmacy_id?.id || product.pharmacy_id

      const split = asaasWalletId
        ? {
            walletId: asaasWalletId,
            percentage: 100 - commissionRate,
          }
        : undefined

      const tx = await pb.collection('benefit_transactions').create({
        employee_id: employeeData.id,
        company_id: employeeData.company_id || employeeData.id,
        partner_id: partnerId,
        amount: price,
        type: 'debit',
        category: 'medication',
        description: `Compra na Farmácia: ${product.name}`,
      })

      const payRes = await pb.send('/backend/v1/asaas/pay', {
        method: 'POST',
        body: JSON.stringify({
          amount: price,
          description: `Compra na Farmácia: ${product.name}`,
          transactionId: tx.id,
          split: split,
          billingType: 'PIX',
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      if (payRes.invoiceUrl) {
        setProcessingAsaas({ ...payRes, product })
      } else {
        toast.success('Compra registrada e enviada para o parceiro.')
      }
    } catch (err) {
      console.error(err)
      toast.error('Erro ao processar a compra.')
    } finally {
      setProcessing(null)
    }
  }

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6 pb-10 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Pill className="h-8 w-8 text-teal-600" /> Farmácia V MED
          </h1>
          <p className="text-muted-foreground mt-1">
            Compre medicamentos e itens de perfumaria pagando via PIX.
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar produtos..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((product) => (
            <Card
              key={product.id}
              className="flex flex-col overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="aspect-square bg-muted flex items-center justify-center relative">
                {product.image ? (
                  <img
                    src={pb.files.getURL(product, product.image)}
                    alt={product.name}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <Pill className="h-12 w-12 text-muted-foreground/30" />
                )}
                {product.is_promotion && (
                  <Badge className="absolute top-2 right-2 bg-red-500 hover:bg-red-600">
                    Oferta
                  </Badge>
                )}
              </div>
              <CardContent className="p-4 flex-1">
                <h3 className="font-semibold line-clamp-2" title={product.name}>
                  {product.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {product.description}
                </p>
                <div className="mt-3">
                  {product.is_promotion ? (
                    <div>
                      <span className="text-sm text-muted-foreground line-through mr-2">
                        R$ {product.price.toFixed(2)}
                      </span>
                      <span className="text-lg font-bold text-teal-700">
                        R$ {product.promo_price.toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-lg font-bold text-teal-700">
                      R$ {product.price.toFixed(2)}
                    </span>
                  )}
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Button
                  className="w-full bg-teal-600 hover:bg-teal-700"
                  onClick={() => handlePurchase(product)}
                  disabled={processing === product.id}
                >
                  {processing === product.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <QrCode className="h-4 w-4 mr-2" />
                  )}
                  Pagar com PIX
                </Button>
              </CardFooter>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Nenhum produto encontrado.
            </div>
          )}
        </div>
      )}

      <Dialog open={!!processingAsaas} onOpenChange={(open) => !open && setProcessingAsaas(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagamento via PIX</DialogTitle>
            <DialogDescription>
              Escaneie o QR Code ou copie o código Copia e Cola para pagar sua compra.
            </DialogDescription>
          </DialogHeader>
          {processingAsaas && (
            <div className="flex flex-col items-center gap-4 py-4">
              {processingAsaas.pix?.encodedImage &&
              processingAsaas.pix.encodedImage !== 'mock_base64' ? (
                <img
                  src={`data:image/png;base64,${processingAsaas.pix.encodedImage}`}
                  alt="QR Code PIX"
                  className="w-48 h-48 border rounded-lg p-2 bg-white"
                />
              ) : (
                <div className="w-48 h-48 bg-muted flex flex-col items-center justify-center rounded-lg border text-sm text-muted-foreground text-center p-4">
                  <QrCode className="h-10 w-10 mb-2 opacity-50" />
                  [Ambiente de Teste]
                  <br />
                  QR Code Simulado
                </div>
              )}
              <div className="w-full space-y-2 mt-2">
                <Label>Pix Copia e Cola</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={processingAsaas.pix?.payload || '00020101021226...mock_pix'}
                    className="text-xs font-mono"
                  />
                  <Button
                    variant="secondary"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        processingAsaas.pix?.payload || '00020101021226...mock_pix',
                      )
                      toast.success('Código copiado!')
                    }}
                  >
                    Copiar
                  </Button>
                </div>
              </div>
              <Button className="w-full mt-4 bg-teal-600 hover:bg-teal-700" asChild>
                <a href={processingAsaas.invoiceUrl} target="_blank" rel="noreferrer">
                  Visualizar Fatura no Asaas
                </a>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
