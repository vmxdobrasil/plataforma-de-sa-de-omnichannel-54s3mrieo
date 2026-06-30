import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Download, TestTube, Calendar, Stethoscope } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { getExamDocuments } from '@/services/partners'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'

export default function MyExams() {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    if (!user?.id) return
    try {
      const docs = await getExamDocuments(user.id)
      setDocuments(docs)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user?.id])
  useRealtime('documents', () => loadData())

  return (
    <div className="space-y-6 pb-10 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <TestTube className="h-8 w-8 text-blue-600" /> Meus Exames
        </h1>
        <p className="text-muted-foreground mt-1">
          Resultados de exames laboratoriais e de imagem.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando exames...</div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
          <TestTube className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhum resultado de exame disponível.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => {
            const fileUrl = pb.files.getURL(doc, doc.file)
            return (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex gap-3 items-center">
                      <div className="bg-blue-500/10 p-2 rounded-lg text-blue-600">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold line-clamp-1">{doc.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(doc.created), "dd 'de' MMM, yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      Exame
                    </Badge>
                  </div>

                  {doc.expand?.professional_id && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Stethoscope className="h-4 w-4" />
                      {doc.expand.professional_id.name}
                    </div>
                  )}
                  {doc.expand?.appointment_id && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(doc.expand.appointment_id.dateTime), 'dd/MM/yyyy HH:mm', {
                        locale: ptBR,
                      })}
                    </div>
                  )}
                  {doc.notes && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{doc.notes}</p>
                  )}

                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href={fileUrl} target="_blank" rel="noreferrer" download>
                      <Download className="h-4 w-4 mr-2" /> Baixar / Visualizar
                    </a>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
