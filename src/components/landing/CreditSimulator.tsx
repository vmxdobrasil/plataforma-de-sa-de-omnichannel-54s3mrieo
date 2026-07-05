import { useState, useMemo } from 'react'
import { Pill, Stethoscope, Sparkles } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export interface SimulationData {
  salary: number
  consultationCredit: number
  pharmacyCredit: number
}

const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export function CreditSimulator({ onSimulate }: { onSimulate: (data: SimulationData) => void }) {
  const [salaryStr, setSalaryStr] = useState('')
  const [result, setResult] = useState<SimulationData | null>(null)

  const parsedSalary = useMemo(() => {
    const digits = salaryStr.replace(/\D/g, '')
    return digits ? parseInt(digits, 10) / 100 : 0
  }, [salaryStr])

  const formatSalary = (v: string) => {
    const digits = v.replace(/\D/g, '')
    const num = parseInt(digits, 10) / 100
    return isNaN(num) || num === 0 ? '' : fmtBRL(num)
  }

  const handleSimulate = () => {
    const data: SimulationData = {
      salary: parsedSalary,
      consultationCredit: Math.min(parsedSalary * 0.2, 800),
      pharmacyCredit: Math.min(parsedSalary * 0.15, 500),
    }
    setResult(data)
    onSimulate(data)
  }

  return (
    <Card className="border-2 border-emerald-200 shadow-xl bg-white">
      <CardContent className="p-6 space-y-4">
        <div className="text-center">
          <h3 className="text-xl font-bold text-emerald-700">Simule seu Limite</h3>
          <p className="text-sm text-muted-foreground">
            Descubra quanto crédito você tem disponível
          </p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Salário aproximado</label>
          <Input
            value={salaryStr}
            onChange={(e) => setSalaryStr(formatSalary(e.target.value))}
            placeholder="R$ 0,00"
            className="text-lg h-12 border-emerald-200 focus-visible:ring-emerald-500"
            inputMode="numeric"
          />
        </div>
        <Button
          className="w-full h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md"
          onClick={handleSimulate}
          disabled={parsedSalary < 1}
        >
          <Sparkles className="mr-2 h-4 w-4" /> Calcular meu limite
        </Button>
        {result && (
          <div className="grid grid-cols-2 gap-3 animate-fade-in-up">
            <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-200">
              <Stethoscope className="h-6 w-6 text-emerald-600 mx-auto mb-1" />
              <p className="text-xs text-emerald-700 font-medium">Consultas</p>
              <p className="text-lg font-bold text-emerald-800">
                {fmtBRL(result.consultationCredit)}
              </p>
            </div>
            <div className="bg-teal-50 rounded-xl p-4 text-center border border-teal-200">
              <Pill className="h-6 w-6 text-teal-600 mx-auto mb-1" />
              <p className="text-xs text-teal-700 font-medium">Farmácia</p>
              <p className="text-lg font-bold text-teal-800">{fmtBRL(result.pharmacyCredit)}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
