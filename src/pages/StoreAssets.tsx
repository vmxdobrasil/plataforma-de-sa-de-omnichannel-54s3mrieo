import { useState, useRef } from 'react'
import {
  Download,
  Copy,
  Check,
  Smartphone,
  Image as ImageIcon,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Layers,
  ArrowDownToLine,
  FileText,
  Info,
  Calendar,
  FileCheck,
  QrCode,
  Lock,
  MessageSquare,
  Activity,
  HeartPulse,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  STORE_MOCKUPS,
  MobileMockupData,
  renderStoreBanner,
  renderMobileMockup,
} from '@/lib/store-canvas-renderer'
import { triggerDownload, downloadDirectUrl } from '@/lib/store-asset-exporter'

export default function StoreAssets() {
  const [downloadingBanner, setDownloadingBanner] = useState(false)
  const [downloadingIcon, setDownloadingIcon] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [downloadingAll, setDownloadingAll] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Metadados oficiais da Google Play Store
  const storeTexts = {
    title: 'V MED BRASIL',
    shortDesc: 'Saúde completa: consultas, prontuário digital e receitas com assinatura.',
    fullDesc: `V MED BRASIL: Seu Ecossistema Completo de Saúde Integrada, Telemedicina e Benefícios.

A V MED BRASIL conecta você aos melhores profissionais de saúde, exames e medicamentos com máxima conveniência, segurança e conformidade regulatória.

PRINCIPAIS RECURSOS:
• Telemedicina 24h e Agendamento Fácil: Realize consultas por vídeo direto do aplicativo com médicos especialistas (clínica geral, cardiologia, pediatria, dermatologia e mais) ou agende consultas presenciais na rede credenciada.
• Prontuário Digital Unificado: Mantenha todo o seu histórico clínico, laudos de exames, atestados e anotações médicas salvos com segurança máxima e privacidade.
• Receitas Digitais Memed com QR Code: Receba prescrições oficiais emitidas com certificado digital ICP-Brasil e dispensáveis em farmácias e drogarias de todo o país. Basta apresentar o QR Code ao farmacêutico.
• Chat Seguro e Notificações: Tire dúvidas diretamente com o profissional de saúde em canal criptografado de ponta a ponta.
• Painel Completo para Profissionais: Ferramenta integrada de prontuário, agendamento de consultas e emissão de receitas Memed para médicos e clínicas credenciadas.
• Gestão Familiar e Dependentes: Cadastre e gerencie a saúde de seus filhos, pais e dependentes em uma única conta.
• Segurança, Sigilo e LGPD: Conformidade total com a Lei Geral de Proteção de Dados (Lei 13.709/18), normas do Conselho Federal de Medicina (CFM) e padrões da Anvisa.

Cuide da sua saúde e da sua família com simplicidade, tecnologia e carinho. Baixe agora o V MED BRASIL!`,
  }

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    toast.success('Copiado para a área de transferência!')
    setTimeout(() => setCopiedField(null), 2500)
  }

  // 1. Download do Banner 1024x500
  const handleDownloadBanner = async () => {
    try {
      setDownloadingBanner(true)
      const canvas = await renderStoreBanner()
      const dataUrl = canvas.toDataURL('image/png')
      triggerDownload(dataUrl, 'v-med-brasil-banner-1024x500.png')
      toast.success('Banner 1024×500 baixado com sucesso!')
    } catch (err: any) {
      console.error(err)
      toast.error('Erro ao gerar o banner: ' + err.message)
    } finally {
      setDownloadingBanner(false)
    }
  }

  // 2. Download do Ícone 512x512
  const handleDownloadIcon = async () => {
    try {
      setDownloadingIcon(true)
      await downloadDirectUrl('/icons/icon-512x512.png', 'v-med-brasil-icon-512x512.png')
      toast.success('Ícone 512×512 baixado com sucesso!')
    } catch (err: any) {
      console.error(err)
      toast.error('Erro ao baixar o ícone: ' + err.message)
    } finally {
      setDownloadingIcon(false)
    }
  }

  // 3. Download de uma tela específica 1080x1920
  const handleDownloadMockup = async (mockup: MobileMockupData) => {
    try {
      setDownloadingId(mockup.id)
      const canvas = await renderMobileMockup(mockup)
      const dataUrl = canvas.toDataURL('image/png')
      triggerDownload(dataUrl, `v-med-brasil-screenshot-${mockup.id}.png`)
      toast.success(`Captura "${mockup.title}" (1080×1920) baixada!`)
    } catch (err: any) {
      console.error(err)
      toast.error('Erro ao gerar captura de tela: ' + err.message)
    } finally {
      setDownloadingId(null)
    }
  }

  // 4. Download de TODOS os recursos sequencialmente
  const handleDownloadAll = async () => {
    try {
      setDownloadingAll(true)
      toast.info('Iniciando download em lote de todos os 10 arquivos (Banner + Ícone + 8 Telas)...')

      // Baixar Banner
      const bannerCanvas = await renderStoreBanner()
      triggerDownload(bannerCanvas.toDataURL('image/png'), '00-v-med-brasil-banner-1024x500.png')
      await new Promise((r) => setTimeout(r, 600))

      // Baixar Ícone
      await downloadDirectUrl('/icons/icon-512x512.png', '01-v-med-brasil-icon-512x512.png')
      await new Promise((r) => setTimeout(r, 600))

      // Baixar as 8 telas sequencialmente
      for (let i = 0; i < STORE_MOCKUPS.length; i++) {
        const mockup = STORE_MOCKUPS[i]
        const canvas = await renderMobileMockup(mockup)
        const filename = `0${i + 2}-v-med-brasil-screenshot-${mockup.id}.png`
        triggerDownload(canvas.toDataURL('image/png'), filename)
        await new Promise((r) => setTimeout(r, 600))
      }

      toast.success('Todos os 10 recursos visuais foram baixados com sucesso!')
    } catch (err: any) {
      console.error(err)
      toast.error('Ocorreu um erro no download em lote: ' + err.message)
    } finally {
      setDownloadingAll(false)
    }
  }

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto">
      {/* Top Banner de Instruções */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#168A62] via-[#14805A] to-[#0B5239] p-6 sm:p-10 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1 text-xs font-semibold tracking-wide text-emerald-100 backdrop-blur-md">
            <Sparkles className="h-4 w-4" /> RECURSOS VISUAIS GOOGLE PLAY STORE
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Gerador de Recursos da Loja
          </h1>
          <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
            Baixe e suba no{' '}
            <strong>Google Play Console → Presença na loja → Páginas de detalhes do app</strong>.
            Todos os arquivos são gerados nas <strong>dimensões exatas</strong> exigidas pelo Google
            (1024×500 para o banner gráfico e 1080×1920 proporção 9:16 para as capturas de tela
            móveis).
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              onClick={handleDownloadAll}
              disabled={downloadingAll}
              className="rounded-full bg-white text-[#14805A] hover:bg-emerald-50 font-bold shadow-lg"
            >
              {downloadingAll ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#14805A] border-r-transparent mr-2" />
                  Baixando Todos os Recursos...
                </>
              ) : (
                <>
                  <ArrowDownToLine className="h-5 w-5 mr-2" />
                  Baixar Todas as Imagens (10 Arquivos)
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full border-white/40 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
              asChild
            >
              <a href="https://play.google.com/console" target="_blank" rel="noreferrer">
                Abrir Google Play Console <ExternalLink className="h-4 w-4 ml-1.5" />
              </a>
            </Button>
          </div>
        </div>

        {/* Círculos decorativos no fundo */}
        <div className="absolute -right-12 -top-12 h-80 w-80 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute right-40 -bottom-10 h-60 w-60 rounded-full bg-emerald-400/10 blur-xl pointer-events-none" />
      </div>

      {/* SEÇÃO 1: TEXTOS DA LISTAGEM DO GOOGLE PLAY (CÓPIA FÁCIL) */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#14805A]" /> Textos da Ficha do App no Google
                Play
              </CardTitle>
              <CardDescription>
                Copie e cole nos campos correspondentes na tela do Google Play Console
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50">
              Pronto para publicação
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Nome do App */}
            <div className="space-y-1.5 p-4 rounded-xl bg-muted/40 border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Nome do app (Máx. 30 caracteres)
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {storeTexts.title.length}/30
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 pt-1">
                <span className="font-bold text-base text-foreground font-mono">
                  {storeTexts.title}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full text-xs h-8"
                  onClick={() => handleCopy(storeTexts.title, 'title')}
                >
                  {copiedField === 'title' ? (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 mr-1" /> Copiar
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Breve Descrição */}
            <div className="space-y-1.5 p-4 rounded-xl bg-muted/40 border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Breve descrição (Máx. 80 caracteres)
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {storeTexts.shortDesc.length}/80
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 pt-1">
                <span className="text-xs text-foreground leading-relaxed line-clamp-2">
                  {storeTexts.shortDesc}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full text-xs h-8 shrink-0"
                  onClick={() => handleCopy(storeTexts.shortDesc, 'shortDesc')}
                >
                  {copiedField === 'shortDesc' ? (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 mr-1" /> Copiar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Descrição Completa */}
          <div className="space-y-2 p-4 rounded-xl bg-muted/40 border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Descrição completa (Máx. 4000 caracteres)
              </span>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full text-xs h-8"
                onClick={() => handleCopy(storeTexts.fullDesc, 'fullDesc')}
              >
                {copiedField === 'fullDesc' ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Descrição Copiada
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1" /> Copiar Descrição Completa
                  </>
                )}
              </Button>
            </div>
            <textarea
              readOnly
              value={storeTexts.fullDesc}
              className="w-full h-36 bg-card border rounded-lg p-3 text-xs leading-relaxed font-mono resize-none focus:outline-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO 2: BANNER GRÁFICO (FEATURE GRAPHIC) 1024×500 */}
      <Card className="border-border shadow-sm overflow-hidden">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-[#14805A]" /> Banner Gráfico de Destaque
                <Badge variant="secondary" className="font-mono text-xs font-bold">
                  1024 × 500 px
                </Badge>
              </CardTitle>
              <CardDescription>
                Exigido pelo Google Play para destaque na loja de aplicativos. Renderizado nas cores
                da marca V MED BRASIL com slogan e ícone.
              </CardDescription>
            </div>
            <Button
              onClick={handleDownloadBanner}
              disabled={downloadingBanner}
              className="rounded-full bg-[#14805A] hover:bg-[#116d4c] text-white shrink-0"
            >
              {downloadingBanner ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent mr-2" />
                  Gerando PNG...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" /> Baixar PNG (1024×500)
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Pré-visualização do Banner em proporção exata 1024:500 */}
          <div className="relative w-full overflow-hidden rounded-2xl border shadow-inner bg-gradient-to-br from-[#168A62] via-[#14805A] to-[#094731] p-6 sm:p-10 text-white aspect-[1024/500]">
            {/* Grade de fundo decorativa */}
            <div className="absolute inset-0 bg-grid-pattern opacity-15 pointer-events-none" />

            <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="h-16 w-16 sm:h-24 sm:w-24 rounded-2xl sm:rounded-3xl bg-white p-1 shadow-2xl flex items-center justify-center shrink-0 border border-white/30 overflow-hidden">
                  <img
                    src="/icons/icon-512x512.png"
                    alt="V MED BRASIL Icon"
                    className="h-full w-full object-contain rounded-xl sm:rounded-2xl"
                  />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-0.5 text-[10px] sm:text-xs font-bold text-emerald-100 mb-1 backdrop-blur-sm">
                    • ECOSSISTEMA DE SAÚDE •
                  </div>
                  <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white drop-shadow-md">
                    V MED BRASIL
                  </h2>
                </div>
              </div>

              <div className="space-y-3 max-w-2xl">
                <p className="text-sm sm:text-xl md:text-2xl font-bold text-emerald-50 leading-snug drop-shadow-sm">
                  Saúde completa: consultas, prontuário digital e receitas com assinatura.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/15 px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold backdrop-blur-sm">
                    ✓ Telemedicina 24h
                  </span>
                  <span className="rounded-full bg-white/15 px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold backdrop-blur-sm">
                    ✓ Receitas Memed ICP-Brasil
                  </span>
                  <span className="rounded-full bg-white/15 px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold backdrop-blur-sm">
                    ✓ Prontuário e Exames
                  </span>
                </div>
              </div>

              <div className="text-[10px] sm:text-xs text-white/70 font-medium">
                Em conformidade com CFM • ICP-Brasil • Padrão LGPD
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO 3: ÍCONE OFICIAL DO APP (512×512) */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#14805A]" /> Ícone do App no Google Play
                <Badge variant="secondary" className="font-mono text-xs font-bold">
                  512 × 512 px
                </Badge>
              </CardTitle>
              <CardDescription>
                Ícone oficial do projeto (PNG 32 bits com canal alfa, dimensões exatas de 512×512)
              </CardDescription>
            </div>
            <Button
              onClick={handleDownloadIcon}
              disabled={downloadingIcon}
              className="rounded-full bg-[#14805A] hover:bg-[#116d4c] text-white shrink-0"
            >
              <Download className="h-4 w-4 mr-2" /> Baixar PNG (512×512)
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-muted/30 border">
            <div className="relative group shrink-0">
              <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-3xl bg-white shadow-xl p-1.5 border flex items-center justify-center overflow-hidden">
                <img
                  src="/icons/icon-512x512.png"
                  alt="V MED BRASIL 512x512"
                  className="h-full w-full object-contain rounded-2xl"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-emerald-600 text-white rounded-full p-1 shadow">
                <Check className="h-4 w-4" />
              </div>
            </div>

            <div className="space-y-2 text-center sm:text-left">
              <h3 className="font-bold text-lg text-foreground">Ícone Nativo V MED BRASIL</h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                O arquivo oficial já está localizado em <code>/icons/icon-512x512.png</code>. Ele
                possui cantos com acabamento institucional, símbolo médico centralizado, tipografia
                vetorizada nativa e atende a 100% dos critérios do Google Play Store.
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <Badge variant="outline" className="text-xs">
                  Formato: PNG 32-bit
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Tamanho: 512 × 512 px
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Cor: Verde Marca #14805A
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO 4: CAPTURAS DE CELULAR (8 TELAS, 1080×1920, PROPORÇÃO 9:16) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Smartphone className="h-6 w-6 text-[#14805A]" /> Capturas de Tela de Celular (8
              Telas)
              <Badge variant="secondary" className="font-mono text-xs font-bold">
                1080 × 1920 px (9:16)
              </Badge>
            </h2>
            <p className="text-sm text-muted-foreground">
              Cada tela possui o frame de celular estilizado, título impactante no topo e
              representação limpa da UI do aplicativo.
            </p>
          </div>
          <Button
            onClick={handleDownloadAll}
            disabled={downloadingAll}
            className="rounded-full bg-[#14805A] hover:bg-[#116d4c] text-white shrink-0 font-bold"
          >
            <ArrowDownToLine className="h-4 w-4 mr-2" /> Baixar Todas as 8 Telas
          </Button>
        </div>

        {/* Grade com os 8 Mockups estilizados */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STORE_MOCKUPS.map((mockup, index) => {
            const isDownloading = downloadingId === mockup.id

            return (
              <Card
                key={mockup.id}
                className="group hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden border-border"
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <Badge
                      variant="outline"
                      className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border-emerald-200"
                    >
                      Tela #{index + 1}
                    </Badge>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">
                      1080×1920
                    </span>
                  </div>
                  <CardTitle className="text-base font-bold text-foreground line-clamp-1">
                    {mockup.title}
                  </CardTitle>
                  <CardDescription className="text-xs line-clamp-1">
                    {mockup.subtitle}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-4 pt-1 flex-1 flex flex-col justify-between space-y-3">
                  {/* Prévia Estilizada em HTML do Mockup (9:16) */}
                  <div className="relative w-full aspect-[9/16] rounded-2xl bg-gradient-to-b from-[#168A62] via-[#14805A] to-[#0B5239] p-3 text-white shadow-inner flex flex-col justify-between overflow-hidden border">
                    {/* Linhas de topo */}
                    <div className="text-center space-y-1">
                      <div className="inline-block rounded-full bg-white/20 px-2 py-0.5 text-[8px] font-bold text-emerald-200">
                        {mockup.tag}
                      </div>
                      <h4 className="text-xs font-black leading-tight text-white drop-shadow">
                        {mockup.title}
                      </h4>
                    </div>

                    {/* Frame miniatura do Celular */}
                    <div className="w-full flex-1 mt-2 mb-1 rounded-xl bg-slate-900 p-1 shadow-lg flex flex-col">
                      <div className="w-full h-full rounded-lg bg-slate-50 text-slate-800 p-2 text-[8px] flex flex-col justify-between overflow-hidden">
                        {/* Status bar mini */}
                        <div className="flex items-center justify-between text-[7px] text-slate-400 font-bold border-b pb-1">
                          <span>9:41</span>
                          <span className="text-emerald-600 font-black">V MED BRASIL</span>
                          <span>100%</span>
                        </div>

                        {/* Conteúdo visual simplificado da miniatura */}
                        <div className="flex-1 py-1 space-y-1">
                          {mockup.type === 'booking' && (
                            <div className="space-y-1">
                              <div className="bg-emerald-100 text-emerald-800 rounded p-1 font-bold text-[7px]">
                                📅 Agendamento Telemedicina
                              </div>
                              <div className="bg-white border rounded p-1 text-[7px] space-y-0.5">
                                <span className="font-bold block">Dr. Rafael Oliveira</span>
                                <span className="text-slate-400 block">
                                  Cardiologia • CRM 184920
                                </span>
                                <span className="text-emerald-600 font-bold block">
                                  Hoje às 15:30
                                </span>
                              </div>
                              <div className="bg-emerald-600 text-white rounded text-center py-0.5 font-bold text-[7px]">
                                Confirmar Horário
                              </div>
                            </div>
                          )}

                          {mockup.type === 'records' && (
                            <div className="space-y-1">
                              <div className="bg-slate-100 rounded p-1 text-[7px] font-bold">
                                📋 Prontuário & Histórico Clínico
                              </div>
                              <div className="bg-white border rounded p-1 text-[7px] space-y-0.5">
                                <span className="text-emerald-700 font-bold">24/09/2026</span>
                                <span className="block font-bold">Teleconsulta Cardiológica</span>
                                <span className="text-slate-400 block">
                                  Pressão 120/80 • Laudo Concluído
                                </span>
                              </div>
                              <div className="bg-white border rounded p-1 text-[7px] space-y-0.5">
                                <span className="text-emerald-700 font-bold">10/08/2026</span>
                                <span className="block font-bold">Exames Laboratoriais</span>
                              </div>
                            </div>
                          )}

                          {mockup.type === 'prescriptions' && (
                            <div className="space-y-1">
                              <div className="bg-emerald-700 text-white rounded p-1 font-bold text-[7px]">
                                📜 Receita Digital com QR Code
                              </div>
                              <div className="bg-white border rounded p-1 flex items-center justify-between text-[7px]">
                                <div>
                                  <span className="font-bold block">Losartana 50mg</span>
                                  <span className="text-slate-400">90 dias contínuo</span>
                                </div>
                                <div className="h-6 w-6 bg-slate-900 text-white flex items-center justify-center font-bold text-[8px] rounded">
                                  QR
                                </div>
                              </div>
                              <div className="text-[6px] text-emerald-800 font-bold text-center">
                                ✓ Aceito em Farmácias de todo o Brasil
                              </div>
                            </div>
                          )}

                          {mockup.type === 'memed' && (
                            <div className="space-y-1">
                              <div className="bg-slate-900 text-emerald-400 rounded p-1 font-bold text-[7px]">
                                🛡️ Memed Oficial + ICP-Brasil
                              </div>
                              <div className="bg-white border rounded p-1 text-[7px] space-y-0.5">
                                <span className="font-bold block">
                                  Certificado ICP-Brasil Padrão A3
                                </span>
                                <span className="text-slate-400 block">ID: MEMED-9841-BR</span>
                                <span className="text-emerald-600 font-bold block">
                                  Validade Jurídica
                                </span>
                              </div>
                            </div>
                          )}

                          {mockup.type === 'chat' && (
                            <div className="space-y-1">
                              <div className="bg-white border rounded p-1 text-[7px] flex items-center gap-1">
                                <div className="h-3 w-3 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[6px]">
                                  DR
                                </div>
                                <span className="font-bold">Dr. Rafael Oliveira (Online)</span>
                              </div>
                              <div className="bg-slate-200 text-slate-800 rounded p-1 text-[6px] max-w-[85%]">
                                Seus exames foram liberados! Tudo excelente.
                              </div>
                              <div className="bg-emerald-600 text-white rounded p-1 text-[6px] ml-auto max-w-[85%]">
                                Muito obrigada Dr.!
                              </div>
                            </div>
                          )}

                          {mockup.type === 'doctor_dashboard' && (
                            <div className="space-y-1">
                              <div className="bg-emerald-800 text-white rounded p-1 font-bold text-[7px]">
                                🩺 Painel Clínico do Médico
                              </div>
                              <div className="grid grid-cols-2 gap-1 text-[6px]">
                                <div className="bg-white border rounded p-1 font-bold">
                                  8 Consultas Hoje
                                </div>
                                <div className="bg-white border rounded p-1 font-bold">
                                  142 Receitas Memed
                                </div>
                              </div>
                              <div className="bg-white border rounded p-1 text-[6px]">
                                <span className="font-bold text-emerald-700 block">
                                  Próximo Paciente:
                                </span>
                                <span>Mariana Costa (Sala Virtual)</span>
                              </div>
                            </div>
                          )}

                          {mockup.type === 'home' && (
                            <div className="space-y-1">
                              <div className="bg-emerald-700 text-white rounded p-1 font-bold text-[7px]">
                                👋 Olá, Mariana Costa
                              </div>
                              <div className="grid grid-cols-2 gap-1 text-[6px]">
                                <div className="bg-white border rounded p-1 font-bold">
                                  🩺 Telemedicina
                                </div>
                                <div className="bg-white border rounded p-1 font-bold">
                                  📋 Receitas
                                </div>
                              </div>
                              <div className="bg-emerald-50 text-emerald-800 border rounded p-1 text-[6px] font-bold">
                                Próxima consulta hoje às 15:30
                              </div>
                            </div>
                          )}

                          {mockup.type === 'security' && (
                            <div className="space-y-1">
                              <div className="bg-slate-900 text-white rounded p-1 font-bold text-[7px]">
                                🔒 Segurança e Privacidade
                              </div>
                              <div className="bg-white border rounded p-0.5 text-[6px] space-y-0.5 font-bold">
                                <div>🛡️ LGPD Lei 13.709/18</div>
                                <div>📜 Normas CFM & Telemedicina</div>
                                <div>🔐 Criptografia Ponta a Ponta</div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Bottom nav mini */}
                        <div className="flex items-center justify-around border-t pt-1 text-[7px] text-slate-400">
                          <span>🏠</span>
                          <span>📅</span>
                          <span>📋</span>
                          <span>👤</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-[7px] text-emerald-200 text-center font-medium">
                      V MED BRASIL Mobile
                    </div>
                  </div>

                  {/* Botão de download individual */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadMockup(mockup)}
                    disabled={isDownloading}
                    className="w-full rounded-full text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-50 hover:text-emerald-900"
                  >
                    {isDownloading ? (
                      <>
                        <div className="h-3 w-3 animate-spin rounded-full border border-emerald-700 border-r-transparent mr-1.5" />
                        Gerando 1080×1920...
                      </>
                    ) : (
                      <>
                        <Download className="h-3.5 w-3.5 mr-1.5" /> Baixar PNG (1080×1920)
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
