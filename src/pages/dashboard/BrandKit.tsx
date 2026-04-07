import { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuth } from '@/hooks/use-auth'
import { getBrandKit, saveBrandKit } from '@/services/brand_kits'
import pb from '@/lib/pocketbase/client'
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
import { Loader2, Palette, Image as ImageIcon } from 'lucide-react'
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
  const [kitId, setKitId] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
          setKitId(data.id)
          form.reset({
            primary_color: data.primary_color,
            secondary_color: data.secondary_color,
            tone: data.tone,
            audience_description: data.audience_description,
          })
          if (data.logo) {
            setLogoUrl(pb.files.getURL(data, data.logo))
          }
        }
        setInitialLoading(false)
      })
    }
  }, [user, form])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: 'O logotipo deve ter no máximo 2MB.',
          variant: 'destructive',
        })
        if (fileInputRef.current) fileInputRef.current.value = ''
        return
      }
      setLogoUrl(URL.createObjectURL(file))
    }
  }

  const onSubmit = async (values: z.infer<typeof brandKitSchema>) => {
    if (!user) return

    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('primary_color', values.primary_color)
      formData.append('secondary_color', values.secondary_color)
      formData.append('tone', values.tone)
      formData.append('audience_description', values.audience_description)

      const fileInput = fileInputRef.current
      if (fileInput?.files?.[0]) {
        formData.append('logo', fileInput.files[0])
      }

      const saved = await saveBrandKit(user.id, formData, kitId || undefined)
      if (!kitId && saved) {
        setKitId(saved.id)
      }

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
    <div className="space-y-6 max-w-3xl pb-10">
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
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start p-4 border rounded-lg bg-muted/30">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed bg-background">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Logo da Marca"
                      className="h-full w-full object-contain p-2"
                    />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <FormLabel className="text-base">Logotipo da Marca</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Recomendado: PNG, JPG ou SVG de até 2MB. Fundo transparente sugerido.
                  </p>
                  <Input
                    type="file"
                    accept="image/jpeg, image/png, image/svg+xml"
                    ref={fileInputRef}
                    onChange={handleLogoChange}
                    className="max-w-xs cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="primary_color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor Primária (HEX)</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input type="color" className="w-12 p-1 cursor-pointer" {...field} />
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
                          <Input type="color" className="w-12 p-1 cursor-pointer" {...field} />
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
                    <Select onValueChange={field.onChange} value={field.value || ''}>
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
