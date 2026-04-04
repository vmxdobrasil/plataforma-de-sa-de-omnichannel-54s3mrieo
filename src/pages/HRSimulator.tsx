import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, CheckCircle2, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { getEmployees, getCompanyTransactions, executeRenewal } from '@/services/companies'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function HRSimulator() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [employees, setEmployees] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState(false)

  useEffect(() => {
    if (user?.role !== 'company') {
      navigate('/')
      return
    }
    loadData()
  }, [user, navigate])

  const loadData = async () => {
    try {
      setLoading(true)
      const [emps, txs] = await Promise.all([
        getEmployees(user.id),
        getCompanyTransactions(user.id),
      ])

      setEmployees(emps.filter((e) => e.auto_renew_benefits === true))
      setTransactions(txs)
    } catch (error) {
      toast({
        title: 'Error loading data',
        description: 'Could not fetch simulator data.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const balances = useMemo(() => {
    const acc: Record<string, { health: number; medication: number }> = {}
    transactions.forEach((t) => {
      if (!acc[t.employee_id]) {
        acc[t.employee_id] = { health: 0, medication: 0 }
      }
      const amount = t.type === 'credit' ? t.amount : -t.amount
      if (t.category === 'medication') {
        acc[t.employee_id].medication += amount
      } else {
        acc[t.employee_id].health += amount
      }
    })
    return acc
  }, [transactions])

  const handleExecuteRenewal = async () => {
    try {
      setExecuting(true)
      const res = await executeRenewal()
      toast({
        title: 'Renewal Executed Successfully',
        description: `Created ${res.transactionsCreated} transactions for ${res.employeesProcessed} employees. Employees have been notified.`,
      })
      await loadData()
    } catch (error) {
      toast({
        title: 'Execution Failed',
        description: 'An error occurred while executing the renewal cycle.',
        variant: 'destructive',
      })
    } finally {
      setExecuting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground animate-pulse">Loading simulator data...</p>
      </div>
    )
  }

  const totalHealthCredit = employees.reduce((sum, emp) => sum + (emp.health_allowance || 0), 0)
  const totalMedCredit = employees.reduce((sum, emp) => sum + (emp.medication_allowance || 0), 0)

  return (
    <div className="container mx-auto p-6 max-w-6xl animate-fade-in-up space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HR Cycle Simulator</h1>
          <p className="text-muted-foreground mt-1">
            Preview and execute the monthly benefit renewal for eligible employees.
          </p>
        </div>
        <Button
          onClick={handleExecuteRenewal}
          disabled={executing || employees.length === 0}
          className="w-full md:w-auto"
          size="lg"
        >
          <Play className="mr-2 h-4 w-4" />
          {executing ? 'Executing...' : 'Execute Renewal'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Eligible Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{employees.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Health Credit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                totalHealthCredit,
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Medication Credit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                totalMedCredit,
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Renewal Preview</CardTitle>
          <CardDescription>
            The following employees have auto-renewal enabled and will receive these credits.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="text-right">Current Health</TableHead>
                  <TableHead className="text-right text-green-700">Health Credit</TableHead>
                  <TableHead className="text-right">Current Meds</TableHead>
                  <TableHead className="text-right text-blue-700">Med Credit</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No employees eligible for auto-renewal.
                    </TableCell>
                  </TableRow>
                ) : (
                  employees.map((emp) => {
                    const empBalances = balances[emp.id] || { health: 0, medication: 0 }
                    const hAllowance = emp.health_allowance || 0
                    const mAllowance = emp.medication_allowance || 0
                    const hasCredits = hAllowance > 0 || mAllowance > 0

                    return (
                      <TableRow key={emp.id}>
                        <TableCell className="font-medium">{emp.name || emp.email}</TableCell>
                        <TableCell className="text-right">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(empBalances.health)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          +
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(hAllowance)}
                        </TableCell>
                        <TableCell className="text-right">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(empBalances.medication)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-blue-600">
                          +
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(mAllowance)}
                        </TableCell>
                        <TableCell className="text-center">
                          {hasCredits ? (
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200 gap-1"
                            >
                              <CheckCircle2 className="h-3 w-3" /> Ready
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-700 border-amber-200 gap-1"
                            >
                              <AlertCircle className="h-3 w-3" /> Missing Allowance
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
