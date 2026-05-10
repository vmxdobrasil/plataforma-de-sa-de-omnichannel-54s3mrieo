import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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

export function EditCompanyForm({ company, onSuccess }: { company: any; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [allowanceType, setAllowanceType] = useState(company.allowance_type || 'benefit')
  const [autoRenew, setAutoRenew] = useState(company.auto_renew_benefits || false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    const formData = new FormData(e.currentTarget)
    const submitData = new FormData()

    submitData.append('name', formData.get('name') as string)
    submitData.append('business_name', formData.get('business_name') as string)
    submitData.append('tax_id', formData.get('tax_id') as string)
    submitData.append('allowance_type', allowanceType)
    submitData.append('auto_renew_benefits', autoRenew ? 'true' : 'false')

    submitData.append('address_zip_code', formData.get('address_zip_code') as string)
    submitData.append('address_street', formData.get('address_street') as string)
    submitData.append('address_number', formData.get('address_number') as string)
    submitData.append('address_neighborhood', formData.get('address_neighborhood') as string)
    submitData.append('address_complement', formData.get('address_complement') as string)
    submitData.append('city', formData.get('city') as string)
    submitData.append('state', formData.get('state') as string)

    const healthAllow = formData.get('health_allowance')
    submitData.append('health_allowance', healthAllow ? (healthAllow as string) : '0')

    const medAllow = formData.get('medication_allowance')
    submitData.append('medication_allowance', medAllow ? (medAllow as string) : '0')

    const avatarFile = formData.get('avatar') as File
    if (avatarFile && avatarFile.size > 0) {
      submitData.append('avatar', avatarFile)
    }

    try {
      await pb.collection('users').update(company.id, submitData)
      toast.success('Empresa atualizada com sucesso!')
      onSuccess()
    } catch (err: any) {
      setErrors(extractFieldErrors(err))
      toast.error('Erro ao atualizar empresa.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollArea className="h-[60vh] pr-4">
      <form onSubmit={handleSubmit} className="space-y-6 py-2">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Informações Principais</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome Fantasia *</Label>
              <Input name="name" defaultValue={company.name} required />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label>Razão Social</Label>
              <Input name="business_name" defaultValue={company.business_name} />
            </div>
            <div className="space-y-2">
              <Label>CNPJ *</Label>
              <Input name="tax_id" defaultValue={company.tax_id} required />
            </div>
            <div className="space-y-2">
              <Label>Logo da Empresa (Nova)</Label>
              <Input type="file" name="avatar" accept="image/*" />
            </div>
            <div className="space-y-2">
              <Label>E-mail Corporativo</Label>
              <Input type="email" value={company.email} disabled />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Endereço</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>CEP</Label>
              <Input name="address_zip_code" defaultValue={company.address_zip_code} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Rua / Logradouro</Label>
              <Input name="address_street" defaultValue={company.address_street} />
            </div>
            <div className="space-y-2">
              <Label>Número</Label>
              <Input name="address_number" defaultValue={company.address_number} />
            </div>
            <div className="space-y-2">
              <Label>Bairro</Label>
              <Input name="address_neighborhood" defaultValue={company.address_neighborhood} />
            </div>
            <div className="space-y-2">
              <Label>Complemento</Label>
              <Input name="address_complement" defaultValue={company.address_complement} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Cidade</Label>
              <Input name="city" defaultValue={company.city} />
            </div>
            <div className="space-y-2">
              <Label>Estado (UF)</Label>
              <Input name="state" maxLength={2} defaultValue={company.state} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Benefícios & Subsídios</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Subsídio Saúde (R$)</Label>
              <Input
                type="number"
                step="0.01"
                name="health_allowance"
                defaultValue={company.health_allowance}
              />
            </div>
            <div className="space-y-2">
              <Label>Subsídio Medicamento (R$)</Label>
              <Input
                type="number"
                step="0.01"
                name="medication_allowance"
                defaultValue={company.medication_allowance}
              />
            </div>
            <div className="space-y-2">
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
            <div className="space-y-2 md:col-span-2 flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Renovação Automática</Label>
                <p className="text-sm text-muted-foreground">
                  Renovar benefícios automaticamente todo mês.
                </p>
              </div>
              <Switch checked={autoRenew} onCheckedChange={setAutoRenew} />
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full mt-4" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </form>
    </ScrollArea>
  )
}
