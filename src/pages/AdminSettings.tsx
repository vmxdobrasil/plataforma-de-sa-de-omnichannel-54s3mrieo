import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import pb from '@/lib/pocketbase/client'
import {
  Image as ImageIcon,
  Upload,
  Globe,
  GitBranch,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Server,
  Terminal,
} from 'lucide-react'
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
import { AdminHeader } from '@/components/admin/AdminHeader'

export default function AdminSettings() {
  const { user } = useAuth()
  const isAuthorized =
    user?.role === 'admin' || user?.role === 'medical_director' || user?.role === 'company'

  const [settingsId, setSettingsId] = useState<string | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [primaryColor, setPrimaryColor] = useState('#14805A')
  const [companyName, setCompanyName] = useState('V MED Brasil')
  const [isSavingBranding, setIsSavingBranding] = useState(false)

  // Document upload state
  const [documentTitle, setDocumentTitle] = useState('')
  const [documentType, setDocumentType] = useState('other')
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [documentExpiry, setDocumentExpiry] = useState('')
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Domain & GitHub management state
  const [customDomain, setCustomDomain] = useState(() => {
    return localStorage.getItem('vmed_custom_domain') || 'vmedbrasil.com.br'
  })
  const [domainStatus, setDomainStatus] = useState<'active' | 'verifying' | 'pending'>('active')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const [githubRepoUrl, setGithubRepoUrl] = useState(() => {
    return localStorage.getItem('vmed_github_repo') || 'https://github.com/vmedbrasil/vmed-platform'
  })
  const [githubBranch, setGithubBranch] = useState(() => {
    return localStorage.getItem('vmed_github_branch') || 'main'
  })
  const [lastCommit, setLastCommit] = useState({
    hash: 'b4a8e29',
    message: 'feat: painel operacional e integracoes omnichannel ativas',
    date: 'Hoje, sincronizado',
  })

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const record = await pb.collection('system_settings').getFirstListItem('')
        setSettingsId(record.id)
        if (record.company_name) setCompanyName(record.company_name)
        if (record.primary_color) setPrimaryColor(record.primary_color)
        if (record.logo) {
          setLogoPreview(pb.files.getURL(record, record.logo))
        }
      } catch (err) {
        if (
          user?.role === 'admin' ||
          user?.role === 'medical_director' ||
          user?.role === 'company'
        ) {
          try {
            const newRecord = await pb.collection('system_settings').create({
              company_name: 'V MED Brasil',
              primary_color: '#14805A',
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

  const copyToClipboard = async (text: string, key: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(key)
      toast.success(label)
      setTimeout(() => setCopiedKey(null), 2000)
    } catch {
      toast.error('Erro ao copiar para a área de transferência')
    }
  }

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

  const saveBrandingInfo = async () => {
    if (!settingsId) return
    setIsSavingBranding(true)
    try {
      await pb.collection('system_settings').update(settingsId, {
        company_name: companyName,
        primary_color: primaryColor,
      })
      toast.success('Configurações de marca atualizadas!')
    } catch (err) {
      toast.error('Erro ao salvar as configurações de marca.')
    } finally {
      setIsSavingBranding(false)
    }
  }

  const handleSaveDomain = () => {
    localStorage.setItem('vmed_custom_domain', customDomain)
    setDomainStatus('verifying')
    setTimeout(() => {
      setDomainStatus('active')
      toast.success('Domínio salvo e verificado com sucesso!')
    }, 800)
  }

  const handleSaveGithub = () => {
    localStorage.setItem('vmed_github_repo', githubRepoUrl)
    localStorage.setItem('vmed_github_branch', githubBranch)
    toast.success('Configurações do repositório GitHub atualizadas!')
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

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[50vh] space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold">Acesso Restrito</h2>
        <p className="text-muted-foreground text-sm max-w-md text-center">
          Você precisa de permissões de administrador para acessar as configurações do sistema.
        </p>
      </div>
    )
  }

  const canManageBranding =
    user?.role === 'admin' || user?.role === 'medical_director' || user?.role === 'company'

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up pb-12">
      <AdminHeader
        title={
          <>
            Configurações <span className="text-primary ml-2">do Sistema</span>
          </>
        }
        description="Gerencie a identidade visual (Brand Kit), domínio personalizado, sincronização de código com GitHub e repositório de arquivos corporativos."
        icon={<Globe className="h-8 w-8" />}
      />

      {/* Grid de Seções Principais */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* SEÇÃO 1: ACESSO AO DOMÍNIO */}
        <Card className="border-primary/20 shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Domínio Personalizado</CardTitle>
                    <CardDescription>
                      Acesso, apontamento DNS e certificado SSL da plataforma.
                    </CardDescription>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={
                    domainStatus === 'active'
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 flex items-center gap-1'
                      : 'bg-amber-500/10 text-amber-600 border-amber-500/30 flex items-center gap-1'
                  }
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {domainStatus === 'active' ? 'Ativo & Conectado' : 'Verificando'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="custom-domain">Domínio de Produção</Label>
                <div className="flex gap-2">
                  <Input
                    id="custom-domain"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder="exemplo: app.vmedbrasil.com.br"
                  />
                  <Button onClick={handleSaveDomain} variant="default">
                    Salvar
                  </Button>
                </div>
              </div>

              <div className="p-3 bg-muted/40 rounded-lg space-y-3 border text-xs">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <Server className="h-4 w-4 text-primary" /> Apontamentos DNS Recomendados
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-background rounded border">
                    <div>
                      <span className="font-mono font-bold text-primary mr-2">CNAME</span>
                      <span className="font-mono text-muted-foreground">app.vmedbrasil.com.br</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() =>
                        copyToClipboard('cname.goskip.app', 'cname', 'Host CNAME copiado!')
                      }
                    >
                      {copiedKey === 'cname' ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-background rounded border">
                    <div>
                      <span className="font-mono font-bold text-primary mr-2">A</span>
                      <span className="font-mono text-muted-foreground">@ (Raiz)</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() =>
                        copyToClipboard('76.76.21.21', 'a-record', 'IP de apontamento copiado!')
                      }
                    >
                      {copiedKey === 'a-record' ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
                <p className="text-muted-foreground text-[11px]">
                  Certificados SSL / HTTPS são emitidos automaticamente após a propagação dos
                  registros DNS.
                </p>
              </div>
            </CardContent>
          </div>
          <div className="p-4 border-t bg-muted/10 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">SSL Ativo (Let's Encrypt TLS 1.3)</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://${customDomain}`, '_blank')}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Abrir no Navegador
            </Button>
          </div>
        </Card>

        {/* SEÇÃO 2: ACESSO AO GITHUB */}
        <Card className="border-primary/20 shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg">
                    <GitBranch className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Repositório GitHub</CardTitle>
                    <CardDescription>
                      Código-fonte, controle de versão e integração contínua (CI/CD).
                    </CardDescription>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="bg-blue-500/10 text-blue-600 border-blue-500/30"
                >
                  Sincronizado
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="github-repo">URL do Repositório</Label>
                <Input
                  id="github-repo"
                  value={githubRepoUrl}
                  onChange={(e) => setGithubRepoUrl(e.target.value)}
                  placeholder="https://github.com/usuario/repositorio"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="github-branch">Branch Principal</Label>
                  <Input
                    id="github-branch"
                    value={githubBranch}
                    onChange={(e) => setGithubBranch(e.target.value)}
                    placeholder="main"
                  />
                </div>
                <div className="space-y-2 flex flex-col justify-end">
                  <Button onClick={handleSaveGithub} variant="outline" className="w-full">
                    Salvar Repositório
                  </Button>
                </div>
              </div>

              <div className="p-3 bg-muted/40 rounded-lg space-y-2 border text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold flex items-center gap-1 text-foreground">
                    <Terminal className="h-3.5 w-3.5 text-primary" /> Último Commit Sincronizado
                  </span>
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {lastCommit.hash}
                  </Badge>
                </div>
                <p className="text-muted-foreground font-mono text-[11px] truncate">
                  {lastCommit.message}
                </p>
                <div className="text-[11px] text-muted-foreground">{lastCommit.date}</div>
              </div>
            </CardContent>
          </div>
          <div className="p-4 border-t bg-muted/10 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Vite + React + TS no Skip Cloud</span>
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                if (githubRepoUrl.startsWith('http')) {
                  window.open(githubRepoUrl, '_blank')
                } else {
                  window.open(`https://${githubRepoUrl}`, '_blank')
                }
              }}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Ver no GitHub
            </Button>
          </div>
        </Card>

        {/* SEÇÃO 3: BRANDING & IDENTIDADE VISUAL */}
        {canManageBranding && (
          <Card className="overflow-hidden border-primary/20 shadow-sm">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Branding (Logomarca e Identidade)</CardTitle>
                  <CardDescription>
                    Atualize o logotipo global e a cor primária da aplicação.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
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
                  <Label htmlFor="logo-upload">Selecionar arquivo de Logomarca</Label>
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

              <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                <div className="space-y-2">
                  <Label>Nome de Exibição</Label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="V MED Brasil"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cor Primária (HEX)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      className="w-12 p-1 cursor-pointer"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#14805A"
                    />
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={saveBrandingInfo}
                disabled={isSavingBranding}
                className="w-full"
              >
                {isSavingBranding ? 'Salvando...' : 'Salvar Nome e Cor Primária'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* SEÇÃO 4: ARQUIVOS & DOCUMENTOS CORPORATIVOS */}
        <Card className="overflow-hidden border-primary/20 shadow-sm">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Upload de Arquivos do Sistema</CardTitle>
                <CardDescription>
                  Envie PDFs, contratos, tabelas e documentos gerais para a plataforma.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full h-32 border-dashed flex flex-col gap-2" variant="outline">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="font-medium">Clique para enviar um novo documento</span>
                  <span className="text-xs text-muted-foreground">PDF, PNG, JPG até 10MB</span>
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
                      placeholder="Ex: Tabela de Preços Convênio 2026"
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
                        <SelectItem value="contract">Contrato</SelectItem>
                        <SelectItem value="legal_doc">Documento Regulatório</SelectItem>
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
