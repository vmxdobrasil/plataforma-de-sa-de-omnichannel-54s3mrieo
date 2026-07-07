import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
import { Loader2 } from 'lucide-react'

interface NewLeadDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSuccess: () => void
}

export function NewLeadDialog({ open, onOpenChange, onSuccess }: NewLeadDialogProps) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    tax_id: '',
    type: 'company',
    employee_count: '',
    benefit_intention: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await pb.collection('registration_leads').create({
        name: form.name,
        email: form.email,
        phone: form.phone,
        tax_id: form.tax_id,
        type: form.type,
        employee_count: form.employee_count ? parseInt(form.employee_count) : 0,
        benefit_intention: form.benefit_intention,
        status: 'pending',
      })
      toast.success('Lead criado com sucesso!')
      setForm({
        name: '',
        email: '',
        phone: '',
        tax_id: '',
        type: 'company',
        employee_count: '',
        benefit_intention: '',
      })
      onOpenChange(false)
      onSuccess()
    } catch {
      toast.error('Erro ao criar lead. Verifique os dados.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Novo Lead B2B</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white/70">Nome / Empresa *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/70">Email *</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-white/70">Telefone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">CPF/CNPJ</Label>
              <Input
                value={form.tax_id}
                onChange={(e) => setForm({ ...form, tax_id: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-white/70">Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">Empresa</SelectItem>
                  <SelectItem value="partner">Parceiro</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="professional">Profissional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Nº Funcionários</Label>
              <Input
                type="number"
                value={form.employee_count}
                onChange={(e) => setForm({ ...form, employee_count: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-white/70">Intenção de Benefício</Label>
            <Input
              value={form.benefit_intention}
              onChange={(e) => setForm({ ...form, benefit_intention: e.target.value })}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          <Button
            type="submit"
            disabled={saving}
            className="w-full bg-emerald-500 hover:bg-emerald-600 rounded-full"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar Lead'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
