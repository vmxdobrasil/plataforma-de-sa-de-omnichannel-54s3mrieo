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
    const submitData = new FormData()

    submitData.append('role', role)
    submitData.append('name', formData.get('name') as string)
    submitData.append('business_name', formData.get('business_name') as string)
    submitData.append('email', formData.get('email') as string)
    submitData.append('password', formData.get('password') as string)
    submitData.append('passwordConfirm', formData.get('password') as string)
    submitData.append('tax_id', formData.get('tax_id') as string)

    submitData.append('address_zip_code', formData.get('address_zip_code') as string)
    submitData.append('address_street', formData.get('address_street') as string)
    submitData.append('address_number', formData.get('address_number') as string)
    submitData.append('address_neighborhood', formData.get('address_neighborhood') as string)
    submitData.append('address_complement', formData.get('address_complement') as string)
    submitData.append('city', formData.get('city') as string)
    submitData.append('state', formData.get('state') as string)

    const lat = formData.get('latitude')
    if (lat) submitData.append('latitude', lat as string)
    const lng = formData.get('longitude')
    if (lng) submitData.append('longitude', lng as string)

    const avatarFile = formData.get('avatar') as File
    if (avatarFile && avatarFile.size > 0) {
      submitData.append('avatar', avatarFile)
    }

    try {
      await pb.collection('users').create(submitData)
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
      <form onSubmit={handleSubmit} className="space-y-6 py-2">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Informações Principais</h3>
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
              <Label>Nome Fantasia *</Label>
              <Input name="name" required />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label>Razão Social</Label>
              <Input name="business_name" />
              {errors.business_name && (
                <p className="text-xs text-red-500">{errors.business_name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input name="tax_id" />
            </div>
            <div className="space-y-2">
              <Label>Logo / Avatar</Label>
              <Input type="file" name="avatar" accept="image/*" />
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
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Localização & Endereço</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>CEP</Label>
              <Input name="address_zip_code" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Rua / Logradouro</Label>
              <Input name="address_street" />
            </div>
            <div className="space-y-2">
              <Label>Número</Label>
              <Input name="address_number" />
            </div>
            <div className="space-y-2">
              <Label>Bairro</Label>
              <Input name="address_neighborhood" />
            </div>
            <div className="space-y-2">
              <Label>Complemento</Label>
              <Input name="address_complement" />
            </div>
            <div className="space-y-2 md:col-span-2">
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
        </div>

        <Button type="submit" className="w-full mt-4" disabled={loading}>
          {loading ? 'Salvando...' : 'Cadastrar Parceiro'}
        </Button>
      </form>
    </ScrollArea>
  )
}
