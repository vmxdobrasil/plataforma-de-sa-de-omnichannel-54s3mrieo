import { Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'

export function InviteLinks() {
  const getUrl = (role: string) => `${window.location.origin}/signup?role=${role}`

  const copyLink = (role: string) => {
    navigator.clipboard.writeText(getUrl(role))
    toast.success('Link copiado para a área de transferência')
  }

  const roles = [
    { id: 'professional', label: 'Profissional de Saúde' },
    { id: 'company', label: 'Empresa (Cliente Corporativo)' },
    { id: 'pharmacy', label: 'Farmácia/Drogaria' },
    { id: 'laboratory', label: 'Laboratório/Clínica de Imagem' },
  ]

  return (
    <ScrollArea className="h-[60vh] pr-4">
      <div className="space-y-6 py-4">
        <div className="text-sm text-muted-foreground mb-4">
          Copie os links abaixo e envie para os parceiros. Ao acessarem, eles serão direcionados
          para a página de cadastro com o perfil correto pré-selecionado.
        </div>
        {roles.map((r) => (
          <div key={r.id} className="space-y-2">
            <Label className="text-sm font-medium">{r.label}</Label>
            <div className="flex items-center gap-2">
              <Input readOnly value={getUrl(r.id)} className="bg-muted font-mono text-xs flex-1" />
              <Button
                variant="secondary"
                size="icon"
                onClick={() => copyLink(r.id)}
                title="Copiar Link"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
