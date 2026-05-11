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
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

export function CreatePharmacyLabForm({
  partner,
  onSuccess,
}: {
  partner?: any
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [role, setRole] = useState(partner?.role || 'pharmacy')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    partner?.avatar ? pb.files.getURL(partner, partner.avatar) : null,
  )

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    const formData = new FormData(e.currentTarget)
    const submitData = new FormData()

    submitData.append('role', role)
    submitData.append('name', formData.get('name') as string)
    submitData.append('business_name', formData.get('business_name') as string)

    if (formData.get('email')) {
      submitData.append('email', formData.get('email') as string)
    }

    if (!partner) {
      submitData.append('password', formData.get('password') as string)
      submitData.append('passwordConfirm', formData.get('password') as string)
    } else {
      const pass = formData.get('password') as string
      if (pass) {
        submitData.append('password', pass)
        submitData.append('passwordConfirm', pass)
      }
    }

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
      if (partner) {
        await pb.collection('users').update(partner.id, submitData)
        toast.success('Parceiro atualizado com sucesso!')
      } else {
        await pb.collection('users').create(submitData)
        toast.success('Parceiro cadastrado com sucesso!')
      }
      onSuccess()
    } catch (err: any) {
      setErrors(extractFieldErrors(err))
      toast.error(partner ? 'Erro ao atualizar parceiro.' : 'Erro ao cadastrar parceiro.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollArea className="max-h-[70vh] pr-4">
      <form onSubmit={handleSubmit} className="space-y-6 py-2 px-1">
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
              <Label>Nome Fantasia (Apresentação) *</Label>
              <Input name="name" defaultValue={partner?.name} required placeholder="Ex: MaxFarma" />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label>Razão Social</Label>
              <Input
                name="business_name"
                defaultValue={partner?.business_name}
                placeholder="Ex: Simões e Silva Ltda"
              />
              {errors.business_name && (
                <p className="text-xs text-red-500">{errors.business_name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input
                name="tax_id"
                defaultValue={partner?.tax_id}
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div className="space-y-2">
              <Label>Logomarca (Avatar)</Label>
              <div className="flex items-center gap-4">
                {avatarPreview && (
                  <Avatar className="h-16 w-16 border rounded-md shrink-0">
                    <AvatarImage src={avatarPreview} className="object-cover" />
                    <AvatarFallback>L</AvatarFallback>
                  </Avatar>
                )}
                <div className="flex-1">
                  <Input
                    type="file"
                    name="avatar"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) setAvatarPreview(URL.createObjectURL(file))
                    }}
                  />
                  {partner?.avatar && !avatarPreview && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Logo atual já cadastrado. Envie um novo arquivo para substituir.
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>E-mail *</Label>
              <Input type="email" name="email" defaultValue={partner?.email} required />
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label>
                {partner ? 'Nova Senha (deixe em branco para manter)' : 'Senha Inicial *'}
              </Label>
              <Input type="text" name="password" required={!partner} minLength={8} />
              {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Localização & Endereço</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>CEP</Label>
              <Input
                name="address_zip_code"
                defaultValue={partner?.address_zip_code}
                placeholder="00000-000"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Logradouro / Rua</Label>
              <Input
                name="address_street"
                defaultValue={partner?.address_street}
                placeholder="Ex: Rua das Flores"
              />
            </div>
            <div className="space-y-2">
              <Label>Número</Label>
              <Input
                name="address_number"
                defaultValue={partner?.address_number}
                placeholder="Ex: 123"
              />
            </div>
            <div className="space-y-2">
              <Label>Bairro</Label>
              <Input name="address_neighborhood" defaultValue={partner?.address_neighborhood} />
            </div>
            <div className="space-y-2">
              <Label>Complemento</Label>
              <Input
                name="address_complement"
                defaultValue={partner?.address_complement}
                placeholder="Sala 2, Loja B"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Cidade</Label>
              <Input name="city" defaultValue={partner?.city} />
            </div>
            <div className="space-y-2">
              <Label>Estado (UF)</Label>
              <Input
                name="state"
                defaultValue={partner?.state}
                maxLength={2}
                placeholder="Ex: SP"
              />
            </div>
            <div className="space-y-2">
              <Label>Latitude</Label>
              <Input name="latitude" defaultValue={partner?.latitude} type="number" step="any" />
            </div>
            <div className="space-y-2">
              <Label>Longitude</Label>
              <Input name="longitude" defaultValue={partner?.longitude} type="number" step="any" />
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full mt-4" disabled={loading}>
          {loading ? 'Salvando...' : partner ? 'Salvar Alterações' : 'Cadastrar Parceiro'}
        </Button>
      </form>
    </ScrollArea>
  )
}
