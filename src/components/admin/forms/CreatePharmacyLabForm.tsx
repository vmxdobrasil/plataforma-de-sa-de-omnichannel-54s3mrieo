import { useState, useRef, useEffect } from 'react'
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
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

export function CreatePharmacyLabForm({
  partner,
  onSuccess,
  onConflict,
}: {
  partner?: any
  onSuccess: () => void
  onConflict?: (existingPartner: any) => void
}) {
  const { user } = useAuth()
  const isMasterAdmin = user?.role === 'admin'

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const initialRole =
    partner?.role === 'pharmacy' || partner?.role === 'laboratory' ? partner.role : 'pharmacy'
  const [role, setRole] = useState(initialRole)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    partner?.avatar ? pb.files.getURL(partner, partner.avatar) : null,
  )

  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18)
  }

  const [cep, setCep] = useState(partner?.address_zip_code || '')
  const [street, setStreet] = useState(partner?.address_street || '')
  const [neighborhood, setNeighborhood] = useState(partner?.address_neighborhood || '')
  const [city, setCity] = useState(partner?.city || '')
  const [stateUF, setStateUF] = useState((partner?.state || '').toUpperCase())
  const [cnpj, setCnpj] = useState(partner?.tax_id ? formatCNPJ(partner.tax_id) : '')
  const [phone, setPhone] = useState(partner?.phone || '')
  const [email, setEmail] = useState(partner?.email || '')
  const [commissionRate, setCommissionRate] = useState(
    partner?.commission_rate?.toString().replace('.', ',') ||
      partner?.pending_commission_rate?.toString().replace('.', ',') ||
      '',
  )

  const formatCEP = (value: string) => {
    return value.replace(/\D/g, '').replace(/^(\d{5})(\d{3}).*/, '$1-$2')
  }

  const [isFetchingCep, setIsFetchingCep] = useState(false)
  const [conflictPartner, setConflictPartner] = useState<any>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [isFormValid, setIsFormValid] = useState(false)

  const handleFormChange = () => {
    if (formRef.current) {
      let valid = formRef.current.checkValidity()
      const formData = new FormData(formRef.current)
      const rateStr = formData.get('commission_rate') as string
      if (rateStr) {
        const rate = parseFloat(rateStr.replace(',', '.'))
        if (isNaN(rate) || rate < 7.99 || rate > 13.89) {
          valid = false
        }
      } else if (!partner) {
        valid = false
      }
      const cleanCnpj = formatCNPJ(formData.get('tax_id') as string).replace(/\D/g, '')
      if (cleanCnpj.length !== 14) {
        valid = false
      }
      const uf = (stateUF || '')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z]/g, '')
      const validUFs = [
        'AC',
        'AL',
        'AP',
        'AM',
        'BA',
        'CE',
        'DF',
        'ES',
        'GO',
        'MA',
        'MT',
        'MS',
        'MG',
        'PA',
        'PB',
        'PR',
        'PE',
        'PI',
        'RJ',
        'RN',
        'RS',
        'RO',
        'RR',
        'SC',
        'SP',
        'SE',
        'TO',
      ]
      if (!uf || !validUFs.includes(uf)) {
        valid = false
      }
      setIsFormValid(valid)
    }
  }

  // Initial check
  useEffect(() => {
    handleFormChange()
  }, [stateUF, city, neighborhood, street, cep, commissionRate, cnpj, phone, email, role])

  const handleCnpjBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const val = e.target.value
    const cleanCnpj = val.replace(/\D/g, '')
    if (cleanCnpj.length === 14) {
      try {
        const existing = await pb.collection('users').getFirstListItem(`tax_id="${cleanCnpj}"`)
        if (existing && existing.id !== partner?.id) {
          const partnerName = existing.business_name || existing.name || 'Desconhecido'
          const msg = `Este CNPJ já está cadastrado para ${partnerName}.`
          setConflictPartner(existing)
          setErrors((prev) => ({ ...prev, tax_id: msg }))
          if (onConflict) {
            toast.error(msg, {
              action: {
                label: 'Editar Cadastro Existente',
                onClick: () => onConflict(existing),
              },
              duration: 10000,
            })
          }
        } else {
          setConflictPartner(null)
          setErrors((prev) => {
            const newErrors = { ...prev }
            delete newErrors.tax_id
            return newErrors
          })
        }
      } catch (err) {
        // Not found, which means it's available
        setConflictPartner(null)
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors.tax_id
          return newErrors
        })
      }
    }
  }

  const handleEmailBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val && val.includes('@')) {
      try {
        const existing = await pb.collection('users').getFirstListItem(`email="${val}"`)
        if (existing && existing.id !== partner?.id) {
          const msg = `Este e-mail já está vinculado ao parceiro ${existing.business_name || existing.name}.`
          setConflictPartner(existing)
          setErrors((prev) => ({ ...prev, email: msg }))
          if (onConflict) {
            toast.error(`E-mail já cadastrado para ${existing.business_name || existing.name}.`, {
              action: { label: 'Editar Cadastro Existente', onClick: () => onConflict(existing) },
              duration: 10000,
            })
          }
        } else {
          setConflictPartner(null)
          setErrors((prev) => {
            const newErrors = { ...prev }
            delete newErrors.email
            return newErrors
          })
        }
      } catch (err) {
        // Not found, which means it's available
        setConflictPartner(null)
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors.email
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

  const fetchCepData = async (cepValue: string) => {
    const cleanCep = cepValue.replace(/\D/g, '')
    if (cleanCep.length === 8) {
      setIsFetchingCep(true)
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
        const data = await res.json()
        if (!data.erro) {
          setStreet(data.logradouro || '')
          setNeighborhood(data.bairro || '')
          setCity(data.localidade || '')
          setStateUF((data.uf || '').toUpperCase())
          setTimeout(handleFormChange, 0)
        } else {
          toast.error('CEP não encontrado. Por favor, preencha o endereço manualmente.')
        }
      } catch (err) {
        console.error('Error fetching CEP:', err)
        toast.error('Erro ao buscar CEP. Por favor, preencha o endereço manualmente.')
      } finally {
        setIsFetchingCep(false)
      }
    }
  }

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value)
    setCep(formatted)
    const cleanCep = formatted.replace(/\D/g, '')
    if (cleanCep.length === 8) {
      fetchCepData(cleanCep)
    }
  }

  const handleCepBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    fetchCepData(e.target.value)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    const formData = new FormData(e.currentTarget)
    const submitData = new FormData()

    const commissionStr = formData.get('commission_rate') as string
    if (commissionStr) {
      const rate = parseFloat(commissionStr.replace(',', '.'))
      if (isNaN(rate) || rate < 7.99 || rate > 13.89) {
        toast.error('A taxa deve estar entre 7,99% e 13,89%')
        setErrors((prev) => ({
          ...prev,
          commission_rate: 'A taxa deve estar entre 7,99% e 13,89%',
        }))
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
      setErrors((prev) => ({ ...prev, commission_rate: 'A taxa de comissão é obrigatória' }))
      setLoading(false)
      return
    }

    const cleanCnpj = cnpj.replace(/\D/g, '')
    if (cleanCnpj.length !== 14) {
      toast.error('CNPJ inválido.')
      setErrors((prev) => ({ ...prev, tax_id: 'CNPJ deve conter 14 dígitos numéricos.' }))
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

    submitData.append('tax_id', cleanCnpj)

    submitData.append('address_zip_code', cep)
    submitData.append('address_street', street)
    submitData.append('address_number', formData.get('address_number') as string)
    submitData.append('address_neighborhood', neighborhood)
    const uf = (stateUF || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
    const validUFs = [
      'AC',
      'AL',
      'AP',
      'AM',
      'BA',
      'CE',
      'DF',
      'ES',
      'GO',
      'MA',
      'MT',
      'MS',
      'MG',
      'PA',
      'PB',
      'PR',
      'PE',
      'PI',
      'RJ',
      'RN',
      'RS',
      'RO',
      'RR',
      'SC',
      'SP',
      'SE',
      'TO',
    ]
    if (!validUFs.includes(uf)) {
      toast.error('Estado (UF) inválido. Use uma sigla válida (ex: GO, SP).')
      setErrors((prev) => ({
        ...prev,
        state: 'Use uma sigla válida (ex: GO, SP).',
      }))
      setLoading(false)
      return
    }

    submitData.append('address_complement', formData.get('address_complement') as string)
    submitData.append('city', city)
    submitData.append('state', uf)

    const avatarFile = formData.get('avatar') as File
    if (avatarFile && avatarFile.size > 0) {
      submitData.append('avatar', avatarFile)
    }

    if (errors.tax_id || errors.email) {
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
        await pb.collection('audit_logs').create({
          user_id: user?.id,
          action: 'update',
          resource_type: 'users',
          resource_id: partner.id,
          details: { status: 'success', type: 'partner_update' },
        })
        toast.success('Parceiro atualizado com sucesso!')
      } else {
        const newPartner = await pb.collection('users').create(submitData)
        await pb.collection('audit_logs').create({
          user_id: user?.id,
          action: 'create',
          resource_type: 'users',
          resource_id: newPartner.id,
          details: { status: 'success', type: 'partner_registration' },
        })
        toast.success('Parceiro cadastrado com sucesso!')
      }
      onSuccess()
    } catch (err: any) {
      await pb
        .collection('audit_logs')
        .create({
          user_id: user?.id,
          action: partner ? 'update' : 'create',
          resource_type: 'users',
          resource_id: partner?.id || '',
          details: { status: 'failed', error: err.message, type: 'partner_registration' },
        })
        .catch(() => {})

      const fieldErrors = extractFieldErrors(err)
      if (
        fieldErrors.tax_id?.toLowerCase().includes('unique') ||
        fieldErrors.tax_id === 'The value must be unique.' ||
        fieldErrors.tax_id === 'Este valor já está em uso.' ||
        err.message?.toLowerCase().includes('unique')
      ) {
        try {
          const cleanCnpj = cnpj.replace(/\D/g, '')
          const existing = await pb.collection('users').getFirstListItem(`tax_id="${cleanCnpj}"`)
          const partnerName = existing.business_name || existing.name || 'Desconhecido'
          const msg = `Este CNPJ já está cadastrado para ${partnerName}.`
          fieldErrors.tax_id = msg
          setConflictPartner(existing)
          if (onConflict) {
            toast.error(msg, {
              action: {
                label: 'Editar Cadastro Existente',
                onClick: () => onConflict(existing),
              },
              duration: 10000,
            })
          }
        } catch (_) {
          fieldErrors.tax_id = 'Este CNPJ já está cadastrado.'
        }
      }

      if (
        fieldErrors.email?.toLowerCase().includes('unique') ||
        fieldErrors.email === 'The value must be unique.' ||
        fieldErrors.email === 'Este valor já está em uso.'
      ) {
        try {
          const existing = await pb.collection('users').getFirstListItem(`email="${email}"`)
          const msg = `Este e-mail já está vinculado ao parceiro ${existing.business_name || existing.name}.`
          fieldErrors.email = msg
          setConflictPartner(existing)
          if (onConflict) {
            toast.error(`E-mail já cadastrado para ${existing.business_name || existing.name}.`, {
              action: { label: 'Editar Cadastro Existente', onClick: () => onConflict(existing) },
              duration: 10000,
            })
          }
        } catch (_) {
          fieldErrors.email = 'Este e-mail já está cadastrado.'
        }
      }

      setErrors(fieldErrors)
      if (Object.keys(fieldErrors).length > 0) {
        const errorMessages = Object.entries(fieldErrors)
          .map(([field, msg]) => {
            const fieldNameMap: Record<string, string> = {
              tax_id: 'CNPJ',
              email: 'E-mail',
              commission_rate: 'Taxa de Comissão',
              pending_commission_rate: 'Taxa de Comissão (Pendente)',
              name: 'Razão Social',
              business_name: 'Nome Fantasia',
              address_zip_code: 'CEP',
              phone: 'Telefone',
              state: 'Estado (UF)',
            }
            const name = fieldNameMap[field] || field
            const cleanMsg =
              typeof msg === 'string' && msg.startsWith('{') ? 'Valor inválido.' : msg
            return `${name}: ${cleanMsg}`
          })
          .join('\n')
        toast.error('Corrija os erros para continuar', {
          description: errorMessages,
          duration: 5000,
        })
      } else {
        const fallbackMsg =
          err?.message && !err.message.startsWith('{')
            ? err.message
            : partner
              ? 'Erro ao atualizar parceiro.'
              : 'Erro ao cadastrar parceiro.'
        toast.error(fallbackMsg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollArea className="max-h-[70vh] pr-4">
      <form
        ref={formRef}
        onChange={handleFormChange}
        onSubmit={handleSubmit}
        className="space-y-6 py-2 px-1"
      >
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
              <Input
                name="business_name"
                defaultValue={partner?.business_name}
                required
                placeholder="Ex: MaxFarma"
              />
              {errors.business_name && (
                <p className="text-xs text-red-500">{errors.business_name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Razão Social *</Label>
              <Input
                name="name"
                defaultValue={partner?.name}
                required
                placeholder="Ex: Simões e Silva Ltda"
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
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
              {errors.tax_id && (
                <div className="flex flex-col gap-2 mt-1">
                  <p className="text-xs text-red-500">{errors.tax_id}</p>
                  {conflictPartner && onConflict && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-fit"
                      onClick={() => onConflict(conflictPartner)}
                    >
                      Editar Cadastro Existente
                    </Button>
                  )}
                </div>
              )}
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
              <Input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={handleEmailBlur}
                required
              />
              {errors.email && (
                <div className="flex flex-col gap-2 mt-1">
                  <p className="text-xs text-red-500">{errors.email}</p>
                  {conflictPartner && onConflict && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-fit"
                      onClick={() => onConflict(conflictPartner)}
                    >
                      Editar Cadastro Existente
                    </Button>
                  )}
                </div>
              )}
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
                type="text"
                name="commission_rate"
                value={commissionRate}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.,]/g, '')
                  setCommissionRate(val)
                }}
                required
                placeholder="Ex: 13,88"
              />
              <p className="text-[10px] text-muted-foreground">
                A taxa deve estar entre 7,99% e 13,89% (ex: 13,88)
              </p>
              {errors.commission_rate && (
                <p className="text-xs text-red-500">{errors.commission_rate}</p>
              )}
              {errors.pending_commission_rate && (
                <p className="text-xs text-red-500">{errors.pending_commission_rate}</p>
              )}
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
              <div className="relative">
                <Input
                  name="address_zip_code"
                  value={cep}
                  onChange={handleCepChange}
                  onBlur={handleCepBlur}
                  required
                  placeholder="00000-000"
                  maxLength={9}
                  className={isFetchingCep ? 'pr-9' : ''}
                />
                {isFetchingCep && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
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
              <Select
                value={stateUF || undefined}
                onValueChange={(val) => setStateUF(val)}
                required
                name="state"
              >
                <SelectTrigger>
                  <SelectValue placeholder="UF..." />
                </SelectTrigger>
                <SelectContent>
                  {[
                    'AC',
                    'AL',
                    'AP',
                    'AM',
                    'BA',
                    'CE',
                    'DF',
                    'ES',
                    'GO',
                    'MA',
                    'MT',
                    'MS',
                    'MG',
                    'PA',
                    'PB',
                    'PR',
                    'PE',
                    'PI',
                    'RJ',
                    'RN',
                    'RS',
                    'RO',
                    'RR',
                    'SC',
                    'SP',
                    'SE',
                    'TO',
                  ].map((uf) => (
                    <SelectItem key={uf} value={uf}>
                      {uf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.state && <p className="text-xs text-red-500">{errors.state}</p>}
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full mt-4" disabled={loading || !isFormValid}>
          {loading ? 'Salvando...' : partner ? 'Salvar Alterações' : 'Confirmar'}
        </Button>
      </form>
    </ScrollArea>
  )
}
