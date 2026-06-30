import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Briefcase,
  Pill,
  ReceiptText,
  PlusCircle,
  CreditCard,
  Calendar,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { getEmployeeTransactions } from '@/services/benefit_transactions'
import pb from '@/lib/pocketbase/client'
import { format } from 'date-fns'

export default function BenefitStatement() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<any[]>([])
  const [employeeData, setEmployeeData] = useState<any>(null)

  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [pixData, setPixData] = useState<any>(null)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isAmountDialogOpen, setIsAmountDialogOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('200')

  const loadParent = async () => {
    if (user?.parent_id) {
      try {
        const parent = await pb.collection('users').getOne(user.parent_id)
        setEmployeeData(parent)
      } catch (e) {
        console.error(e)
      }
    } else if (user?.id) {
      try {
        const u = await pb.collection('users').getOne(user.id)
        setEmployeeData(u)
      } catch (e) {
        console.error(e)
      }
    }
  }

  useEffect(() => {
    loadParent()
  }, [user])

  const loadData = async () => {
    if (!user?.id) return
    try {
      const data = await getEmployeeTransactions(user.id)
      setTransactions(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user?.id])

  useRealtime('benefit_transactions', () => {
    loadData()
  })

  useRealtime('users', (e) => {
    if (e.record.id === employeeData?.id || e.record.id === user?.id) {
      loadParent()
    }
  })

  const filteredTransactions = transactions.filter((t) => {
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false
    if (typeFilter !== 'all' && t.type !== typeFilter) return false
    return true
  })

  const isIndependent = employeeData && !employeeData.company_id

  const handleAddCredit = async () => {
    if (!employeeData) return
    const amount = Number(paymentAmount) || 200
    try {
      const tx = await pb.collection('benefit_transactions').create({
        employee_id: employeeData.id,
        company_id: employeeData.id,
        amount: amount,
        type: 'credit',
        category: 'health_service',
        description: 'Adição de Crédito via Asaas',
        payment_status: 'pending',
      })

      const res = await pb.send('/backend/v1/asaas/pay', {
        method: 'POST',
        body: JSON.stringify({
          amount: amount,
          billingType: 'PIX',
          description: 'Adição de Crédito na VMed',
          transactionId: tx.id,
        }),
      })

      if (res.pix) {
        setPixData(res.pix)
        setIsPaymentDialogOpen(true)
      } else {
        toast.success('Cobrança gerada com sucesso!')
      }
    } catch (e) {
      console.error(e)
      toast.error('Erro ao gerar cobrança.')
    }
  }

  // Simulate payment for demo purposes
  const simulatePayment = async () => {
    try {
      if (!pixData) return
      // In real life, webhook handles this. We mock it here.
      const txId = transactions.find((t) => t.payment_status === 'pending')?.id
      if (txId) {
        await pb.send('/backend/v1/asaas/webhook', {
          method: 'POST',
          body: JSON.stringify({
            event: 'PAYMENT_MOCKED',
            externalReference: txId,
          }),
        })
        toast.success('Pagamento confirmado!')
        setIsPaymentDialogOpen(false)
        setPixData(null)
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-6 pb-10 animate-fade-in-up">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-full shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              {isIndependent ? 'Minha Carteira' : 'Extrato de Benefícios'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isIndependent
                ? 'Gerencie seus créditos e pagamentos'
                : 'Acompanhe o uso e saldo dos seus benefícios corporativos'}
            </p>
          </div>
          {isIndependent && (
            <Button
              onClick={() => setIsAmountDialogOpen(true)}
              className="w-full md:w-auto shrink-0"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Saldo
            </Button>
          )}
          <Button
            onClick={() => navigate('/search')}
            variant="outline"
            className="w-full md:w-auto shrink-0"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Agendar Consulta
          </Button>
        </div>
      </div>

      {employeeData?.company_id ? (
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-purple-800">
                  <Briefcase className="h-5 w-5" />
                  <span className="font-semibold">Saldo para Saúde</span>
                </div>
              </div>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-3xl font-bold text-purple-900">
                  R$ {employeeData?.health_allowance?.toFixed(2) || '0.00'}
                </span>
              </div>
              <p className="text-sm text-purple-700">
                Disponível em Reais para consultas e exames
                {user?.parent_id && ' (Saldo do Titular)'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-teal-50 border-teal-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-teal-800">
                  <Pill className="h-5 w-5" />
                  <span className="font-semibold">Saldo Farmácia</span>
                </div>
              </div>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-3xl font-bold text-teal-900">
                  R$ {employeeData?.medication_allowance?.toFixed(2) || '0.00'}
                </span>
              </div>
              <p className="text-sm text-teal-700">
                Disponível em Reais para compra de medicamentos
                {user?.parent_id && ' (Saldo do Titular)'}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        isIndependent && (
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-amber-800">
                    <CreditCard className="h-5 w-5" />
                    <span className="font-semibold">Saldo em Reais</span>
                  </div>
                </div>
                <div className="flex items-end gap-2 mb-1">
                  <span className="text-3xl font-bold text-amber-900">
                    R$ {employeeData?.health_allowance?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <p className="text-sm text-amber-700">Créditos disponíveis para agendamentos</p>
              </CardContent>
            </Card>
          </div>
        )
      )}

      <Dialog open={isAmountDialogOpen} onOpenChange={setIsAmountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Saldo</DialogTitle>
            <DialogDescription>
              Insira o valor que deseja adicionar à sua carteira.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>
            <Button
              onClick={() => {
                setIsAmountDialogOpen(false)
                handleAddCredit()
              }}
              className="w-full"
            >
              Gerar PIX
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagamento via PIX</DialogTitle>
            <DialogDescription>Escaneie o QR Code abaixo para adicionar saldo.</DialogDescription>
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
              Simular Pagamento Confirmado (Sandbox)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="pb-4 border-b bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <ReceiptText className="h-5 w-5 text-primary" />
            Histórico de Transações
          </CardTitle>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[160px] bg-background">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                <SelectItem value="health_service">Saúde</SelectItem>
                <SelectItem value="medication">Farmácia</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[160px] bg-background">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="credit">Créditos (+)</SelectItem>
                <SelectItem value="debit">Débitos (-)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground animate-pulse">
              Carregando transações...
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <ReceiptText className="h-8 w-8 text-primary opacity-50" />
              </div>
              <h3 className="font-semibold text-lg mb-1">Nenhuma transação encontrada</h3>
              <p className="text-muted-foreground max-w-sm">
                Não há movimentações de benefícios para exibir com os filtros atuais.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/10 hover:bg-muted/10">
                      <TableHead className="w-[180px]">Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((t) => (
                      <TableRow key={t.id} className="hover:bg-muted/30">
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(t.created), 'dd/MM/yyyy HH:mm')}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {t.description ||
                            (t.category === 'medication'
                              ? 'Compra em Farmácia'
                              : 'Uso de Benefício')}
                        </TableCell>
                        <TableCell>
                          {t.category === 'health_service' ? (
                            <Badge
                              variant="outline"
                              className="bg-purple-50 text-purple-700 border-purple-200"
                            >
                              Saúde
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-teal-50 text-teal-700 border-teal-200"
                            >
                              Farmácia
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          <div
                            className={`flex items-center justify-end gap-1 ${t.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}
                          >
                            {t.type === 'credit' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile View */}
              <div className="md:hidden flex flex-col divide-y">
                {filteredTransactions.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 flex flex-col gap-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="font-medium text-sm leading-snug">
                        {t.description ||
                          (t.category === 'medication' ? 'Compra em Farmácia' : 'Uso de Benefício')}
                      </div>
                      <div
                        className={`font-semibold text-sm whitespace-nowrap ${t.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}
                      >
                        {t.type === 'credit' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(t.created), 'dd/MM/yyyy HH:mm')}
                      </span>
                      {t.category === 'health_service' ? (
                        <Badge
                          variant="outline"
                          className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] h-5 py-0"
                        >
                          Saúde
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-teal-50 text-teal-700 border-teal-200 text-[10px] h-5 py-0"
                        >
                          Farmácia
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
