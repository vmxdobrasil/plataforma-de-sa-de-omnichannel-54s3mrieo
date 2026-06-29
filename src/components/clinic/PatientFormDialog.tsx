import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PatientFields } from './PatientFields'
import { logAudit, validateCPF } from '@/services/clinic'
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'

interface PatientFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patient?: any
  onSuccess: () => void
}

export function PatientFormDialog({
  open,
  onOpenChange,
  patient,
  onSuccess,
}: PatientFormDialogProps) {
  const [values, setValues] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setValues(patient ? { ...patient } : { role: 'patient', registration_status: 'pending' })
    }
  }, [patient, open])

  const handleChange = (key: string, value: any) => setValues((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async () => {
    if (!values.name || !values.document_id) {
      toast.error('Preencha nome e CPF.')
      return
    }
    if (!validateCPF(values.document_id)) {
      toast.error('CPF inválido.')
      return
    }
    setLoading(true)
    try {
      if (patient) {
        await pb.collection('users').update(patient.id, values)
        await logAudit('update', 'users', patient.id, values)
        toast.success('Paciente atualizado!')
      } else {
        const email = values.email || `${values.document_id}@temp.clinic`
        const record = await pb.collection('users').create({
          ...values,
          email,
          password: 'Skip@Pass',
          passwordConfirm: 'Skip@Pass',
        })
        await logAudit('create', 'users', record.id, values)
        toast.success('Paciente cadastrado!')
      }
      onOpenChange(false)
      onSuccess()
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao salvar paciente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{patient ? 'Editar Paciente' : 'Novo Paciente'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <PatientFields values={values} onChange={handleChange} showEmail={!patient} />
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
