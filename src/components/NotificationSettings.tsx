import { useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Bell } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

const formSchema = z.object({
  low_balance_threshold: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z
      .number({
        required_error: 'O valor é obrigatório',
        invalid_type_error: 'Deve ser um número válido',
      })
      .min(0, 'O valor não pode ser negativo')
      .max(100000, 'Valor muito alto'),
  ),
})

export function NotificationSettings() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      low_balance_threshold: 50,
    },
  })

  useEffect(() => {
    if (user) {
      const threshold =
        user.low_balance_threshold !== null &&
        user.low_balance_threshold !== undefined &&
        user.low_balance_threshold !== ''
          ? Number(user.low_balance_threshold)
          : 50
      form.reset({ low_balance_threshold: threshold })
    }
  }, [user, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return
    setLoading(true)
    try {
      await pb.collection('users').update(user.id, {
        low_balance_threshold: values.low_balance_threshold,
      })
      toast({
        title: 'Preferências salvas',
        description: 'Suas preferências de notificação foram atualizadas com sucesso.',
      })
    } catch (error) {
      const fieldErrors = extractFieldErrors(error)
      if (Object.keys(fieldErrors).length > 0) {
        Object.entries(fieldErrors).forEach(([field, msg]) => {
          form.setError(field as any, { type: 'manual', message: msg })
        })
      } else {
        toast({
          title: 'Erro',
          description: 'Ocorreu um erro ao salvar as preferências.',
          variant: 'destructive',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  if (user?.role === 'company' || user?.role === 'professional') return null

  return (
    <Card className="mt-4 border-primary/20 bg-background shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="h-5 w-5 text-primary" /> Preferências de Notificação
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="low_balance_threshold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Limite de Saldo Crítico (R$)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 50.00"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Defina o valor mínimo de saldo para disparar um alerta de "Saldo Baixo".
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={loading} size="sm">
              {loading ? 'Salvando...' : 'Salvar Preferências'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
