import { Gift, Share2, Copy, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

export function ReferralCard() {
  const { user } = useAuth()
  if (!user) return null

  const referralCode = user.referral_code || ''
  const points = user.loyalty_points || 0
  const referralLink = `${window.location.origin}/b2c?ref=${referralCode}`

  const shareOnWhatsApp = () => {
    const msg = `Olá! Estou usando a V MED BRASIL para cuidar da minha saúde. Cadastre-se com meu link e ganhe pontos: ${referralLink}`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink)
    toast.success('Link copiado!')
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Gift className="h-5 w-5 text-primary" /> Indique & Ganhe
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 bg-background rounded-lg p-3">
          <Star className="h-5 w-5 text-amber-500" />
          <span className="text-sm text-muted-foreground">Seus pontos:</span>
          <span className="text-lg font-bold text-primary">{points}</span>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Seu código de indicação:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-background rounded-lg p-3 text-center text-lg font-bold tracking-wider">
              {referralCode || 'Gerando...'}
            </code>
            <Button variant="outline" size="icon" onClick={copyLink} disabled={!referralCode}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button className="w-full" onClick={shareOnWhatsApp} disabled={!referralCode}>
          <Share2 className="mr-2 h-4 w-4" /> Compartilhar no WhatsApp
        </Button>
      </CardContent>
    </Card>
  )
}
