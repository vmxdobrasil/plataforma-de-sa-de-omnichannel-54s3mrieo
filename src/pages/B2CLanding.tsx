import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  HeartPulse,
  Users,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Plus,
  X,
  Gift,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import pb from '@/lib/pocketbase/client'
import { validateReferralCode, trackVisit } from '@/services/campaigns'
import { validateCPF } from '@/services/clinic'

export default function B2CLanding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [plan, setPlan] = useState<'individual' | 'family'>('individual')
  const [form, setForm] = useState({
    name: '',
    document_id: '',
    email: '',
    phone: '',
    password: '',
  })
  const [dependents, setDependents] = useState<any[]>([])
  const [depForm, setDepForm] = useState({
    name: '',
    document_id: '',
    date_of_birth: '',
    kinship: '',
  })
  const [lgpd, setLgpd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [referrerId, setReferrerId] = useState('')
  const [utm, setUtm] = useState({ source: '', medium: '', campaign: '' })

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const source = p.get('utm_source') || p.get('origem') || ''
    const medium = p.get('utm_medium') || ''
    const campaign = p.get('utm_campaign') || ''
    const ref = p.get('ref') || ''
    setUtm({ source, medium, campaign })
    trackVisit({
      utm_source: source,
      utm_medium: medium,
      utm_campaign: campaign,
      referral_code: ref,
    }).catch(() => {})
    if (ref) {
      validateReferralCode(ref)
        .then((res: any) => {
          if (res.valid) setReferrerId(res.referrer_id)
        })
        .catch(() => {})
    }
  }, [])

  const addDependent = () => {
    if (!depForm.name) {
      toast.error('Nome do dependente é obrigatório.')
      return
    }
    setDependents([...dependents, { ...depForm }])
    setDepForm({ name: '', document_id: '', date_of_birth: '', kinship: '' })
  }

  const handleSubmit = async () => {
    if (!form.name || !form.document_id || !form.email || !form.phone || !form.password) {
      toast.error('Preencha todos os campos.')
      return
    }
    if (!validateCPF(form.document_id)) {
      toast.error('CPF inválido.')
      return
    }
    if (!lgpd) {
      toast.error('Aceite os termos para continuar.')
      return
    }
    if (form.password.length < 8) {
      toast.error('A senha deve ter no mínimo 8 caracteres.')
      return
    }
    setLoading(true)
    try {
      const record = await pb.collection('users').create({
        ...form,
        passwordConfirm: form.password,
        role: 'patient',
        origin_type: 'b2c',
        utm_source: utm.source,
        utm_medium: utm.medium,
        utm_campaign: utm.campaign,
        registration_status: 'approved',
        referred_by: referrerId || undefined,
      })
      for (const dep of dependents) {
        await pb.collection('users').create({
          name: dep.name,
          email: `${dep.document_id || Date.now() + Math.random()}@temp.vmed.com.br`,
          password: 'Skip@Pass',
          passwordConfirm: 'Skip@Pass',
          role: 'patient',
          parent_id: record.id,
          is_dependent: true,
          document_id: dep.document_id || '',
          date_of_birth: dep.date_of_birth || '',
          kinship: dep.kinship || '',
          origin_type: 'b2c',
          registration_status: 'approved',
        })
      }
      toast.success('Conta criada! Faça login para acessar a plataforma.')
      navigate('/login')
    } catch (err: any) {
      const msg =
        err?.response?.data?.document_id?.message || err?.message || 'Erro ao criar conta.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const steps = ['Plano', 'Dados', 'Dependentes', 'Pronto']
  const canNext =
    step === 0 ||
    (step === 1 &&
      form.name &&
      form.document_id &&
      form.email &&
      form.phone &&
      form.password &&
      lgpd)

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-muted/30 flex flex-col">
      <header className="p-6 text-center">
        <h1 className="text-2xl font-bold ds-gradient-text">V MED Brasil</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Saúde e bem-estar para você e sua família
        </p>
      </header>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex justify-between mb-8">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                >
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className={`h-0.5 w-8 ${i < step ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>

          {step === 0 && (
            <div className="space-y-4 animate-fade-in-up">
              <h2 className="text-xl font-bold text-center">Escolha seu plano</h2>
              <button
                onClick={() => {
                  setPlan('individual')
                  setStep(1)
                }}
                className="w-full p-6 border-2 rounded-2xl hover:border-primary hover:scale-[1.02] transition-all text-left"
              >
                <HeartPulse className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-bold text-lg">Plano Individual</h3>
                <p className="text-sm text-muted-foreground">
                  Acesso a consultas, exames e farmácia para você.
                </p>
              </button>
              <button
                onClick={() => {
                  setPlan('family')
                  setStep(1)
                }}
                className="w-full p-6 border-2 rounded-2xl hover:border-primary hover:scale-[1.02] transition-all text-left"
              >
                <Users className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-bold text-lg">Plano Família</h3>
                <p className="text-sm text-muted-foreground">
                  Inclua dependentes e cuide de toda a família.
                </p>
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 animate-fade-in-up">
              <h2 className="text-xl font-bold">Seus dados</h2>
              <div className="space-y-2">
                <Label>Nome Completo *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="João Silva"
                />
              </div>
              <div className="space-y-2">
                <Label>CPF *</Label>
                <Input
                  value={form.document_id}
                  onChange={(e) => setForm({ ...form, document_id: e.target.value })}
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="space-y-2">
                <Label>E-mail *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="seu@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp *</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label>Senha (mín. 8 caracteres) *</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              <div className="flex items-start gap-2">
                <Checkbox checked={lgpd} onCheckedChange={(v) => setLgpd(v === true)} id="lgpd" />
                <Label htmlFor="lgpd" className="text-xs leading-relaxed">
                  Li e aceito os{' '}
                  <a href="#" className="text-primary underline">
                    Termos de Uso
                  </a>{' '}
                  e a{' '}
                  <a href="#" className="text-primary underline">
                    Política de Privacidade
                  </a>{' '}
                  (LGPD).
                </Label>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="rounded-full h-12 ds-tap-target"
                  onClick={() => setStep(0)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button
                  className="flex-1 rounded-full h-12 ds-tap-target bg-cta hover:bg-cta/90 text-white"
                  onClick={() => setStep(plan === 'family' ? 2 : 3)}
                  disabled={!canNext}
                >
                  Continuar <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in-up">
              <h2 className="text-xl font-bold">Adicionar dependentes</h2>
              {dependents.map((d, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-sm">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.kinship || 'Parentesco'}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDependents(dependents.filter((_, idx) => idx !== i))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="space-y-3 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    value={depForm.name}
                    onChange={(e) => setDepForm({ ...depForm, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>CPF (opcional)</Label>
                    <Input
                      value={depForm.document_id}
                      onChange={(e) => setDepForm({ ...depForm, document_id: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nascimento</Label>
                    <Input
                      type="date"
                      value={depForm.date_of_birth}
                      onChange={(e) => setDepForm({ ...depForm, date_of_birth: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Parentesco</Label>
                  <Select
                    value={depForm.kinship}
                    onValueChange={(v) => setDepForm({ ...depForm, kinship: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spouse">Cônjuge</SelectItem>
                      <SelectItem value="child">Filho(a)</SelectItem>
                      <SelectItem value="parent">Pai/Mãe</SelectItem>
                      <SelectItem value="sibling">Irmão(ã)</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  className="w-full rounded-full h-12 ds-tap-target border-2 border-primary text-primary hover:bg-primary/5"
                  onClick={addDependent}
                >
                  <Plus className="mr-2 h-4 w-4" /> Adicionar
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="rounded-full h-12 ds-tap-target"
                  onClick={() => setStep(1)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button
                  className="flex-1 rounded-full h-12 ds-tap-target bg-cta hover:bg-cta/90 text-white"
                  onClick={() => setStep(3)}
                >
                  Finalizar <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 text-center animate-fade-in-up">
              <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <Check className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Tudo pronto!</h2>
              <div className="text-left p-4 bg-muted/50 rounded-lg space-y-1">
                <p>
                  <strong>Plano:</strong> {plan === 'individual' ? 'Individual' : 'Família'}
                </p>
                <p>
                  <strong>Nome:</strong> {form.name}
                </p>
                <p>
                  <strong>E-mail:</strong> {form.email}
                </p>
                {dependents.length > 0 && (
                  <p>
                    <strong>Dependentes:</strong> {dependents.length}
                  </p>
                )}
              </div>
              {referrerId && (
                <p className="text-sm text-primary flex items-center justify-center gap-1">
                  <Gift className="h-4 w-4" /> Cadastrado via indicação!
                </p>
              )}
              <Button
                className="w-full rounded-full h-12 ds-tap-target bg-cta hover:bg-cta/90 text-white"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando...
                  </>
                ) : (
                  'Criar Conta Gratuita'
                )}
              </Button>
              <Button
                variant="ghost"
                className="rounded-full h-12 ds-tap-target"
                onClick={() => setStep(plan === 'family' ? 2 : 1)}
              >
                Voltar
              </Button>
            </div>
          )}
        </div>
      </div>
      <footer className="p-4 text-center text-xs text-muted-foreground">V MED Brasil © 2026</footer>
    </div>
  )
}
