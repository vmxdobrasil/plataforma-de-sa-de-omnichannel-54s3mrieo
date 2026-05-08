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

export function CreatePharmacyLabForm({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [role, setRole] = useState('pharmacy')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    const formData = new FormData(e.currentTarget)
    const data = {
      role,
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      passwordConfirm: formData.get('password'),
      tax_id: formData.get('tax_id'),
      city: formData.get('city'),
      state: formData.get('state'),
      latitude: formData.get('latitude') ? Number(formData.get('latitude')) : null,
      longitude: formData.get('longitude') ? Number(formData.get('longitude')) : null,
    }

    try {
      await pb.collection('users').create(data)
      toast.success('Parceiro cadastrado com sucesso!')
      onSuccess()
    } catch (err: any) {
      setErrors(extractFieldErrors(err))
      toast.error('Erro ao cadastrar parceiro.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollArea className="h-[60vh] pr-4">
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label>Tipo de Parceiro *</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pharmacy">Farmácia / Drogaria</SelectItem>
                <SelectItem value="laboratory">Laboratório / Clínica de Imagem</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Nome / Razão Social *</Label>
            <Input name="name" required />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label>CNPJ</Label>
            <Input name="tax_id" />
          </div>
          <div className="space-y-2">
            <Label>E-mail *</Label>
            <Input type="email" name="email" required />
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>
          <div className="space-y-2">
            <Label>Senha Inicial *</Label>
            <Input type="text" name="password" required minLength={8} />
            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
          </div>
          <div className="space-y-2">
            <Label>Cidade</Label>
            <Input name="city" />
          </div>
          <div className="space-y-2">
            <Label>Estado (UF)</Label>
            <Input name="state" maxLength={2} />
          </div>
          <div className="space-y-2">
            <Label>Latitude</Label>
            <Input name="latitude" type="number" step="any" />
          </div>
          <div className="space-y-2">
            <Label>Longitude</Label>
            <Input name="longitude" type="number" step="any" />
          </div>
        </div>
        <Button type="submit" className="w-full mt-4" disabled={loading}>
          {loading ? 'Salvando...' : 'Cadastrar Parceiro'}
        </Button>
      </form>
    </ScrollArea>
  )
}
