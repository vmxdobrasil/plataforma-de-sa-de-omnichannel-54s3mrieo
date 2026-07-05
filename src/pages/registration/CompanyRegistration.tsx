import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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

export default function CompanyRegistration() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    tax_id: '',
    email: '',
    phone: '',
    employee_count: '',
  })
  const [benefits, setBenefits] = useState({ health: false, pharmacy: false })

  const handleSubmit = async () => {
    if (!form.name || !form.tax_id || !form.email) {
      toast.error('Preencha os campos obrigatórios.')
      return
    }
    const cleanCnpj = form.tax_id.replace(/\D/g, '')
    if (cleanCnpj.length !== 14) {
      toast.error('CNPJ inválido. Deve conter 14 dígitos.')
      return
    }
    if (!benefits.health && !benefits.pharmacy) {
      toast.error('Selecione ao menos uma intenção de benefício.')
      return
    }

    setLoading(true)
    try {
      const intention = [benefits.health ? 'Saúde' : '', benefits.pharmacy ? 'Farmácia' : '']
        .filter(Boolean)
        .join(' + ')

      await createLead({
        name: form.name,
        email: form.email,
        phone: form.phone,
        tax_id: cleanCnpj,
        type: 'company',
        employee_count: Number(form.employee_count) || 0,
        benefit_intention: intention,
        metadata: { benefits },
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
                <Building2 className="h-6 w-6" />
              </div>
              Cadastro de Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label className="text-blue-900 font-semibold">
                  Razão Social / Nome da Empresa *
                </Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Empresa Exemplo Ltda"
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
                <Label className="text-blue-900 font-semibold">Número de Funcionários</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.employee_count}
                  onChange={(e) => setForm({ ...form, employee_count: e.target.value })}
                  placeholder="Ex: 50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-blue-900 font-semibold">E-mail Corporativo *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="contato@empresa.com.br"
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
            </div>

            <div className="space-y-3">
              <Label className="text-blue-900 font-semibold">Intenção de Benefício *</Label>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="health"
                    checked={benefits.health}
                    onCheckedChange={(v) => setBenefits({ ...benefits, health: v === true })}
                  />
                  <Label htmlFor="health" className="text-sm cursor-pointer">
                    Saúde
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="pharmacy"
                    checked={benefits.pharmacy}
                    onCheckedChange={(v) => setBenefits({ ...benefits, pharmacy: v === true })}
                  />
                  <Label htmlFor="pharmacy" className="text-sm cursor-pointer">
                    Farmácia
                  </Label>
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
