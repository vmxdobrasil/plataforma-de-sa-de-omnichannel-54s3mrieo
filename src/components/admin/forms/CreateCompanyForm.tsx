import { useState } from 'react'
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
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { ScrollArea } from '@/components/ui/scroll-area'

export function CreateCompanyForm({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [allowanceType, setAllowanceType] = useState('benefit')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    const formData = new FormData(e.currentTarget)

    const data = {
      role: 'company',
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      passwordConfirm: formData.get('password'),
      tax_id: formData.get('tax_id'),
      health_allowance: formData.get('health_allowance')
        ? Number(formData.get('health_allowance'))
        : 0,
      medication_allowance: formData.get('medication_allowance')
        ? Number(formData.get('medication_allowance'))
        : 0,
      allowance_type: allowanceType,
    }

    try {
      await pb.collection('users').create(data)
      toast.success('Empresa cadastrada com sucesso!')
      onSuccess()
    } catch (err: any) {
      setErrors(extractFieldErrors(err))
      toast.error('Erro ao cadastrar empresa.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollArea className="h-[60vh] pr-4">
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nome da Empresa *</Label>
            <Input name="name" required />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label>CNPJ *</Label>
            <Input name="tax_id" required />
          </div>
          <div className="space-y-2">
            <Label>E-mail Corporativo *</Label>
            <Input type="email" name="email" required />
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>
          <div className="space-y-2">
            <Label>Senha Inicial *</Label>
            <Input type="text" name="password" required minLength={8} />
            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
          </div>
          <div className="space-y-2">
            <Label>Subsídio Saúde (R$)</Label>
            <Input type="number" step="0.01" name="health_allowance" />
          </div>
          <div className="space-y-2">
            <Label>Subsídio Medicamento (R$)</Label>
            <Input type="number" step="0.01" name="medication_allowance" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Tipo de Subsídio</Label>
            <Select value={allowanceType} onValueChange={setAllowanceType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="benefit">Benefício (Custo Empresa)</SelectItem>
                <SelectItem value="payroll_deduction">Desconto em Folha</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button type="submit" className="w-full mt-4" disabled={loading}>
          {loading ? 'Salvando...' : 'Cadastrar Empresa'}
        </Button>
      </form>
    </ScrollArea>
  )
}
