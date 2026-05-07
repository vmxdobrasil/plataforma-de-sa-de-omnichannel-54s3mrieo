import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import pb from '@/lib/pocketbase/client'
import { Image as ImageIcon, Upload } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

export default function AdminSettings() {
  const { user } = useAuth()
  const isCompany = user?.role === 'company'

  const [settingsId, setSettingsId] = useState<string | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)

  const [documentTitle, setDocumentTitle] = useState('')
  const [documentType, setDocumentType] = useState('other')
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [documentExpiry, setDocumentExpiry] = useState('')
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const record = await pb.collection('system_settings').getFirstListItem('')
        setSettingsId(record.id)
        if (record.logo) {
          setLogoPreview(pb.files.getURL(record, record.logo))
        }
      } catch (err) {
        if (user?.role === 'company') {
          try {
            const newRecord = await pb.collection('system_settings').create({
              company_name: 'Vmx do Brasil',
              primary_color: '#2563eb',
            })
            setSettingsId(newRecord.id)
          } catch (createErr) {
            console.error('Could not create system settings', createErr)
          }
        }
      }
    }

    loadSettings()
  }, [user])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/svg+xml'].includes(file.type)) {
      toast.error('Formato inválido. Use JPG, PNG ou SVG.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('O arquivo deve ter no máximo 5MB.')
      return
    }
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const saveLogo = async () => {
    if (!logoFile || !settingsId) return
    setIsUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append('logo', logoFile)
      await pb.collection('system_settings').update(settingsId, formData)
      toast.success('Logomarca atualizada com sucesso!')
      setLogoFile(null)
    } catch (err) {
      toast.error('Erro ao atualizar a logomarca.')
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setDocumentFile(file)
  }

  const saveDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!documentFile || !user) return
    setIsUploadingFile(true)
    setFieldErrors({})
    try {
      const formData = new FormData()
      formData.append('title', documentTitle)
      formData.append('type', documentType)
      formData.append('file', documentFile)
      if (documentExpiry) formData.append('expiry_date', new Date(documentExpiry).toISOString())
      formData.append('patient_id', user.id)

      await pb.collection('documents').create(formData)
      toast.success('Documento enviado com sucesso!')
      setIsDialogOpen(false)
      setDocumentTitle('')
      setDocumentFile(null)
      setDocumentExpiry('')
      setDocumentType('other')
    } catch (err) {
      const errors = extractFieldErrors(err)
      setFieldErrors(errors)
      toast.error('Erro ao enviar documento. Verifique os campos.')
    } finally {
      setIsUploadingFile(false)
    }
  }

  if (user?.role !== 'medical_director' && user?.role !== 'company') {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <p className="text-muted-foreground text-lg">Acesso negado.</p>
      </div>
    )
  }

  const canManageBranding = user?.role === 'medical_director' || user?.role === 'company'

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Branding & Files</h1>
        <p className="text-muted-foreground mt-1">
          Centralize o gerenciamento de arquivos e a marca da plataforma.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {canManageBranding && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Branding (Logomarca)</CardTitle>
                  <CardDescription>
                    Atualize o logo global da aplicação (JPG, PNG, SVG até 5MB).
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24 border-2 border-dashed rounded-xl flex flex-shrink-0 items-center justify-center bg-muted/30 overflow-hidden">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <Label htmlFor="logo-upload">Selecionar arquivo</Label>
                  <Input
                    id="logo-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/svg+xml"
                    onChange={handleLogoChange}
                  />
                  <Button
                    onClick={saveLogo}
                    disabled={!logoFile || isUploadingLogo}
                    className="w-full"
                  >
                    {isUploadingLogo ? 'Salvando...' : 'Atualizar Logomarca'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Upload de Arquivos</CardTitle>
                <CardDescription>
                  Envie PDFs, imagens e documentos gerais para o sistema.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full h-24 border-dashed" variant="outline">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span>Clique para enviar um arquivo</span>
                  </div>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enviar Novo Documento</DialogTitle>
                </DialogHeader>
                <form onSubmit={saveDocument} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Título do Documento</Label>
                    <Input
                      value={documentTitle}
                      onChange={(e) => setDocumentTitle(e.target.value)}
                      required
                    />
                    {fieldErrors.title && (
                      <p className="text-sm text-destructive">{fieldErrors.title}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Documento</Label>
                    <Select value={documentType} onValueChange={setDocumentType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="exam">Exame</SelectItem>
                        <SelectItem value="prescription">Receita</SelectItem>
                        <SelectItem value="certificate">Atestado</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Arquivo</Label>
                    <Input type="file" onChange={handleDocumentChange} required />
                    {fieldErrors.file && (
                      <p className="text-sm text-destructive">{fieldErrors.file}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Data de Validade (Opcional)</Label>
                    <Input
                      type="date"
                      value={documentExpiry}
                      onChange={(e) => setDocumentExpiry(e.target.value)}
                    />
                    {fieldErrors.expiry_date && (
                      <p className="text-sm text-destructive">{fieldErrors.expiry_date}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={isUploadingFile}>
                    {isUploadingFile ? 'Enviando...' : 'Confirmar Envio'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
