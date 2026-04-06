import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuth } from '@/hooks/use-auth'
import { getBrandKit, saveBrandKit } from '@/services/ecosystem'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Palette } from 'lucide-react'
import { Navigate } from 'react-router-dom'

const brandKitSchema = z.object({
  primary_color: z.string().min(1, 'Cor primária é obrigatória'),
  secondary_color: z.string().min(1, 'Cor secundária é obrigatória'),
  tone: z.string().min(1, 'Tom de voz é obrigatório'),
  audience_description: z.string().min(10, 'Descreva seu público alvo (mín. 10 caracteres)'),
})

export default function BrandKit() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  const form = useForm<z.infer<typeof brandKitSchema>>({
    resolver: zodResolver(brandKitSchema),
    defaultValues: {
      primary_color: '#000000',
      secondary_color: '#ffffff',
      tone: '',
      audience_description: '',
    },
  })

  useEffect(() => {
    if (user) {
      getBrandKit(user.id).then((data) => {
        if (data) {
          form.reset({
            primary_color: data.primary_color,
            secondary_color: data.secondary_color,
            tone: data.tone,
            audience_description: data.audience_description,
          })
        }
        setInitialLoading(false)
      })
    }
  }, [user, form])

  const onSubmit = async (values: z.infer<typeof brandKitSchema>) => {
    try {
      setLoading(true)
      await saveBrandKit(user.id, values)
      toast({ title: 'Sucesso', description: 'Brand Kit atualizado com sucesso!' })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o Brand Kit.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) return null

  if (user?.role !== 'professional') {
    return <Navigate to="/" />
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Brand Kit</h1>
        <p className="text-muted-foreground">
          Defina a identidade da sua marca para personalizar os Agentes IA.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" /> Configurações de Identidade
          </CardTitle>
          <CardDescription>
            Essas informações serão utilizadas para gerar conteúdos mais alinhados com o seu perfil.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="primary_color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor Primária (HEX)</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input type="color" className="w-12 p-1" {...field} />
                          <Input {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="secondary_color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor Secundária (HEX)</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input type="color" className="w-12 p-1" {...field} />
                          <Input {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="tone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tom de Voz</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tom de voz" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Professional">Profissional e Direto</SelectItem>
                        <SelectItem value="Empathetic">Empático e Acolhedor</SelectItem>
                        <SelectItem value="Educational">Educativo e Científico</SelectItem>
                        <SelectItem value="Informative">Informativo e Prático</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="audience_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição do Público Alvo</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: Mulheres de 25 a 45 anos buscando tratamentos dermatológicos..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Brand Kit
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
