import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FileText, Download, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRealtime } from '@/hooks/use-realtime'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { ScrollArea } from '@/components/ui/scroll-area'

export function PharmacyDocuments({ partner }: { partner: any }) {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [type, setType] = useState('legal_doc')

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const res = await pb.collection('documents').getList(1, 50, {
        filter: `patient_id = "${partner.id}"`,
        sort: '-created',
      })
      setDocuments(res.items)
    } catch (err) {
      toast.error('Erro ao carregar documentos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [partner.id])

  useRealtime('documents', () => {
    loadDocuments()
  })

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.append('patient_id', partner.id)
    formData.append('type', type)

    try {
      setUploading(true)
      await pb.collection('documents').create(formData)
      toast.success('Documento enviado com sucesso.')
      e.currentTarget.reset()
      setType('legal_doc')
    } catch (err) {
      const errors = extractFieldErrors(err)
      toast.error('Erro ao enviar documento. ' + Object.values(errors).join(' '))
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este documento?')) return
    try {
      await pb.collection('documents').delete(id)
      toast.success('Documento excluído.')
    } catch (err) {
      toast.error('Erro ao excluir documento.')
    }
  }

  return (
    <ScrollArea className="max-h-[60vh] pr-4">
      <div className="space-y-6 py-2 px-1">
        <form onSubmit={handleUpload} className="space-y-4 bg-muted/30 p-4 rounded-lg border">
          <h3 className="font-medium">Novo Documento</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Título do Documento *</Label>
              <Input name="title" required placeholder="Ex: CNPJ, Contrato Social" />
            </div>
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="legal_doc">Documento Legal (CNPJ, Alvará)</SelectItem>
                  <SelectItem value="contract">Contrato</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Arquivo (PDF, JPG, PNG) *</Label>
              <Input type="file" name="file" required accept=".pdf,image/jpeg,image/png" />
            </div>
          </div>
          <Button type="submit" disabled={uploading}>
            {uploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Enviar Documento
          </Button>
        </form>

        <div className="border rounded-lg overflow-hidden bg-card">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Documento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                    Nenhum documento encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <span className="truncate max-w-[200px]" title={doc.title}>
                          {doc.title}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {doc.type === 'contract'
                        ? 'Contrato'
                        : doc.type === 'legal_doc'
                          ? 'Documento Legal'
                          : 'Outro'}
                    </TableCell>
                    <TableCell>{new Date(doc.created).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <a
                            href={pb.files.getURL(doc, doc.file)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(doc.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </ScrollArea>
  )
}
