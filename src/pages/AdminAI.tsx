import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Search, Bot, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export default function AdminAI() {
  const [content, setContent] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedContent, setSelectedContent] = useState<any>(null)

  const loadContent = async () => {
    try {
      setLoading(true)
      const filter = searchTerm ? `topic ~ "${searchTerm}" || content_type ~ "${searchTerm}"` : ''
      const res = await pb.collection('generated_content').getList(1, 50, {
        filter,
        sort: '-created',
        expand: 'professional_id',
      })
      setContent(res.items)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar interações da IA.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContent()
  }, [searchTerm])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" /> Agentes de IA
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitore o conteúdo gerado e as interações com os agentes de IA na plataforma.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por tópico ou tipo..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Profissional</TableHead>
              <TableHead>Tópico</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Tom</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : content.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhuma interação encontrada.
                </TableCell>
              </TableRow>
            ) : (
              content.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    {c.expand?.professional_id?.name || 'Desconhecido'}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{c.topic}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{c.content_type}</Badge>
                  </TableCell>
                  <TableCell>{c.tone}</TableCell>
                  <TableCell>{new Date(c.created).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedContent(c)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedContent} onOpenChange={() => setSelectedContent(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Conteúdo Gerado - {selectedContent?.content_type}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground font-medium block">Tópico</span>
                <span className="text-sm">{selectedContent?.topic}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground font-medium block">
                  Profissional
                </span>
                <span className="text-sm">{selectedContent?.expand?.professional_id?.name}</span>
              </div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground font-medium block mb-2">
                Resultado da IA
              </span>
              <div className="bg-muted/50 p-4 rounded-xl text-sm whitespace-pre-wrap border">
                {selectedContent?.generated_text}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
