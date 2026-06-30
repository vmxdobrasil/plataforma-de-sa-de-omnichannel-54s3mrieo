import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ShoppingCart, Loader2, CheckCircle, Receipt } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { validatePharmacyCredit } from '@/services/partners'
import { toast } from 'sonner'

const formatCPF = (value: string) =>
  value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .slice(0, 14)

export default function PharmacySales() {
  const { user } = useAuth()
  const [cpf, setCpf] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('medication')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleSubmit = async () => {
    const cleanCpf = cpf.replace(/\D/g, '')
    if (cleanCpf.length !== 11) {
      toast.error('CPF inválido.')
      return
    }
    const parsedAmount = parseFloat(amount.replace(',', '.'))
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error('Valor inválido.')
      return
    }

    setLoading(true)
    setResult(null)
    try {
      const res = await validatePharmacyCredit(
        cleanCpf,
        parsedAmount,
        category,
        description || undefined,
      )
      setResult(res)
      toast.success('Venda processada com sucesso!')
      setCpf('')
      setAmount('')
      setDescription('')
    } catch (err: any) {
      const msg = err?.response?.message || err?.message || 'Erro ao processar venda.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 pb-10 animate-fade-in-up max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ShoppingCart className="h-8 w-8 text-teal-600" /> Registro de Vendas
        </h1>
        <p className="text-muted-foreground mt-1">
          Processe vendas utilizando o benefício do funcionário.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" /> Nova Venda
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>CPF do Funcionário *</Label>
            <Input
              value={cpf}
              onChange={(e) => setCpf(formatCPF(e.target.value))}
              placeholder="000.000.000-00"
              maxLength={14}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor (R$) *</Label>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ''))}
                placeholder="0,00"
                inputMode="decimal"
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medication">Medicamento</SelectItem>
                  <SelectItem value="exam">Exame</SelectItem>
                  <SelectItem value="health_service">Serviço de Saúde</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Descrição (opcional)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Compra de medicamentos"
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processando...
              </>
            ) : (
              'Confirmar Venda'
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className="bg-emerald-50 border-emerald-200 animate-fade-in-up">
          <CardContent className="p-6 space-y-2">
            <div className="flex items-center gap-2 text-emerald-800">
              <CheckCircle className="h-6 w-6" />
              <span className="font-semibold text-lg">Venda Autorizada</span>
            </div>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">Funcionário:</span> {result.employee_name}
              </p>
              <p>
                <span className="text-muted-foreground">Transação ID:</span>{' '}
                <span className="font-mono">{result.transaction_id}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Saldo restante:</span>{' '}
                <span className="font-bold">R$ {Number(result.remaining_balance).toFixed(2)}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
