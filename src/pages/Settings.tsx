import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import pb from '@/lib/pocketbase/client'
import { UploadCloud, X } from 'lucide-react'

function CompanySettings({ user }: { user: any }) {
  const initialAvatarUrl = user?.avatar
    ? pb.files.getURL({ id: user.id, collectionId: 'users' }, user.avatar)
    : null

  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialAvatarUrl)
  const [loading, setLoading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    if (!['image/jpeg', 'image/png', 'image/svg+xml'].includes(selected.type)) {
      toast.error('Formato inválido. Use JPG, PNG ou SVG.')
      return
    }

    if (selected.size > 2 * 1024 * 1024) {
      toast.error('O arquivo deve ter no máximo 2MB.')
      return
    }

    setFile(selected)
    setPreviewUrl(URL.createObjectURL(selected))
  }

  const handleRemove = () => {
    setFile(null)
    setPreviewUrl(null)
    const input = document.getElementById('logo') as HTMLInputElement
    if (input) input.value = ''
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const formData = new FormData()

      if (file) {
        formData.append('avatar', file)
      } else if (!previewUrl) {
        formData.append('avatar', '')
      }

      const updatedRecord = await pb.collection('users').update(user.id, formData)
      pb.authStore.save(pb.authStore.token, updatedRecord)
      toast.success('Configurações salvas com sucesso!')
      setFile(null)
    } catch (error) {
      toast.error('Erro ao salvar as configurações.')
    } finally {
      setLoading(false)
    }
  }

  const hasChanges = file !== null || previewUrl !== initialAvatarUrl

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logomarca da Empresa</CardTitle>
        <CardDescription>
          Faça o upload do logo da sua empresa para personalizar a plataforma. O arquivo deve ser
          JPG, PNG ou SVG e ter no máximo 2MB.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="relative flex-shrink-0 w-40 h-40 border-2 border-dashed rounded-xl flex items-center justify-center bg-muted/30 overflow-hidden group">
            {previewUrl ? (
              <>
                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain p-2" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={handleRemove}
                    className="h-8 w-8 rounded-full"
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center p-4">
                <UploadCloud className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <span className="text-xs text-muted-foreground">Sem logo</span>
              </div>
            )}
          </div>
          <div className="flex-1 w-full space-y-4">
            <div className="grid w-full max-w-sm items-center gap-2">
              <Label htmlFor="logo">Selecionar arquivo</Label>
              <Input
                id="logo"
                type="file"
                accept="image/jpeg,image/png,image/svg+xml"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
            </div>
            <Button onClick={handleSave} disabled={loading || !hasChanges}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ProfessionalSettings({ user }: { user: any }) {
  const [crm, setCrm] = useState(user.crm_number || '')
  const [state, setState] = useState(user.crm_state || '')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      const updated = await pb
        .collection('users')
        .update(user.id, { crm_number: crm, crm_state: state })
      pb.authStore.save(pb.authStore.token, updated)
      toast.success('Credenciais salvas com sucesso!')
    } catch (e) {
      toast.error('Erro ao salvar credenciais.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credenciais Profissionais</CardTitle>
        <CardDescription>
          Vincule seu CRM para acessar e sincronizar resultados de exames externos dos seus
          pacientes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Número do CRM</Label>
            <Input value={crm} onChange={(e) => setCrm(e.target.value)} placeholder="Ex: 123456" />
          </div>
          <div className="space-y-2">
            <Label>Estado (UF)</Label>
            <Input
              value={state}
              onChange={(e) => setState(e.target.value.toUpperCase())}
              maxLength={2}
              placeholder="Ex: SP"
            />
          </div>
        </div>
        <Button onClick={handleSave} disabled={loading || (!crm && !state)}>
          {loading ? 'Salvando...' : 'Salvar Credenciais'}
        </Button>
      </CardContent>
    </Card>
  )
}

function PatientSettings({ user }: { user: any }) {
  const [allowSync, setAllowSync] = useState(user.allow_external_sync || false)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      const updated = await pb
        .collection('users')
        .update(user.id, { allow_external_sync: allowSync })
      pb.authStore.save(pb.authStore.token, updated)
      toast.success('Configurações de privacidade salvas!')
    } catch (e) {
      toast.error('Erro ao salvar configurações.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacidade e Integrações</CardTitle>
        <CardDescription>Gerencie quem pode acessar seus dados de saúde externos.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between border p-4 rounded-lg bg-muted/20">
          <div className="space-y-0.5">
            <Label className="text-base">Sincronização de Exames Externos</Label>
            <p className="text-sm text-muted-foreground pr-4">
              Permitir que médicos acessem seus resultados de laboratórios parceiros usando o CRM.
            </p>
          </div>
          <Switch checked={allowSync} onCheckedChange={setAllowSync} />
        </div>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </CardContent>
    </Card>
  )
}

export default function Settings() {
  const { user } = useAuth()

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie suas preferências de perfil e integrações da plataforma.
        </p>
      </div>

      {user?.role === 'company' && <CompanySettings user={user} />}
      {user?.role === 'professional' && <ProfessionalSettings user={user} />}
      {user?.role === 'patient' && <PatientSettings user={user} />}
    </div>
  )
}
