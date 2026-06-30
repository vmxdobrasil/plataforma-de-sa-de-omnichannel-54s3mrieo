import { useEffect, useState } from 'react'
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
import { logAudit } from '@/services/clinic'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  staff?: any
  onSuccess: () => void
}

export function StaffFormDialog({ open, onOpenChange, staff, onSuccess }: Props) {
  const [values, setValues] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})

  useEffect(() => {
    if (open) {
      setValues(
        staff
          ? { ...staff }
          : { role: 'admin', work_shift: 'morning', registration_status: 'approved' },
      )
      setErrors({})
    }
  }, [staff, open])

  const handleChange = (k: string, v: any) => setValues((p) => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    setLoading(true)
    setErrors({})
    try {
      if (staff) {
        await pb.collection('users').update(staff.id, {
          name: values.name,
          work_shift: values.work_shift,
          phone: values.phone,
        })
        await logAudit('update', 'users', staff.id, { work_shift: values.work_shift })
        toast.success('Colaborador atualizado!')
      } else {
        const record = await pb.collection('users').create({
          ...values,
          email: values.email,
          password: values.password || 'Skip@Pass',
          passwordConfirm: values.password || 'Skip@Pass',
        })
        await logAudit('create', 'users', record.id, {
          role: values.role,
          work_shift: values.work_shift,
        })
        toast.success('Colaborador cadastrado!')
      }
      onOpenChange(false)
      onSuccess()
    } catch (e) {
      setErrors(extractFieldErrors(e))
      toast.error('Erro ao salvar colaborador.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{staff ? 'Editar Colaborador' : 'Novo Colaborador'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input
              value={values.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>
          {!staff && (
            <>
              <div className="space-y-2">
                <Label>E-mail *</Label>
                <Input
                  type="email"
                  value={values.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label>Senha (mín. 8 caracteres)</Label>
                <Input
                  type="text"
                  value={values.password || ''}
                  onChange={(e) => handleChange('password', e.target.value)}
                  minLength={8}
                  placeholder="Skip@Pass"
                />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input
              value={values.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Função *</Label>
            <Select
              value={values.role || 'admin'}
              onValueChange={(v) => handleChange('role', v)}
              disabled={!!staff}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="medical_director">Gerente / Diretor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Turno *</Label>
            <Select
              value={values.work_shift || 'morning'}
              onValueChange={(v) => handleChange('work_shift', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Manhã</SelectItem>
                <SelectItem value="afternoon">Tarde</SelectItem>
                <SelectItem value="night">Noite</SelectItem>
                <SelectItem value="business">Comercial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
