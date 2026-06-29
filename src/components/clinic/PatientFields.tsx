import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface PatientFieldsProps {
  values: Record<string, any>
  onChange: (key: string, value: any) => void
  showEmail?: boolean
  showPassword?: boolean
}

export function PatientFields({ values, onChange, showEmail, showPassword }: PatientFieldsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2 md:col-span-2">
        <Label>Nome Completo *</Label>
        <Input
          value={values.name || ''}
          onChange={(e) => onChange('name', e.target.value)}
          required
        />
      </div>
      {showEmail && (
        <div className="space-y-2">
          <Label>E-mail *</Label>
          <Input
            type="email"
            value={values.email || ''}
            onChange={(e) => onChange('email', e.target.value)}
            required
          />
        </div>
      )}
      {showPassword && (
        <div className="space-y-2">
          <Label>Senha *</Label>
          <Input
            type="password"
            value={values.password || ''}
            onChange={(e) => onChange('password', e.target.value)}
            required
            minLength={8}
          />
        </div>
      )}
      <div className="space-y-2">
        <Label>CPF *</Label>
        <Input
          value={values.document_id || ''}
          onChange={(e) => onChange('document_id', e.target.value)}
          placeholder="000.000.000-00"
          required
        />
      </div>
      <div className="space-y-2">
        <Label>RG</Label>
        <Input value={values.rg || ''} onChange={(e) => onChange('rg', e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Data de Nascimento</Label>
        <Input
          type="date"
          value={values.date_of_birth || ''}
          onChange={(e) => onChange('date_of_birth', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Gênero</Label>
        <Select value={values.gender || ''} onValueChange={(v) => onChange('gender', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">Masculino</SelectItem>
            <SelectItem value="female">Feminino</SelectItem>
            <SelectItem value="other">Outro</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Telefone *</Label>
        <Input
          value={values.phone || ''}
          onChange={(e) => onChange('phone', e.target.value)}
          placeholder="(00) 00000-0000"
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Tipo Sanguíneo</Label>
        <Select value={values.blood_type || ''} onValueChange={(v) => onChange('blood_type', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>CEP</Label>
        <Input
          value={values.address_zip_code || ''}
          onChange={(e) => onChange('address_zip_code', e.target.value)}
          placeholder="00000-000"
        />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>Rua / Logradouro</Label>
        <Input
          value={values.address_street || ''}
          onChange={(e) => onChange('address_street', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Número</Label>
        <Input
          value={values.address_number || ''}
          onChange={(e) => onChange('address_number', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Bairro</Label>
        <Input
          value={values.address_neighborhood || ''}
          onChange={(e) => onChange('address_neighborhood', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Cidade</Label>
        <Input value={values.city || ''} onChange={(e) => onChange('city', e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Estado (UF)</Label>
        <Input
          value={values.state || ''}
          onChange={(e) => onChange('state', e.target.value)}
          maxLength={2}
        />
      </div>
      <div className="space-y-2">
        <Label>Contato de Emergência</Label>
        <Input
          value={values.emergency_contact_name || ''}
          onChange={(e) => onChange('emergency_contact_name', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Telefone de Emergência</Label>
        <Input
          value={values.emergency_contact_phone || ''}
          onChange={(e) => onChange('emergency_contact_phone', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Alergias</Label>
        <Input
          value={values.allergies || ''}
          onChange={(e) => onChange('allergies', e.target.value)}
          placeholder="Penicilina, Dipirona..."
        />
      </div>
      <div className="space-y-2">
        <Label>Medicamentos Contínuos</Label>
        <Input
          value={values.continuous_medications || ''}
          onChange={(e) => onChange('continuous_medications', e.target.value)}
          placeholder="Losartana 50mg..."
        />
      </div>
      <div className="space-y-2">
        <Label>Forma de Pagamento</Label>
        <Select
          value={values.payment_method || ''}
          onValueChange={(v) => onChange('payment_method', v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="private">Particular</SelectItem>
            <SelectItem value="corporate">Corporativo</SelectItem>
            <SelectItem value="pix">PIX</SelectItem>
            <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
            <SelectItem value="cash">Dinheiro</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
