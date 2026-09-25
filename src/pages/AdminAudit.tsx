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
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export default function AdminAudit() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadLogs = async () => {
    try {
      setLoading(true)
      const res = await pb.collection('audit_logs').getList(1, 50, {
        sort: '-created',
        expand: 'user_id',
      })
      setLogs(res.items)
    } catch (error) {
      toast.error('Erro ao carregar logs de auditoria.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Logs de Auditoria</h1>
        <p className="text-muted-foreground mt-1">
          Visualize o registro de ações críticas e de segurança do sistema em modo somente leitura.
        </p>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-primary/20 [&_th]:text-foreground">
            <TableRow className="hover:bg-transparent">
              <TableHead>Data / Hora</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Recurso (Tabela)</TableHead>
              <TableHead>ID do Recurso</TableHead>
              <TableHead>Detalhes / Canal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum log encontrado.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => {
                let parsedDetails: any = null
                try {
                  if (log.details) {
                    parsedDetails =
                      typeof log.details === 'string' ? JSON.parse(log.details) : log.details
                  }
                } catch {
                  /* intentionally ignored */
                }

                return (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-xs">
                      {new Date(log.created).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {log.expand?.user_id?.name || log.expand?.user_id?.email || 'Sistema'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="uppercase text-[10px] font-mono">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      <span className="bg-muted px-1.5 py-0.5 rounded">{log.resource_type}</span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.resource_id || '-'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                      {parsedDetails?.channel ? (
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant="secondary"
                            className="uppercase text-[10px] bg-emerald-100 text-emerald-800"
                          >
                            {parsedDetails.channel}
                          </Badge>
                          <span className="truncate">
                            {parsedDetails.event || parsedDetails.action_type || 'Envio de receita'}
                          </span>
                        </div>
                      ) : parsedDetails?.event ? (
                        <span>{parsedDetails.event}</span>
                      ) : (
                        <span>{typeof log.details === 'string' ? log.details : '-'}</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
