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
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Loader2, AlertCircle } from 'lucide-react'
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
  const [conflictReason, setConflictReason] = useState<'tax_id' | 'email' | null>(null)
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
      if (!uf || uf.length !== 2) {
        valid = false
      }
      // Se houver conflito de CNPJ e não estivermos editando o próprio parceiro, bloqueia submit
      if (conflictPartner && conflictPartner.id !== partner?.id) {
        valid = false
      }

      setIsFormValid(valid)
    }
  }

  useEffect(() => {
    handleFormChange()
  }, [
    stateUF,
    city,
    neighborhood,
    street,
    cep,
    commissionRate,
    cnpj,
    phone,
    email,
    role,
    conflictPartner,
  ])

  const onConflictRef = useRef(onConflict)
  useEffect(() => {
    onConflictRef.current = onConflict
  }, [onConflict])

  useEffect(() => {
    const cleanCnpj = cnpj.replace(/\D/g, '')
    if (cleanCnpj.length === 14) {
      const checkCnpj = async () => {
        try {
          const existing = await pb.collection('users').getFirstListItem(`tax_id="${cleanCnpj}"`)
          if (existing && existing.id !== partner?.id) {
            setConflictPartner(existing)
            setConflictReason('tax_id')
            setErrors((prev) => {
              const newErrors = { ...prev }
              delete newErrors.tax_id
              return newErrors
            })
          } else {
            if (conflictReason === 'tax_id') {
              setConflictPartner(null)
              setConflictReason(null)
            }
          }
        } catch (err) {
          if (conflictReason === 'tax_id') {
            setConflictPartner(null)
            setConflictReason(null)
          }
        }
      }
      checkCnpj()
    } else {
      if (conflictReason === 'tax_id') {
        setConflictPartner(null)
        setConflictReason(null)
      }
    }
  }, [cnpj, partner?.id])

  const handleEmailBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const val = e.target.value.trim().toLowerCase()
    if (val && val.includes('@')) {
      try {
        const existing = await pb.collection('users').getFirstListItem(`email="${val}"`)
        if (existing && existing.id !== partner?.id) {
          setConflictPartner(existing)
          setConflictReason('email')
          setErrors((prev) => {
            const newErrors = { ...prev }
            delete newErrors.email
            return newErrors
          })
        } else {
          if (conflictReason === 'email') {
            setConflictPartner(null)
            setConflictReason(null)
          }
          setErrors((prev) => {
            const newErrors = { ...prev }
            delete newErrors.email
            return newErrors
          })
        }
      } catch (err) {
        if (conflictReason === 'email') {
          setConflictPartner(null)
          setConflictReason(null)
        }
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors.email
          return newErrors
        })
      }
    } else {
      if (conflictReason === 'email') {
        setConflictPartner(null)
        setConflictReason(null)
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
        }
      } catch (err) {
        console.error('Error fetching CEP:', err)
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

    if (conflictPartner && conflictPartner.id !== partner?.id) {
      toast.error('Valor já cadastrado. Carregue o cadastro existente para editar.')
      return
    }

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

    // Always strip non-numeric from CNPJ
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
      submitData.append('email', (formData.get('email') as string).trim().toLowerCase())
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

    if (uf.length !== 2) {
      toast.error('Estado (UF) inválido.')
      setErrors((prev) => ({
        ...prev,
        state: 'Use uma sigla válida.',
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

    if (errors.email) {
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
          details: { status: 'success', type: 'partner_registration', tax_id: cleanCnpj },
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
          details: {
            status: 'failed',
            error: err.message,
            type: 'partner_registration',
            tax_id: cleanCnpj,
          },
        })
        .catch(() => {})

      const fieldErrors = extractFieldErrors(err)
      setErrors(fieldErrors)

      const isUniqueError = (msg?: string) =>
        msg?.toLowerCase().includes('unique') || msg?.toLowerCase().includes('únic')

      if (fieldErrors.tax_id && isUniqueError(fieldErrors.tax_id)) {
        setConflictReason('tax_id')
        pb.collection('users')
          .getFirstListItem(`tax_id="${cleanCnpj}"`)
          .then((existing) => {
            if (existing && existing.id !== partner?.id) setConflictPartner(existing)
          })
          .catch(() => {})
      } else if (fieldErrors.email && isUniqueError(fieldErrors.email)) {
        setConflictReason('email')
        const val = email.trim().toLowerCase()
        if (val) {
          pb.collection('users')
            .getFirstListItem(`email="${val}"`)
            .then((existing) => {
              if (existing && existing.id !== partner?.id) setConflictPartner(existing)
            })
            .catch(() => {})
        }
      }

      const msg = fieldErrors.tax_id || fieldErrors.email || err.message || 'Erro ao salvar.'
      toast.error(typeof msg === 'string' && !msg.startsWith('{') ? msg : 'Erro ao validar dados.')
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
        {conflictPartner && conflictPartner.id !== partner?.id && (
          <Alert className="bg-amber-50 border-amber-200 mb-6 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Conflito de Cadastro</AlertTitle>
            <AlertDescription className="text-amber-700 text-sm mt-1">
              Este parceiro já possui um cadastro no sistema.
              <br />
              (Encontramos um registro existente para{' '}
              <strong>{conflictPartner.name || conflictPartner.business_name}</strong> com este{' '}
              {conflictReason === 'tax_id' ? 'CNPJ' : 'E-mail'})
              <div className="mt-3">
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={() => {
                    if (onConflictRef.current) onConflictRef.current(conflictPartner)
                  }}
                >
                  Carregar Cadastro Existente
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

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

            <div className="space-y-2 md:col-span-2">
              <Label>CNPJ *</Label>
              <Input
                name="tax_id"
                value={cnpj}
                onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                required
                placeholder="00.000.000/0000-00"
                maxLength={18}
                className={
                  conflictReason === 'tax_id'
                    ? 'border-amber-500 bg-amber-50/50'
                    : errors.tax_id
                      ? 'border-red-500 bg-red-50/50'
                      : ''
                }
              />
              {errors.tax_id && <p className="text-xs text-red-500">{errors.tax_id}</p>}
            </div>

            <div className="space-y-2">
              <Label>Nome Fantasia *</Label>
              <Input name="name" defaultValue={partner?.name} required placeholder="Ex: MaxFarma" />
            </div>
            <div className="space-y-2">
              <Label>Razão Social *</Label>
              <Input
                name="business_name"
                defaultValue={partner?.business_name}
                required
                placeholder="Ex: Simões e Silva Ltda"
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
              <Input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={handleEmailBlur}
                required
                className={
                  conflictReason === 'email'
                    ? 'border-amber-500 bg-amber-50/50'
                    : errors.email
                      ? 'border-red-500 bg-red-50/50'
                      : ''
                }
              />
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
                A taxa deve estar entre 7,99% e 13,89%
              </p>
              {errors.commission_rate && (
                <p className="text-xs text-red-500">{errors.commission_rate}</p>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
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
            </div>
            <div className="space-y-2">
              <Label>Número *</Label>
              <Input
                name="address_number"
                defaultValue={partner?.address_number}
                required
                placeholder="Ex: 123"
              />
            </div>
            <div className="space-y-2">
              <Label>Bairro *</Label>
              <Input
                name="address_neighborhood"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                required
              />
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
            </div>
            <div className="space-y-2">
              <Label>Estado (UF) *</Label>
              <Input
                name="state"
                value={stateUF}
                onChange={(e) => setStateUF(e.target.value.toUpperCase().slice(0, 2))}
                required
                placeholder="Ex: SP"
                maxLength={2}
              />
            </div>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full mt-4"
          disabled={loading || !isFormValid || !!conflictPartner}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? 'Salvando...' : partner ? 'Salvar Alterações' : 'Confirmar Cadastro'}
        </Button>
      </form>
    </ScrollArea>
  )
}
