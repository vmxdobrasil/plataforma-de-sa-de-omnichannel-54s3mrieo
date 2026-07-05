import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, HeartPulse, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { createLead } from '@/services/registration-leads'
import { validateCPF } from '@/services/clinic'
import defaultLogo from '@/assets/1002440441png1782862869065-a785f.png'

const formatCPF = (v: string) =>
  v
    .replace(/\D/g, '')
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2')
    .slice(0, 14)

const formatPhone = (v: string) => {
  const d = v.replace(/\D/g, '')
  if (d.length <= 10)
    return d
      .replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3')
      .trim()
      .replace(/-$/, '')
  return d
    .replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3')
    .trim()
    .replace(/-$/, '')
}

export default function IndividualRegistration() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    tax_id: '',
    email: '',
    phone: '',
  })

  const handleSubmit = async () => {
    if (!form.name || !form.tax_id || !form.email) {
      toast.error('Preencha os campos obrigatórios.')
      return
    }
    const cleanCpf = form.tax_id.replace(/\D/g, '')
    if (!validateCPF(cleanCpf)) {
      toast.error('CPF inválido.')
      return
    }

    setLoading(true)
    try {
      await createLead({
        name: form.name,
        email: form.email,
        phone: form.phone,
        tax_id: cleanCpf,
        type: 'individual',
      })
      toast.success('Cadastro enviado com sucesso! Em breve entraremos em contato.')
      navigate('/register')
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao enviar cadastro.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 py-8 px-4">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <img src={defaultLogo} alt="V MED BRASIL" className="h-10 w-auto object-contain" />
          <Button
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10 hover:text-white"
            onClick={() => navigate('/register')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </div>

        <Card className="shadow-2xl border-blue-200">
          <CardHeader className="bg-blue-900 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="bg-white/15 p-2 rounded-lg">
                <HeartPulse className="h-6 w-6" />
              </div>
              Cadastro Individual
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-2">
              <Label className="text-blue-900 font-semibold">Nome Completo *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="João da Silva"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-blue-900 font-semibold">CPF *</Label>
              <Input
                value={form.tax_id}
                onChange={(e) => setForm({ ...form, tax_id: formatCPF(e.target.value) })}
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-blue-900 font-semibold">E-mail *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="seu@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-blue-900 font-semibold">Telefone / WhatsApp</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>

            <Button
              className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-full h-12"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...
                </>
              ) : (
                'Enviar Cadastro'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
