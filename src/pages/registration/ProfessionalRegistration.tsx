import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Stethoscope,
  User,
  Mail,
  Phone,
  CreditCard,
} from 'lucide-react'
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
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import pb from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import defaultLogo from '@/assets/1002440441png1782862869065-a785f.png'

const CATEGORIES = [
  { value: 'Médico', label: 'Médico', idLabel: 'CRM' },
  { value: 'Odontólogo', label: 'Odontólogo', idLabel: 'CRO' },
  { value: 'Fisioterapeuta', label: 'Fisioterapeuta', idLabel: 'CREFITO' },
  { value: 'Nutricionista', label: 'Nutricionista', idLabel: 'CRN' },
  { value: 'Outros', label: 'Outros', idLabel: 'Registro Profissional' },
]

export default function ProfessionalRegistration() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [specialties, setSpecialties] = useState<any[]>([])
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    tax_id: '',
    category: '',
    professional_id: '',
    specialty: '',
  })

  useEffect(() => {
    pb.collection('medical_specialties')
      .getFullList({ sort: 'name' })
      .then(setSpecialties)
      .catch(console.error)
  }, [])

  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }))
  const idLabel =
    CATEGORIES.find((c) => c.value === form.category)?.idLabel || 'Registro Profissional'
  const canProceed =
    step === 1
      ? !!(form.name && form.email && form.phone && form.tax_id)
      : !!(form.category && form.professional_id && form.specialty)

  const submit = async () => {
    setLoading(true)
    try {
      await pb.collection('registration_leads').create({
        name: form.name,
        email: form.email,
        phone: form.phone,
        tax_id: form.tax_id,
        type: 'professional',
        status: 'pending',
        metadata: {
          category: form.category,
          specialty: form.specialty,
          professional_id: form.professional_id,
        },
      })
      setSuccess(true)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500 mx-auto flex items-center justify-center mb-4">
            <Check className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Cadastro enviado!</h2>
          <p className="text-muted-foreground mb-6">
            Recebemos seu registro. Nossa equipe entrará em contato em breve.
          </p>
          <Button
            onClick={() => navigate('/login')}
            className="w-full bg-primary hover:bg-primary/90"
          >
            Ir para o Login
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            to="/register"
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Voltar</span>
          </Link>
          <img src={defaultLogo} alt="V MED Brasil" className="h-10 sm:h-12 object-contain" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
            <Stethoscope className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Cadastro de Profissional de Saúde
          </h1>
          <p className="text-muted-foreground mt-2">Participe da rede V MED Brasil</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
              >
                {step > s ? <Check className="h-4 w-4" /> : s}
              </div>
              <span
                className={`text-xs sm:text-sm font-medium ${step >= s ? 'text-primary' : 'text-muted-foreground'}`}
              >
                {s === 1 ? 'Dados Pessoais' : 'Dados Profissionais'}
              </span>
              {s < 2 && (
                <div className={`w-8 sm:w-16 h-0.5 ${step > s ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>

        <Card className="shadow-lg border-border/50">
          <CardContent className="p-6 sm:p-8 space-y-4">
            {step === 1 && (
              <>
                <div>
                  <Label htmlFor="name">Nome Completo *</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      className="pl-9"
                      value={form.name}
                      onChange={(e) => update('name', e.target.value)}
                      placeholder="Seu nome completo"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">E-mail Profissional *</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      className="pl-9"
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                      placeholder="voce@exemplo.com"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Telefone / WhatsApp *</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      className="pl-9"
                      value={form.phone}
                      onChange={(e) => update('phone', e.target.value)}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="tax_id">CPF *</Label>
                  <div className="relative mt-1">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="tax_id"
                      className="pl-9"
                      value={form.tax_id}
                      onChange={(e) => update('tax_id', e.target.value)}
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>
                <Button
                  onClick={() => setStep(2)}
                  disabled={!canProceed}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Próximo <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </>
            )}
            {step === 2 && (
              <>
                <div>
                  <Label>Categoria Profissional *</Label>
                  <Select value={form.category} onValueChange={(v) => update('category', v)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione sua categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="prof_id">{idLabel} *</Label>
                  <Input
                    id="prof_id"
                    className="mt-1"
                    value={form.professional_id}
                    onChange={(e) => update('professional_id', e.target.value)}
                    placeholder={`Ex: ${idLabel}-SP 12345`}
                  />
                </div>
                <div>
                  <Label>Especialidade *</Label>
                  <Select value={form.specialty} onValueChange={(v) => update('specialty', v)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione sua especialidade" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {specialties.map((s) => (
                        <SelectItem key={s.id} value={s.name}>
                          {s.name}
                          {s.category ? ` (${s.category})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
                  </Button>
                  <Button
                    onClick={submit}
                    disabled={!canProceed || loading}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    {loading ? 'Enviando...' : 'Enviar Cadastro'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
