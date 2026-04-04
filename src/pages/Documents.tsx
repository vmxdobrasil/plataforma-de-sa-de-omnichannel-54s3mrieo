import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { getDocuments, uploadDocument, deleteDocument } from '@/services/documents'
import { getPatientAppointments, getProfessionalAppointments } from '@/services/appointments'
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Search,
  Folder,
  FileCheck,
  Pill,
  Stethoscope,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import pb from '@/lib/pocketbase/client'

const TYPE_LABELS: Record<string, string> = {
  exam: 'Exame',
  prescription: 'Receita',
  certificate: 'Atestado',
  other: 'Outros',
}

const TYPE_ICONS: Record<string, any> = {
  exam: Stethoscope,
  prescription: Pill,
  certificate: FileCheck,
  other: FileText,
}

export default function Documents() {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Form State
  const [title, setTitle] = useState('')
  const [type, setType] = useState('other')
  const [file, setFile] = useState<File | null>(null)
  const [appointmentId, setAppointmentId] = useState('none')
  const [notes, setNotes] = useState('')

  const loadData = async () => {
    if (!user?.id) return
    try {
      const docs = await getDocuments(user.id)
      setDocuments(docs)

      const appts =
        user.role === 'patient'
          ? await getPatientAppointments(user.id)
          : await getProfessionalAppointments(user.id)
      setAppointments(appts)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [user?.id])
  useRealtime('documents', loadData)

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !title || !user) return

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('type', type)
      formData.append('file', file)
      if (notes) formData.append('notes', notes)

      if (appointmentId !== 'none') {
        formData.append('appointment_id', appointmentId)
        const appt = appointments.find((a) => a.id === appointmentId)
        if (appt) {
          formData.append('patient_id', user.role === 'professional' ? appt.patient_id : user.id)
          formData.append(
            'professional_id',
            user.role === 'professional' ? user.id : appt.professional_id,
          )
        }
      } else {
        if (user.role === 'professional') {
          toast.error('Selecione um agendamento para vincular o paciente.')
          setLoading(false)
          return
        }
        formData.append('patient_id', user.id)
      }

      await uploadDocument(formData)
      toast.success('Documento enviado com sucesso!')
      setIsUploadOpen(false)
      resetForm()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar documento')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este documento?')) return
    try {
      await deleteDocument(id)
      toast.success('Documento excluído.')
    } catch (e) {
      toast.error('Erro ao excluir documento.')
    }
  }

  const resetForm = () => {
    setTitle('')
    setType('other')
    setFile(null)
    setAppointmentId('none')
    setNotes('')
  }

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || doc.type === typeFilter
    return matchesSearch && matchesType
  })

  return (
    <div className="space-y-8 pb-10 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Folder className="h-8 w-8 text-primary" /> Central de Documentos
        </h1>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Upload className="mr-2 h-4 w-4" /> Novo Documento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Enviar Documento</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Ex: Raio-X Torax"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Agendamento Relacionado {user?.role === 'professional' && '*'}</Label>
                <Select value={appointmentId} onValueChange={setAppointmentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um agendamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {appointments.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {format(new Date(a.dateTime), 'dd/MM/yyyy HH:mm', { locale: ptBR })} -{' '}
                        {user?.role === 'professional'
                          ? a.expand?.patient_id?.name
                          : a.expand?.professional_id?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Arquivo * (PDF, JPG, PNG - Max 5MB)</Label>
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Notas Adicionais</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Opcional"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Enviando...' : 'Salvar Documento'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-xl border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="w-full sm:w-[200px]">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredDocs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
          <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum documento encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map((doc) => {
            const Icon = TYPE_ICONS[doc.type] || FileText
            const fileUrl = pb.files.getURL(doc, doc.file)
            const canDelete = doc.patient_id === user?.id || doc.professional_id === user?.id

            return (
              <Card key={doc.id} className="group hover:shadow-md transition-all">
                <CardContent className="p-5 flex flex-col h-full gap-4">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex gap-3 items-center">
                      <div className="bg-primary/10 p-2 rounded-lg text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold line-clamp-1" title={doc.title}>
                          {doc.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(doc.created), "dd 'de' MMM, yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize text-[10px]">
                      {TYPE_LABELS[doc.type]}
                    </Badge>
                  </div>

                  {doc.notes && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{doc.notes}</p>
                  )}

                  <div className="mt-auto pt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <a href={fileUrl} target="_blank" rel="noreferrer" download>
                        <Download className="h-4 w-4 mr-2" /> Baixar
                      </a>
                    </Button>
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(doc.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
