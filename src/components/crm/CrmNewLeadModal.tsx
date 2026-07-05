import { useState } from 'react'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { createCrmLead } from '@/services/crm'
import { toast } from 'sonner'

interface CrmNewLeadModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CrmNewLeadModal({ open, onClose, onSuccess }: CrmNewLeadModalProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    contact: '',
    phone: '',
    email: '',
    segment: '',
    size: '',
    source: '',
  })

  const handleSubmit = async () => {
    if (!form.name || !form.email) {
      toast.error('Preencha empresa e email.')
      return
    }
    setLoading(true)
    try {
      await createCrmLead({
        name: form.name,
        email: form.email,
        phone: form.phone,
        type: 'company',
        status: 'pending',
        employee_count: form.size ? parseInt(form.size) : undefined,
        benefit_intention: form.segment,
        metadata: { segment: form.segment, source: form.source, contact_name: form.contact },
      })
      onSuccess()
      onClose()
      setForm({ name: '', contact: '', phone: '', email: '', segment: '', size: '', source: '' })
    } catch {
      toast.error('Erro ao criar lead. Verifique os dados.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="glass-card border-white/20 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Novo Lead B2B</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Empresa *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-xl bg-white/40 dark:bg-white/5"
              placeholder="Nome da empresa"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Contato</Label>
            <Input
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
              className="rounded-xl bg-white/40 dark:bg-white/5"
              placeholder="Nome do contato"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Telefone</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="rounded-xl bg-white/40 dark:bg-white/5"
              placeholder="(00) 0000-0000"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Email *</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="rounded-xl bg-white/40 dark:bg-white/5"
              placeholder="email@empresa.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Segmento</Label>
            <Input
              value={form.segment}
              onChange={(e) => setForm({ ...form, segment: e.target.value })}
              className="rounded-xl bg-white/40 dark:bg-white/5"
              placeholder="Ex: Tecnologia"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Tamanho</Label>
            <Input
              type="number"
              value={form.size}
              onChange={(e) => setForm({ ...form, size: e.target.value })}
              className="rounded-xl bg-white/40 dark:bg-white/5"
              placeholder="Nº funcionários"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Origem</Label>
            <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
              <SelectTrigger className="rounded-xl bg-white/40 dark:bg-white/5">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Website">Website</SelectItem>
                <SelectItem value="Indicação">Indicação</SelectItem>
                <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                <SelectItem value="Evento">Evento</SelectItem>
                <SelectItem value="Campanha">Campanha</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-xl bg-brand-gradient"
          >
            {loading ? 'Salvando...' : 'Criar Lead'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
