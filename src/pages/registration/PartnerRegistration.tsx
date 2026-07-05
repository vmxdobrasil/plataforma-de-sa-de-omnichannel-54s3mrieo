import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Pill, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { createLead } from '@/services/registration-leads'
import defaultLogo from '@/assets/1002440441png1782862869065-a785f.png'

const formatCNPJ = (v: string) =>
  v
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 18)

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

export default function PartnerRegistration() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [partnerType, setPartnerType] = useState<'pharmacy' | 'laboratory'>('pharmacy')
  const [form, setForm] = useState({
    name: '',
    business_name: '',
    tax_id: '',
    email: '',
    phone: '',
    tech_contact_name: '',
    tech_contact_phone: '',
    tech_contact_email: '',
    city: '',
    state: '',
  })

  const handleSubmit = async () => {
    if (!form.business_name || !form.tax_id || !form.email) {
      toast.error('Preencha os campos obrigatórios.')
      return
    }
    const cleanCnpj = form.tax_id.replace(/\D/g, '')
    if (cleanCnpj.length !== 14) {
      toast.error('CNPJ inválido. Deve conter 14 dígitos.')
      return
    }

    setLoading(true)
    try {
      await createLead({
        name: form.business_name,
        email: form.email,
        phone: form.phone,
        tax_id: cleanCnpj,
        type: 'partner',
        metadata: {
          partner_type: partnerType,
          fantasy_name: form.name,
          tech_contact: {
            name: form.tech_contact_name,
            phone: form.tech_contact_phone,
            email: form.tech_contact_email,
          },
          city: form.city,
          state: form.state,
        },
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
      <div className="max-w-2xl mx-auto">
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
                <Pill className="h-6 w-6" />
              </div>
              Cadastro de Parceiro
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-2">
              <Label className="text-blue-900 font-semibold">Tipo de Parceiro *</Label>
              <Select
                value={partnerType}
                onValueChange={(v) => setPartnerType(v as 'pharmacy' | 'laboratory')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pharmacy">Farmácia / Drogaria</SelectItem>
                  <SelectItem value="laboratory">Laboratório / Clínica de Imagem</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-blue-900 font-semibold">Nome Fantasia</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: MaxFarma"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-blue-900 font-semibold">Razão Social *</Label>
                <Input
                  value={form.business_name}
                  onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                  placeholder="Ex: Simões e Silva Ltda"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-blue-900 font-semibold">CNPJ *</Label>
                <Input
                  value={form.tax_id}
                  onChange={(e) => setForm({ ...form, tax_id: formatCNPJ(e.target.value) })}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-blue-900 font-semibold">E-mail *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="contato@parceiro.com.br"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-blue-900 font-semibold">Telefone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-blue-900 font-semibold">Cidade</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Ex: São Paulo"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold text-blue-900 mb-3">Contato Técnico</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Nome</Label>
                  <Input
                    value={form.tech_contact_name}
                    onChange={(e) => setForm({ ...form, tech_contact_name: e.target.value })}
                    placeholder="João Silva"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Telefone</Label>
                  <Input
                    value={form.tech_contact_phone}
                    onChange={(e) =>
                      setForm({ ...form, tech_contact_phone: formatPhone(e.target.value) })
                    }
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">E-mail</Label>
                  <Input
                    type="email"
                    value={form.tech_contact_email}
                    onChange={(e) => setForm({ ...form, tech_contact_email: e.target.value })}
                    placeholder="ti@parceiro.com.br"
                  />
                </div>
              </div>
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
