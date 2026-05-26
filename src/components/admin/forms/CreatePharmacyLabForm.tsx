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
import { useAuth } from '@/hooks/use-auth'

export function CreatePharmacyLabForm({
  partner,
  onSuccess,
}: {
  partner?: any
  onSuccess: () => void
}) {
  const { user } = useAuth()
  const isMasterAdmin = user?.role === 'admin'

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [role, setRole] = useState(partner?.role || 'pharmacy')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    partner?.avatar ? pb.files.getURL(partner, partner.avatar) : null,
  )

  const [cep, setCep] = useState(partner?.address_zip_code || '')
  const [street, setStreet] = useState(partner?.address_street || '')
  const [neighborhood, setNeighborhood] = useState(partner?.address_neighborhood || '')
  const [city, setCity] = useState(partner?.city || '')
  const [stateUF, setStateUF] = useState(partner?.state || '')
  const [cnpj, setCnpj] = useState(partner?.tax_id || '')
  const [phone, setPhone] = useState(partner?.phone || '')

  const formatCEP = (value: string) => {
    return value.replace(/\D/g, '').replace(/^(\d{5})(\d{3}).*/, '$1-$2')
  }

  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18)
  }

  const handleCnpjBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val.replace(/\D/g, '').length === 14) {
      try {
        const existing = await pb.collection('users').getFirstListItem(`tax_id="${val}"`)
        if (existing && existing.id !== partner?.id) {
          setErrors((prev) => ({ ...prev, tax_id: 'Este CNPJ já está cadastrado no sistema.' }))
          toast.error('Este CNPJ já está cadastrado no sistema.')
        } else {
          setErrors((prev) => {
            const newErrors = { ...prev }
            delete newErrors.tax_id
            return newErrors
          })
        }
      } catch (err) {
        // Not found, which means it's available
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors.tax_id
          return newErrors
        })
      }
    }
  }

  const formatPhone = (value: string) => {
    const v = value.replace(/\D/g, '')
    if (v.length <= 10) {
      return v
        .replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3')
        .trim()
        .replace(/-$/, '')
    }
    return v
      .replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3')
      .trim()
      .replace(/-$/, '')
  }

  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cleanCep = e.target.value.replace(/\D/g, '')
    if (cleanCep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
        const data = await res.json()
        if (!data.erro) {
          setStreet(data.logradouro || '')
          setNeighborhood(data.bairro || '')
          setCity(data.localidade || '')
          setStateUF(data.uf || '')
        }
      } catch (err) {
        console.error('Error fetching CEP:', err)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    const formData = new FormData(e.currentTarget)
    const submitData = new FormData()

    const commissionStr = formData.get('commission_rate') as string
    if (commissionStr) {
      const rate = parseFloat(commissionStr)
      if (isNaN(rate) || rate < 7.99 || rate > 13.89) {
        toast.error('A comissão deve estar entre 7.99% e 13.89%')
        setLoading(false)
        return
      }
      if (isMasterAdmin) {
        submitData.append('commission_rate', rate.toString())
        submitData.append('pending_commission_rate', '')
      } else {
        submitData.append('pending_commission_rate', rate.toString())
      }
    } else if (!partner) {
      toast.error('A taxa de comissão é obrigatória')
      setLoading(false)
      return
    }

    if (phone) {
      submitData.append('phone', phone)
    }

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

    submitData.append('tax_id', cnpj)

    submitData.append('address_zip_code', cep)
    submitData.append('address_street', street)
    submitData.append('address_number', formData.get('address_number') as string)
    submitData.append('address_neighborhood', neighborhood)
    submitData.append('address_complement', formData.get('address_complement') as string)
    submitData.append('city', city)
    submitData.append('state', stateUF)

    const lat = formData.get('latitude')
    if (lat) submitData.append('latitude', lat as string)
    const lng = formData.get('longitude')
    if (lng) submitData.append('longitude', lng as string)

    const avatarFile = formData.get('avatar') as File
    if (avatarFile && avatarFile.size > 0) {
      submitData.append('avatar', avatarFile)
    }

    if (errors.tax_id) {
      toast.error('Corrija os erros antes de enviar.')
      setLoading(false)
      return
    }

    if (!partner) {
      submitData.append('registration_status', 'pending')
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
      const fieldErrors = extractFieldErrors(err)
      if (
        fieldErrors.tax_id?.toLowerCase().includes('unique') ||
        fieldErrors.tax_id === 'The value must be unique.' ||
        err.message?.toLowerCase().includes('unique')
      ) {
        fieldErrors.tax_id = 'Este CNPJ já está cadastrado no sistema.'
      }
      setErrors(fieldErrors)
      toast.error(
        partner
          ? 'Erro ao atualizar parceiro. Verifique os campos.'
          : 'Erro ao cadastrar parceiro. Verifique os campos.',
      )
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
              <Label>Razão Social *</Label>
              <Input
                name="business_name"
                defaultValue={partner?.business_name}
                required
                placeholder="Ex: Simões e Silva Ltda"
              />
              {errors.business_name && (
                <p className="text-xs text-red-500">{errors.business_name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>CNPJ *</Label>
              <Input
                name="tax_id"
                value={cnpj}
                onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                onBlur={handleCnpjBlur}
                required
                placeholder="00.000.000/0000-00"
                maxLength={18}
              />
              {errors.tax_id && <p className="text-xs text-red-500">{errors.tax_id}</p>}
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
              <Label>Telefone *</Label>
              <Input
                name="phone"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                required
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
              {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
            </div>
            <div className="space-y-2">
              <Label>Taxa de Comissão (%) *</Label>
              <Input
                type="number"
                step="0.01"
                name="commission_rate"
                defaultValue={partner?.commission_rate || partner?.pending_commission_rate}
                required
                placeholder="Ex: 10.5"
              />
              <p className="text-[10px] text-muted-foreground">Entre 7.99% e 13.89%</p>
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
              <Label>CEP *</Label>
              <Input
                name="address_zip_code"
                value={cep}
                onChange={(e) => setCep(formatCEP(e.target.value))}
                onBlur={handleCepBlur}
                required
                placeholder="00000-000"
                maxLength={9}
              />
              {errors.address_zip_code && (
                <p className="text-xs text-red-500">{errors.address_zip_code}</p>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Logradouro / Rua *</Label>
              <Input
                name="address_street"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                required
                placeholder="Ex: Rua das Flores"
              />
              {errors.address_street && (
                <p className="text-xs text-red-500">{errors.address_street}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Número *</Label>
              <Input
                name="address_number"
                defaultValue={partner?.address_number}
                required
                placeholder="Ex: 123"
              />
              {errors.address_number && (
                <p className="text-xs text-red-500">{errors.address_number}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Bairro *</Label>
              <Input
                name="address_neighborhood"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                required
              />
              {errors.address_neighborhood && (
                <p className="text-xs text-red-500">{errors.address_neighborhood}</p>
              )}
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
              <Label>Cidade *</Label>
              <Input name="city" value={city} onChange={(e) => setCity(e.target.value)} required />
              {errors.city && <p className="text-xs text-red-500">{errors.city}</p>}
            </div>
            <div className="space-y-2">
              <Label>Estado (UF) *</Label>
              <Input
                name="state"
                value={stateUF}
                onChange={(e) => setStateUF(e.target.value.toUpperCase())}
                required
                maxLength={2}
                placeholder="Ex: SP"
              />
              {errors.state && <p className="text-xs text-red-500">{errors.state}</p>}
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
