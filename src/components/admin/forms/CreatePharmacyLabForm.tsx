import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, AlertCircle, Upload } from 'lucide-react'
import { toast } from 'sonner'
import pb from '@/lib/pocketbase/client'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { useAuth } from '@/hooks/use-auth'

const formSchema = z.object({
  role: z.enum(['pharmacy', 'laboratory']),
  tax_id: z.string().min(1, 'CNPJ é obrigatório'),
  name: z.string().min(2, 'Nome fantasia é obrigatório'),
  business_name: z.string().min(2, 'Razão social é obrigatória'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(14, 'Telefone incompleto'),
  commission_rate: z.string().min(1, 'Taxa obrigatória'),
  password: z.string().optional(),
  address_zip_code: z.string().min(9, 'CEP incompleto'),
  address_street: z.string().min(2, 'Logradouro é obrigatório'),
  address_number: z.string().min(1, 'Número é obrigatório'),
  address_neighborhood: z.string().min(2, 'Bairro é obrigatório'),
  address_complement: z.string().optional(),
  city: z.string().min(2, 'Cidade é obrigatória'),
  state: z.string().length(2, 'UF inválida'),
})

const formatCNPJ = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 18)
}

const formatCEP = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{5})(\d)/, '$1-$2')
    .slice(0, 9)
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
  const [isFetchingCep, setIsFetchingCep] = useState(false)
  const [conflictPartner, setConflictPartner] = useState<any>(null)
  const [conflictReason, setConflictReason] = useState<'tax_id' | 'email' | null>(null)

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    partner?.avatar ? pb.files.getURL(partner, partner.avatar) : null,
  )

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: partner?.role === 'laboratory' ? 'laboratory' : 'pharmacy',
      tax_id: partner?.tax_id ? formatCNPJ(partner.tax_id) : '',
      name: partner?.name || '',
      business_name: partner?.business_name || '',
      email: partner?.email || '',
      phone: partner?.phone ? formatPhone(partner.phone) : '',
      commission_rate:
        partner?.commission_rate?.toString().replace('.', ',') ||
        partner?.pending_commission_rate?.toString().replace('.', ',') ||
        '',
      password: '',
      address_zip_code: partner?.address_zip_code ? formatCEP(partner.address_zip_code) : '',
      address_street: partner?.address_street || '',
      address_number: partner?.address_number || '',
      address_neighborhood: partner?.address_neighborhood || '',
      address_complement: partner?.address_complement || '',
      city: partner?.city || '',
      state: partner?.state?.toUpperCase() || '',
    },
  })

  const watchTaxId = form.watch('tax_id')
  useEffect(() => {
    const cleanCnpj = watchTaxId?.replace(/\D/g, '') || ''
    if (cleanCnpj.length === 14) {
      pb.collection('users')
        .getFirstListItem(`tax_id="${cleanCnpj}" && (role="pharmacy" || role="laboratory")`)
        .then((existing) => {
          if (existing && existing.id !== partner?.id) {
            setConflictPartner(existing)
            setConflictReason('tax_id')
          } else {
            if (conflictReason === 'tax_id') setConflictPartner(null)
          }
        })
        .catch(() => {
          if (conflictReason === 'tax_id') setConflictPartner(null)
        })
    } else {
      if (conflictReason === 'tax_id') setConflictPartner(null)
    }
  }, [watchTaxId, partner?.id])

  const watchEmail = form.watch('email')
  useEffect(() => {
    const email = watchEmail?.trim().toLowerCase() || ''
    if (email.includes('@') && email.includes('.')) {
      pb.collection('users')
        .getFirstListItem(`email="${email}"`)
        .then((existing) => {
          if (existing && existing.id !== partner?.id) {
            setConflictPartner(existing)
            setConflictReason('email')
          } else {
            if (conflictReason === 'email') setConflictPartner(null)
          }
        })
        .catch(() => {
          if (conflictReason === 'email') setConflictPartner(null)
        })
    } else {
      if (conflictReason === 'email') setConflictPartner(null)
    }
  }, [watchEmail, partner?.id])

  const watchCep = form.watch('address_zip_code')
  useEffect(() => {
    const cleanCep = watchCep?.replace(/\D/g, '') || ''
    if (cleanCep.length === 8) {
      setIsFetchingCep(true)
      fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
        .then((res) => res.json())
        .then((data) => {
          if (!data.erro) {
            form.setValue('address_street', data.logradouro || '', { shouldValidate: true })
            form.setValue('address_neighborhood', data.bairro || '', { shouldValidate: true })
            form.setValue('city', data.localidade || '', { shouldValidate: true })
            form.setValue('state', (data.uf || '').toUpperCase(), { shouldValidate: true })
          }
        })
        .catch(() => {})
        .finally(() => setIsFetchingCep(false))
    }
  }, [watchCep, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (conflictPartner && conflictPartner.id !== partner?.id) {
      toast.error(
        'Este CNPJ já está cadastrado no sistema. Verifique o aviso no topo do formulário.',
      )
      return
    }

    const rate = parseFloat(values.commission_rate.replace(',', '.'))
    if (isNaN(rate) || rate < 7.99 || rate > 13.89) {
      form.setError('commission_rate', { message: 'A taxa deve estar entre 7,99% e 13,89%' })
      return
    }

    if (!partner && !values.password) {
      form.setError('password', { message: 'Senha inicial é obrigatória' })
      return
    }
    if (values.password && values.password.length < 8) {
      form.setError('password', { message: 'Mínimo de 8 caracteres' })
      return
    }

    const cleanCnpj = values.tax_id.replace(/\D/g, '')
    if (cleanCnpj.length !== 14) {
      form.setError('tax_id', { message: 'CNPJ deve ter 14 dígitos' })
      return
    }

    setLoading(true)

    const submitData = new FormData()

    submitData.append('role', values.role)
    submitData.append('tax_id', cleanCnpj)
    submitData.append('name', values.name)
    submitData.append('business_name', values.business_name)
    submitData.append('email', values.email.trim().toLowerCase())
    submitData.append('phone', values.phone.replace(/\D/g, ''))

    submitData.append('address_zip_code', values.address_zip_code.replace(/\D/g, ''))
    submitData.append('address_street', values.address_street)
    submitData.append('address_number', values.address_number)
    submitData.append('address_neighborhood', values.address_neighborhood)
    if (values.address_complement)
      submitData.append('address_complement', values.address_complement)
    submitData.append('city', values.city)
    submitData.append('state', values.state.toUpperCase())

    if (!partner) {
      submitData.append('password', values.password!)
      submitData.append('passwordConfirm', values.password!)
      submitData.append('registration_status', 'pending')
    } else if (values.password) {
      submitData.append('password', values.password)
      submitData.append('passwordConfirm', values.password)
    }

    if (isMasterAdmin) {
      submitData.append('commission_rate', rate.toString())
      submitData.append('pending_commission_rate', '')
    } else {
      submitData.append('pending_commission_rate', rate.toString())
    }

    if (avatarFile) {
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
      form.reset()
      onSuccess()
    } catch (err: any) {
      const fieldErrors = extractFieldErrors(err)

      if (
        fieldErrors.tax_id?.toLowerCase().includes('unique') ||
        fieldErrors.tax_id?.includes('must be unique')
      ) {
        toast.error('Este CNPJ já está cadastrado no sistema.', {
          action: {
            label: 'Editar Parceiro Existente',
            onClick: () => {
              pb.collection('users')
                .getFirstListItem(`tax_id="${cleanCnpj}"`)
                .then((existing) => {
                  if (onConflict) onConflict(existing)
                })
                .catch(() => {})
            },
          },
          duration: 8000,
        })

        pb.collection('users')
          .getFirstListItem(`tax_id="${cleanCnpj}"`)
          .then((existing) => {
            if (existing && existing.id !== partner?.id) {
              setConflictPartner(existing)
              setConflictReason('tax_id')
            }
          })
          .catch(() => {})

        form.setError('tax_id', { message: 'CNPJ já cadastrado' })
      } else if (Object.keys(fieldErrors).length > 0) {
        Object.entries(fieldErrors).forEach(([key, msg]) => {
          form.setError(key as any, { message: msg })
        })
        toast.error('Erro ao salvar parceiro. Verifique os campos.')
      } else {
        toast.error(err.message || 'Erro inesperado ao salvar.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollArea className="max-h-[70vh] pr-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-2 px-1">
          {conflictPartner && conflictPartner.id !== partner?.id && (
            <Alert className="bg-amber-50 border-amber-200 mb-6 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800">
                {conflictReason === 'tax_id'
                  ? 'Este CNPJ já está cadastrado no sistema.'
                  : 'Conflito de Cadastro'}
              </AlertTitle>
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
                      if (onConflict) onConflict(conflictPartner)
                    }}
                  >
                    Editar Parceiro Existente
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Informações Principais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Tipo de Parceiro *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pharmacy">Farmácia / Drogaria</SelectItem>
                        <SelectItem value="laboratory">Laboratório / Clínica de Imagem</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tax_id"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>CNPJ *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onChange={(e) => field.onChange(formatCNPJ(e.target.value))}
                        placeholder="00.000.000/0000-00"
                        maxLength={18}
                        className={
                          conflictReason === 'tax_id' ? 'border-amber-500 bg-amber-50/50' : ''
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Fantasia *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: MaxFarma" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="business_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razão Social *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Simões e Silva Ltda" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2 md:col-span-2">
                <Label>Logomarca (Avatar)</Label>
                <div className="flex items-center gap-4">
                  {avatarPreview ? (
                    <Avatar className="h-16 w-16 border rounded-md shrink-0">
                      <AvatarImage src={avatarPreview} className="object-cover" />
                      <AvatarFallback>L</AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-16 w-16 border rounded-md shrink-0 bg-muted flex items-center justify-center">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setAvatarFile(file)
                          setAvatarPreview(URL.createObjectURL(file))
                        } else {
                          setAvatarFile(null)
                          setAvatarPreview(
                            partner?.avatar ? pb.files.getURL(partner, partner.avatar) : null,
                          )
                        }
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

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        className={
                          conflictReason === 'email' ? 'border-amber-500 bg-amber-50/50' : ''
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onChange={(e) => field.onChange(formatPhone(e.target.value))}
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="commission_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taxa de Comissão (%) *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.,]/g, '')
                          field.onChange(val)
                        }}
                        placeholder="Ex: 13,88"
                      />
                    </FormControl>
                    <p className="text-[10px] text-muted-foreground">
                      A taxa deve estar entre 7,99% e 13,89%
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>
                      {partner ? 'Nova Senha (deixe em branco para manter)' : 'Senha Inicial *'}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="text" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Localização & Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="address_zip_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP *</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          {...field}
                          onChange={(e) => field.onChange(formatCEP(e.target.value))}
                          placeholder="00000-000"
                          maxLength={9}
                          className={isFetchingCep ? 'pr-9' : ''}
                        />
                      </FormControl>
                      {isFetchingCep && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address_street"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Logradouro / Rua *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Rua das Flores" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: 123" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address_neighborhood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bairro *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address_complement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Complemento</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Sala 2, Loja B" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Cidade *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado (UF) *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase().slice(0, 2))}
                        placeholder="Ex: SP"
                        maxLength={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Button type="submit" className="w-full mt-4" disabled={loading || !!conflictPartner}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Salvando...' : partner ? 'Salvar Alterações' : 'Confirmar Cadastro'}
          </Button>
        </form>
      </Form>
    </ScrollArea>
  )
}
