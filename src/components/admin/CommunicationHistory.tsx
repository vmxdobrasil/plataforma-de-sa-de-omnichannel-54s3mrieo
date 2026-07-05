import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Mail, MessageCircle, RotateCcw, RefreshCw } from 'lucide-react'
import { getNotificationLogs, retryNotification } from '@/services/notifications'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'

const statusConfig: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  pending: { label: 'Pendente', variant: 'outline' },
  sent: { label: 'Enviada', variant: 'default' },
  delivered: { label: 'Entregue', variant: 'default' },
  failed: { label: 'Falhou', variant: 'destructive' },
}

export function CommunicationHistory({ recipientId }: { recipientId?: string }) {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [retrying, setRetrying] = useState<string | null>(null)
  const { toast } = useToast()

  const loadLogs = async () => {
    setLoading(true)
    try {
      const res = await getNotificationLogs(1, 50, recipientId)
      setLogs(res.items)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [recipientId])

  useRealtime('notification_logs', () => {
    loadLogs()
  })

  const handleRetry = async (id: string) => {
    setRetrying(id)
    try {
      await retryNotification(id)
      toast({ title: 'Sucesso', description: 'Notificação reenviada com sucesso.' })
      loadLogs()
    } catch {
      toast({
        title: 'Erro',
        description: 'Falha ao reenviar notificação.',
        variant: 'destructive',
      })
    } finally {
      setRetrying(null)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between bg-primary/20 rounded-t-xl border-b border-primary/10">
        <div>
          <CardTitle>Histórico de Comunicação</CardTitle>
          <CardDescription>
            {recipientId
              ? 'Mensagens enviadas a este profissional'
              : 'Todas as comunicações enviadas pela plataforma'}
          </CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={loadLogs} disabled={loading}>
          <RefreshCw className={loading ? 'animate-spin' : ''} />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center p-12 text-muted-foreground border border-dashed rounded-lg bg-muted/20 m-6">
            Nenhuma comunicação registrada.
          </div>
        ) : (
          <ScrollArea className={recipientId ? 'h-[400px]' : 'h-[600px]'}>
            <Table>
              <TableHeader className="bg-muted/50 [&_th]:text-foreground sticky top-0">
                <TableRow className="hover:bg-transparent">
                  {!recipientId && <TableHead className="pl-6">Destinatário</TableHead>}
                  <TableHead>Tipo</TableHead>
                  <TableHead>Assunto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right pr-6">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const recipient = log.expand?.recipient_id
                  return (
                    <TableRow key={log.id}>
                      {!recipientId && (
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarImage
                                src={
                                  recipient?.avatar
                                    ? pb.files.getURL(recipient, recipient.avatar)
                                    : ''
                                }
                              />
                              <AvatarFallback className="text-xs">
                                {recipient?.name?.charAt(0) || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">
                              {recipient?.name || 'Desconhecido'}
                            </span>
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {log.message_type === 'email' ? (
                            <Mail className="h-4 w-4 text-blue-500" />
                          ) : (
                            <MessageCircle className="h-4 w-4 text-green-500" />
                          )}
                          <span className="text-xs capitalize">{log.message_type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <p className="text-sm font-medium truncate">
                            {log.subject || 'Sem assunto'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{log.content}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig[log.status]?.variant || 'secondary'}>
                          {statusConfig[log.status]?.label || log.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            log.priority === 'critical'
                              ? 'border-red-500 text-red-500'
                              : log.priority === 'high'
                                ? 'border-orange-500 text-orange-500'
                                : ''
                          }
                        >
                          {log.priority || 'normal'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(log.created).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        {log.status === 'failed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRetry(log.id)}
                            disabled={retrying === log.id}
                          >
                            {retrying === log.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RotateCcw className="h-4 w-4 mr-1" />
                            )}
                            Reenviar
                          </Button>
                        )}
                        {(log.retry_count || 0) > 0 && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({log.retry_count}x)
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
