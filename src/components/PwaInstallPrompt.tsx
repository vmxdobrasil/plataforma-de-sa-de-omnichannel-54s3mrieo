import { useState, useEffect } from 'react'
import { Download, X, Smartphone, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // 1. Verificar se o app já está em modo standalone (já instalado e aberto como app)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')

    if (isStandalone) {
      setIsInstalled(true)
      return
    }

    // 2. Verificar se o usuário já dispensou recentemente
    const dismissedUntil = localStorage.getItem('vmed_pwa_dismissed_until')
    if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
      return
    }

    // 3. Capturar o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsVisible(true)
    }

    // 4. Capturar confirmação de instalação
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsVisible(false)
      setDeferredPrompt(null)
      localStorage.setItem('vmed_pwa_installed', 'true')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const choiceResult = await deferredPrompt.userChoice
      if (choiceResult.outcome === 'accepted') {
        setIsVisible(false)
        setIsInstalled(true)
      } else {
        // Usuário recusou o prompt nativo
        setIsVisible(false)
      }
    } catch (err) {
      console.warn('Erro ao disparar prompt de instalação PWA:', err)
      setIsVisible(false)
    } finally {
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    // Ocultar por 7 dias após dispensa voluntária
    const sevenDays = Date.now() + 7 * 24 * 60 * 60 * 1000
    localStorage.setItem('vmed_pwa_dismissed_until', sevenDays.toString())
  }

  // Não renderizar se já instalado ou se o evento não estiver disponível
  if (isInstalled || !isVisible || !deferredPrompt) {
    return null
  }

  return (
    <div
      role="region"
      aria-label="Instalar aplicativo V MED BRASIL"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="bg-card border border-primary/30 shadow-2xl rounded-2xl p-4 sm:p-5 flex items-center gap-3.5 backdrop-blur-md bg-card/95">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#14805A] to-[#0B5239] p-2 flex items-center justify-center shrink-0 shadow-md">
          <Smartphone className="h-6 w-6 text-emerald-200" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="font-bold text-sm text-foreground tracking-tight">V MED BRASIL</h4>
            <span className="text-[10px] font-semibold bg-primary/15 text-primary px-1.5 py-0.2 rounded">
              PWA
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            Instale para acesso rápido e consultas offline
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            size="sm"
            onClick={handleInstallClick}
            className="bg-[#14805A] hover:bg-[#0B5239] text-white text-xs font-bold px-3 h-8 rounded-lg shadow-sm"
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            Instalar
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleDismiss}
            className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
            title="Fechar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
