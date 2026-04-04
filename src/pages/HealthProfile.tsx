import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { getPatientPrescriptions } from '@/services/prescriptions'
import { Pill, FileText, ShoppingBag } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import pb from '@/lib/pocketbase/client'

export default function HealthProfile() {
  const { user } = useAuth()
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null)
  const [isDeductionOpen, setIsDeductionOpen] = useState(false)
  const [deductionAmount, setDeductionAmount] = useState('')
  const [records, setRecords] = useState<any[]>([])

  const loadData = async () => {
    if (!user?.id) return
    try {
      const pxs = await getPatientPrescriptions(user.id)
      setPrescriptions(pxs)

      const recs = await pb.collection('health_records').getFullList({
        filter: `patient_id = "${user.id}"`,
        sort: '-created',
        expand: 'professional_id',
      })
      setRecords(recs)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [user?.id])

  useRealtime('prescriptions', loadData)
  useRealtime('health_records', loadData)
  useRealtime('users', loadData)

  const handleRequestDeduction = async () => {
    if (!selectedPrescription || !user) return
    const amount = parseFloat(deductionAmount)

    if (isNaN(amount) || amount <= 0) {
      toast.error('Valor inválido.')
      return
    }

    try {
      let employeeRecord = await pb.collection('users').getOne(user.id)
      if (employeeRecord.parent_id) {
        employeeRecord = await pb.collection('users').getOne(employeeRecord.parent_id)
      }

      const employeeId = employeeRecord.id
      const companyId = employeeRecord.company_id
      const currentAllowance = employeeRecord.medication_allowance || 0

      if (!companyId) {
        toast.error('Usuário não vinculado a uma empresa.')
        return
      }

      if (currentAllowance < amount) {
        toast.error('Saldo de farmácia insuficiente.')
        return
      }

      await pb.collection('benefit_transactions').create({
        employee_id: employeeId,
        company_id: companyId,
        amount: amount,
        type: 'debit',
        category: 'medication',
      })

      await pb.collection('users').update(employeeId, {
        medication_allowance: currentAllowance - amount,
      })

      toast.success('Pagamento via crédito realizado com sucesso!')
      setIsDeductionOpen(false)
      setDeductionAmount('')
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao processar o pagamento.')
    }
  }

  return (
    <div className="space-y-8 pb-10 animate-fade-in-up">
      <h1 className="text-3xl font-bold flex items-center gap-3">
        <FileText className="h-8 w-8 text-primary" /> Perfil de Saúde
      </h1>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-primary" /> Minhas Receitas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {prescriptions.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhuma receita encontrada.</p>
            ) : (
              prescriptions.map((px) => (
                <div key={px.id} className="border p-4 rounded-lg space-y-2 relative group">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-sm">
                        Dr(a). {px.expand?.professional_id?.name || 'Profissional'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(px.created), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm whitespace-pre-wrap mt-2 bg-muted/50 p-2 rounded">
                    {px.medications}
                  </p>
                  {px.pharmacy_instructions && (
                    <p className="text-xs text-muted-foreground mt-2 border-l-2 border-primary pl-2">
                      {px.pharmacy_instructions}
                    </p>
                  )}
                  {(user?.company_id || user?.parent_id) && (
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-teal-600 border-teal-200 hover:bg-teal-50"
                        onClick={() => {
                          setSelectedPrescription(px)
                          setIsDeductionOpen(true)
                        }}
                      >
                        <ShoppingBag className="mr-2 h-4 w-4" /> Solicitar Reembolso/Pagamento via
                        Crédito
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Prontuário Clínico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {records.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum registro encontrado.</p>
            ) : (
              records.map((rec) => (
                <div key={rec.id} className="border p-4 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <Badge variant="outline">{rec.type}</Badge>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(rec.created), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                  <p className="text-sm">{rec.content}</p>
                  <p className="text-xs text-muted-foreground text-right">
                    Por {rec.expand?.professional_id?.name}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDeductionOpen} onOpenChange={setIsDeductionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Pagamento via Crédito</DialogTitle>
            <DialogDescription>
              Use seu saldo de farmácia corporativo para abater o valor desta compra.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-4">
            <div className="space-y-2">
              <Label>Valor da Compra (R$)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={deductionAmount}
                onChange={(e) => setDeductionAmount(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
              Lembre-se: O valor será descontado do seu saldo de farmácia ou do titular do
              benefício.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeductionOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRequestDeduction}>Confirmar Pagamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
