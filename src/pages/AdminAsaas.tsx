import { useEffect, useState, useCallback } from 'react'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
import {
  CreditCard,
  Plug,
  PlugZap,
  Copy,
  Check,
  RefreshCw,
  Ban,
  Send,
  Eye,
  ExternalLink,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  CircleDot,
  Wallet,
  Clock,
  XCircle,
  CheckCircle2,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getAsaasConfig,
  saveAsaasConfig,
  testAsaasConnection,
  createAsaasPaymentLink,
  listAsaasTransactions,
  consultAsaasTransaction,
  cancelAsaasTransaction,
  type AsaasConfig,
  type AsaasPaymentLinkResult,
  type AsaasTransaction,
} from '@/services/asaas'

type MethodOption = 'BOLETO' | 'PIX' | 'CREDIT_CARD'

const methodLabel: Record<string, string> = {
  BOLETO: 'Boleto',
  PIX: 'PIX',
  CREDIT_CARD: 'Cartão de Crédito',
}

function statusBadge(status: string) {
  switch (status) {
    case 'confirmed':
    case 'received':
      return (
        <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/25">
          🟢 Pago
        </Badge>
      )
    case 'pending':
      return (
        <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 hover:bg-amber-500/25">
          🟡 Pendente
        </Badge>
      )
    case 'overdue':
      return (
        <Badge className="bg-red-500/15 text-red-600 border-red-500/30 hover:bg-red-500/25">
          🔴 Vencido
        </Badge>
      )
    case 'canceled':
    case 'cancelled':
      return (
        <Badge className="bg-zinc-500/15 text-zinc-500 border-zinc-500/30 hover:bg-zinc-500/25">
          ⚫ Cancelado
        </Badge>
      )
    default:
      return <Badge variant="outline">{status || '-'}</Badge>
  }
}

const formatCurrency = (v: number) =>
  (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const formatDate = (s?: string) => {
  if (!s) return '-'
  try {
    return new Date(s).toLocaleDateString('pt-BR')
  } catch {
    return s
  }
}

async function copyToClipboard(text: string, msg = 'Copiado!') {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(msg)
  } catch {
    // fallback
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    try {
      document.execCommand('copy')
      toast.success(msg)
    } catch {
      toast.error('Não foi possível copiar.')
    }
    document.body.removeChild(ta)
  }
}

export default function AdminAsaas() {
  // ---------- Config state ----------
  const [config, setConfig] = useState<AsaasConfig | null>(null)
  const [configLoading, setConfigLoading] = useState(true)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [environment, setEnvironment] = useState<'sandbox' | 'production'>('production')
  const [savingConfig, setSavingConfig] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [copiedWebhook, setCopiedWebhook] = useState(false)

  // ---------- Payment link state ----------
  const [linkForm, setLinkForm] = useState({
    valor: '',
    descricao: '',
    cliente_nome: '',
    cliente_cpf_cnpj: '',
    data_vencimento: '',
    metodo_pagamento: 'PIX' as MethodOption,
  })
  const [generatingLink, setGeneratingLink] = useState(false)
  const [linkResult, setLinkResult] = useState<AsaasPaymentLinkResult | null>(null)
  const [recentLinks, setRecentLinks] = useState<AsaasTransaction[]>([])
  const [recentLinksLoading, setRecentLinksLoading] = useState(false)

  // ---------- History state ----------
  const [transactions, setTransactions] = useState<AsaasTransaction[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: 'all',
    search: '',
  })

  // ---------- Load config ----------
  const loadConfig = useCallback(async () => {
    setConfigLoading(true)
    try {
      const cfg = await getAsaasConfig()
      setConfig(cfg)
      setEnvironment(cfg.environment || 'production')
      setApiKeyInput(cfg.apiKey || '')
    } catch (err) {
      toast.error('Erro ao carregar configuração Asaas.')
    } finally {
      setConfigLoading(false)
    }
  }, [])

  // ---------- Load recent links ----------
  const loadRecentLinks = useCallback(async () => {
    setRecentLinksLoading(true)
    try {
      const res = await listAsaasTransactions({ page: 1, perPage: 5 })
      setRecentLinks(res.items)
    } catch {
      /* ignore */
    } finally {
      setRecentLinksLoading(false)
    }
  }, [])

  // ---------- Load history ----------
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const res = await listAsaasTransactions({
        page,
        perPage: 10,
        status: filters.status,
        startDate: filters.startDate,
        endDate: filters.endDate,
        search: filters.search,
      })
      setTransactions(res.items)
      setTotalPages(res.totalPages)
      setTotalItems(res.totalItems)
    } catch {
      toast.error('Erro ao carregar histórico de cobranças.')
    } finally {
      setHistoryLoading(false)
    }
  }, [page, filters])

  useEffect(() => {
    loadConfig()
    loadRecentLinks()
  }, [loadConfig, loadRecentLinks])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  // ---------- Handlers ----------
  const handleSaveConfig = async () => {
    setSavingConfig(true)
    try {
      await saveAsaasConfig({ apiKey: apiKeyInput, environment })
      toast.success('Configuração salva com sucesso!')
      await loadConfig()
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao salvar configuração.')
    } finally {
      setSavingConfig(false)
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await testAsaasConnection({
        apiKey: apiKeyInput,
        environment,
      })
      setTestResult({ success: res.success, message: res.message })
      if (res.success) toast.success('✅ Conectado com sucesso!')
      else toast.error('❌ Falha na conexão')
      await loadConfig()
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Erro ao testar conexão.',
      })
      toast.error('❌ Falha na conexão')
    } finally {
      setTesting(false)
    }
  }

  const handleGenerateLink = async () => {
    const valor = parseFloat(linkForm.valor.replace(',', '.'))
    if (!valor || valor <= 0) return toast.error('Informe um valor válido.')
    if (!linkForm.descricao.trim()) return toast.error('Informe uma descrição.')
    if (!linkForm.cliente_nome.trim()) return toast.error('Informe o nome do cliente.')

    setGeneratingLink(true)
    setLinkResult(null)
    try {
      const res = await createAsaasPaymentLink({
        valor,
        descricao: linkForm.descricao.trim(),
        cliente_nome: linkForm.cliente_nome.trim(),
        cliente_cpf_cnpj: linkForm.cliente_cpf_cnpj.trim() || undefined,
        data_vencimento: linkForm.data_vencimento || undefined,
        metodo_pagamento: linkForm.metodo_pagamento,
      })
      setLinkResult(res)
      toast.success('Link de cobrança gerado!')
      await loadRecentLinks()
      await loadHistory()
    } catch (err: any) {
      const msg = err?.response?.message || err?.message || 'Erro ao gerar link de cobrança.'
      toast.error(msg)
    } finally {
      setGeneratingLink(false)
    }
  }

  const handleConsult = async (tx: AsaasTransaction, reload: () => Promise<void>) => {
    try {
      const res = await consultAsaasTransaction(tx.id)
      if (res.success) toast.success('Status atualizado: ' + res.status)
      else toast.error(res.message || 'Falha ao consultar.')
      await reload()
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao consultar status.')
    }
  }

  const handleCancel = async (tx: AsaasTransaction, reload: () => Promise<void>) => {
    if (!confirm('Deseja realmente cancelar esta cobrança?')) return
    try {
      const res = await cancelAsaasTransaction(tx.id)
      if (res.success) toast.success('Cobrança cancelada.')
      else toast.error(res.message || 'Falha ao cancelar.')
      await reload()
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao cancelar cobrança.')
    }
  }

  // ---------- Status banner ----------
  const renderStatusBanner = () => {
    if (configLoading) {
      return (
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-64" />
        </div>
      )
    }
    const hasKey = !!config?.hasApiKey
    const env = config?.environment || environment
    if (hasKey && env === 'production') {
      return (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-xl p-4">
          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          <div>
            <div className="font-semibold text-emerald-700 dark:text-emerald-400">
              🟢 Conectado ao Asaas (produção)
            </div>
            <div className="text-xs text-emerald-600/80">{config?.apiKey || 'Chave protegida'}</div>
          </div>
        </div>
      )
    }
    if (hasKey && env === 'sandbox') {
      return (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-xl p-4">
          <AlertTriangle className="h-6 w-6 text-amber-600" />
          <div>
            <div className="font-semibold text-amber-700 dark:text-amber-400">
              🟡 Conectado ao Asaas (sandbox)
            </div>
            <div className="text-xs text-amber-600/80">{config?.apiKey || 'Chave protegida'}</div>
          </div>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-zinc-500/30 bg-zinc-500/10 backdrop-blur-xl p-4">
        <CircleDot className="h-6 w-6 text-zinc-500" />
        <div>
          <div className="font-semibold text-zinc-700 dark:text-zinc-300">
            ⚪ Asaas não configurado
          </div>
          <div className="text-xs text-zinc-500">
            Informe sua API Key e salve para ativar a integração.
          </div>
        </div>
      </div>
    )
  }

  // ---------- Summary cards ----------
  const summary = {
    total: transactions.length,
    received: transactions.filter((t) => t.status === 'confirmed').length,
    pending: transactions.filter((t) => t.status === 'pending').length,
    overdue: transactions.filter((t) => t.status === 'overdue').length,
    receivedAmount: transactions
      .filter((t) => t.status === 'confirmed')
      .reduce((s, t) => s + (Number(t.valor) || 0), 0),
  }

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      <AdminHeader
        title={
          <>
            <span className="text-primary">Asaas</span> — Gateway de Pagamentos
          </>
        }
        description="Configure a integração Asaas, gere links de cobrança e acompanhe o histórico de cobranças da plataforma."
        icon={<CreditCard className="h-8 w-8" />}
        className="bg-primary/10 border-primary/30"
      />

      {renderStatusBanner()}

      {/* ============== ETAPA 01 — Configuração ============== */}
      <Card className="backdrop-blur-xl bg-white/5 border border-white/10 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="h-5 w-5 text-primary" /> Configuração Asaas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="asaas-apikey">API Key</Label>
              <Input
                id="asaas-apikey"
                type="password"
                autoComplete="off"
                placeholder="Cole aqui a sua API Key do Asaas"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                A chave nunca é exibida em texto claro. Apenas os bullets são mostrados.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Ambiente</Label>
              <Select
                value={environment}
                onValueChange={(v) => setEnvironment(v as 'sandbox' | 'production')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Sandbox</SelectItem>
                  <SelectItem value="production">Produção</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>URL do Webhook</Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={config?.webhookUrl || ''}
                className="font-mono text-xs bg-muted/40"
              />
              <Button
                variant="outline"
                onClick={async () => {
                  await copyToClipboard(config?.webhookUrl || '', 'URL do webhook copiada!')
                  setCopiedWebhook(true)
                  setTimeout(() => setCopiedWebhook(false), 1500)
                }}
              >
                {copiedWebhook ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Configure esta URL no painel do Asaas para receber notificações automáticas.
            </p>
          </div>

          {testResult && (
            <div
              className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
                testResult.success
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              )}
              <span>
                {testResult.success ? '✅ ' : '❌ '}
                {testResult.message}
              </span>
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <Button onClick={handleTestConnection} disabled={testing} variant="secondary">
              {testing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <PlugZap className="h-4 w-4 mr-2" />
              )}
              Testar Conexão
            </Button>
            <Button onClick={handleSaveConfig} disabled={savingConfig}>
              {savingConfig ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4 mr-2" />
              )}
              Salvar Configuração
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ============== ETAPA 02 — Gerar Link de Cobrança ============== */}
      <Card className="backdrop-blur-xl bg-white/5 border border-white/10 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" /> Gerar Link de Cobrança
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="link-valor">Valor (R$) *</Label>
              <Input
                id="link-valor"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={linkForm.valor}
                onChange={(e) => setLinkForm({ ...linkForm, valor: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-cliente">Nome do Cliente *</Label>
              <Input
                id="link-cliente"
                placeholder="Nome completo ou razão social"
                value={linkForm.cliente_nome}
                onChange={(e) => setLinkForm({ ...linkForm, cliente_nome: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-cpf">CPF/CNPJ</Label>
              <Input
                id="link-cpf"
                placeholder="000.000.000-00"
                value={linkForm.cliente_cpf_cnpj}
                onChange={(e) => setLinkForm({ ...linkForm, cliente_cpf_cnpj: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="link-desc">Descrição *</Label>
              <Textarea
                id="link-desc"
                placeholder="Descrição da cobrança"
                value={linkForm.descricao}
                onChange={(e) => setLinkForm({ ...linkForm, descricao: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-venc">Data de Vencimento</Label>
              <Input
                id="link-venc"
                type="date"
                value={linkForm.data_vencimento}
                onChange={(e) => setLinkForm({ ...linkForm, data_vencimento: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Método de Pagamento</Label>
              <Select
                value={linkForm.metodo_pagamento}
                onValueChange={(v) =>
                  setLinkForm({ ...linkForm, metodo_pagamento: v as MethodOption })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BOLETO">Boleto</SelectItem>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleGenerateLink} disabled={generatingLink}>
            {generatingLink ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4 mr-2" />
            )}
            Gerar Link de Cobrança
          </Button>

          {linkResult && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <CheckCircle2 className="h-4 w-4" /> Link de pagamento gerado
              </div>
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                <Input
                  readOnly
                  value={linkResult.link}
                  className="font-mono text-xs bg-muted/40 flex-1"
                />
                <Button
                  variant="secondary"
                  onClick={() => copyToClipboard(linkResult.link, 'Link copiado!')}
                >
                  <Copy className="h-4 w-4 mr-2" /> Copiar Link
                </Button>
                <Button variant="outline" asChild>
                  <a href={linkResult.link} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" /> Abrir
                  </a>
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Valor</div>
                  <div className="font-semibold">{formatCurrency(linkResult.valor)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Método</div>
                  <div className="font-semibold">
                    {methodLabel[linkResult.metodo] || linkResult.metodo}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Vencimento</div>
                  <div className="font-semibold">{formatDate(linkResult.vencimento)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Status</div>
                  <div>{statusBadge(linkResult.status)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Tabela de links gerados (recentes) */}
          <div className="mt-2">
            <div className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4" /> Links gerados recentemente
            </div>
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <Table>
                <TableHeader className="bg-primary/10 [&_th]:text-foreground">
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Data</TableHead>
                    <TableHead>Valor (R$)</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentLinksLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : recentLinks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                        Nenhum link gerado ainda.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentLinks.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="whitespace-nowrap">{formatDate(t.created)}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(t.valor)}</TableCell>
                        <TableCell className="max-w-[180px] truncate">{t.cliente_nome}</TableCell>
                        <TableCell>
                          {methodLabel[t.metodo_pagamento] || t.metodo_pagamento}
                        </TableCell>
                        <TableCell>{statusBadge(t.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Copiar Link"
                              onClick={() =>
                                copyToClipboard(t.link_pagamento || t.invoice_url, 'Link copiado!')
                              }
                              disabled={!t.link_pagamento && !t.invoice_url}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Atualizar Status"
                              onClick={() => handleConsult(t, loadRecentLinks)}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            {t.status === 'pending' && (
                              <Button
                                size="icon"
                                variant="ghost"
                                title="Cancelar Cobrança"
                                onClick={() => handleCancel(t, loadRecentLinks)}
                              >
                                <Ban className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ============== ETAPA 03 — Histórico de Cobranças ============== */}
      <Card className="backdrop-blur-xl bg-white/5 border border-white/10 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" /> Histórico de Cobranças
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary cards */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {historyLoading ? (
              <>
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
              </>
            ) : (
              <>
                <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CreditCard className="h-4 w-4" /> Total de Cobranças
                  </div>
                  <div className="text-2xl font-bold mt-1">{totalItems}</div>
                </div>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-sm p-4">
                  <div className="flex items-center gap-2 text-xs text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" /> Total Recebido
                  </div>
                  <div className="text-2xl font-bold mt-1 text-emerald-600">
                    {formatCurrency(summary.receivedAmount)}
                  </div>
                </div>
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-sm p-4">
                  <div className="flex items-center gap-2 text-xs text-amber-600">
                    <Clock className="h-4 w-4" /> Pendentes
                  </div>
                  <div className="text-2xl font-bold mt-1 text-amber-600">{summary.pending}</div>
                </div>
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 backdrop-blur-sm p-4">
                  <div className="flex items-center gap-2 text-xs text-red-600">
                    <XCircle className="h-4 w-4" /> Vencidas
                  </div>
                  <div className="text-2xl font-bold mt-1 text-red-600">{summary.overdue}</div>
                </div>
              </>
            )}
          </div>

          {/* Filters */}
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs">Data inicial</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => {
                  setPage(1)
                  setFilters({ ...filters, startDate: e.target.value })
                }}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Data final</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => {
                  setPage(1)
                  setFilters({ ...filters, endDate: e.target.value })
                }}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(v) => {
                  setPage(1)
                  setFilters({ ...filters, status: v })
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="confirmed">Pago</SelectItem>
                  <SelectItem value="overdue">Vencido</SelectItem>
                  <SelectItem value="canceled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Buscar cliente</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Nome do cliente..."
                  value={filters.search}
                  onChange={(e) => {
                    setPage(1)
                    setFilters({ ...filters, search: e.target.value })
                  }}
                />
              </div>
            </div>
          </div>

          {/* Full table */}
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <Table>
              <TableHeader className="bg-primary/10 [&_th]:text-foreground">
                <TableRow className="hover:bg-transparent">
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor (R$)</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhuma cobrança encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="whitespace-nowrap">{formatDate(t.created)}</TableCell>
                      <TableCell className="max-w-[160px] truncate">{t.cliente_nome}</TableCell>
                      <TableCell className="max-w-[180px] truncate">{t.descricao}</TableCell>
                      <TableCell className="font-semibold whitespace-nowrap">
                        {formatCurrency(t.valor)}
                      </TableCell>
                      <TableCell>{methodLabel[t.metodo_pagamento] || t.metodo_pagamento}</TableCell>
                      <TableCell>{statusBadge(t.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Atualizar Status"
                            onClick={() => handleConsult(t, loadHistory)}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          {t.status === 'pending' && (
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Cancelar Cobrança"
                              onClick={() => handleCancel(t, loadHistory)}
                            >
                              <Ban className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Copiar Link"
                            onClick={() =>
                              copyToClipboard(t.link_pagamento || t.invoice_url, 'Link copiado!')
                            }
                            disabled={!t.link_pagamento && !t.invoice_url}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Reenviar"
                            onClick={() =>
                              copyToClipboard(
                                t.link_pagamento || t.invoice_url,
                                'Link copiado para reenvio!',
                              )
                            }
                            disabled={!t.link_pagamento && !t.invoice_url}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Página {page} de {totalPages} • {totalItems} cobrança(ões)
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" /> Anterior
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Próxima <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
