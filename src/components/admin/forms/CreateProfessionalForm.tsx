import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { ScrollArea } from '@/components/ui/scroll-area'

export function CreateProfessionalForm({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    const formData = new FormData(e.currentTarget)
    const data = {
      role: 'professional',
      name: formData.get('name'),
      email: (formData.get('email') as string).trim().toLowerCase(),
      password: formData.get('password'),
      passwordConfirm: formData.get('password'),
      specialty: formData.get('specialty'),
      crm_number: formData.get('crm_number'),
      crm_state: formData.get('crm_state'),
      commission_rate: formData.get('commission_rate')
        ? Number(formData.get('commission_rate'))
        : 0,
      asaas_wallet_id: formData.get('asaas_wallet_id'),
    }

    try {
      await pb.collection('users').create(data)
      toast.success('Profissional cadastrado com sucesso!')
      onSuccess()
    } catch (err: any) {
      setErrors(extractFieldErrors(err))
      toast.error('Erro ao cadastrar profissional.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollArea className="h-[60vh] pr-4">
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nome Completo *</Label>
            <Input name="name" required />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label>E-mail *</Label>
            <Input
              type="email"
              name="email"
              required
              className={errors.email ? 'border-red-500 bg-red-50/50' : ''}
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>
          <div className="space-y-2">
            <Label>Senha Inicial *</Label>
            <Input type="text" name="password" required minLength={8} />
            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
          </div>
          <div className="space-y-2">
            <Label>Especialidade</Label>
            <Input name="specialty" />
          </div>
          <div className="space-y-2">
            <Label>CRM / Registro</Label>
            <Input name="crm_number" />
          </div>
          <div className="space-y-2">
            <Label>Estado do CRM</Label>
            <Input name="crm_state" maxLength={2} />
          </div>
          <div className="space-y-2">
            <Label>Taxa de Comissão (%)</Label>
            <Input type="number" step="0.01" name="commission_rate" />
          </div>
          <div className="space-y-2">
            <Label>Asaas Wallet ID (Opcional)</Label>
            <Input name="asaas_wallet_id" />
          </div>
        </div>
        <Button type="submit" className="w-full mt-4" disabled={loading}>
          {loading ? 'Salvando...' : 'Cadastrar Profissional'}
        </Button>
      </form>
    </ScrollArea>
  )
}
