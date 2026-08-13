import pb from '@/lib/pocketbase/client'

// =====================================================
// Asaas configuration
// =====================================================
export interface AsaasConfig {
  apiKey: string
  hasApiKey: boolean
  environment: 'sandbox' | 'production'
  webhookUrl: string
  isActive: boolean
  lastTestedAt: string
  lastTestStatus: string
}

export const getAsaasConfig = async (): Promise<AsaasConfig> => {
  return await pb.send('/backend/v1/asaas/config', { method: 'GET' })
}

export const saveAsaasConfig = async (data: {
  apiKey: string
  environment: 'sandbox' | 'production'
}): Promise<{ success: boolean; apiKey: string; environment: string; webhookUrl: string }> => {
  return await pb.send('/backend/v1/asaas/config', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export const testAsaasConnection = async (data: {
  apiKey?: string
  environment?: 'sandbox' | 'production'
}): Promise<{ success: boolean; message: string; balance?: number }> => {
  return await pb.send('/backend/v1/asaas/test-connection', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// =====================================================
// Payment links
// =====================================================
export interface AsaasPaymentLinkResult {
  success: boolean
  paymentId: string
  link: string
  invoiceUrl: string
  valor: number
  metodo: string
  vencimento: string
  status: string
  transacaoId: string
}

export const createAsaasPaymentLink = async (data: {
  valor: number
  descricao: string
  cliente_nome: string
  cliente_cpf_cnpj?: string
  data_vencimento?: string
  metodo_pagamento: 'BOLETO' | 'PIX' | 'CREDIT_CARD'
}): Promise<AsaasPaymentLinkResult> => {
  return await pb.send('/backend/v1/asaas/payment-link', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// =====================================================
// Transactions (history dashboard)
// =====================================================
export interface AsaasTransaction {
  id: string
  asaas_id: string
  asaas_payment_id: string
  valor: number
  descricao: string
  cliente_nome: string
  cliente_cpf_cnpj: string
  metodo_pagamento: string
  status: string
  link_pagamento: string
  invoice_url: string
  data_vencimento: string
  created: string
  updated: string
}

export interface AsaasTransactionList {
  items: AsaasTransaction[]
  page: number
  perPage: number
  totalItems: number
  totalPages: number
}

export const listAsaasTransactions = async (params: {
  page?: number
  perPage?: number
  status?: string
  startDate?: string
  endDate?: string
  search?: string
}): Promise<AsaasTransactionList> => {
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.perPage) query.set('perPage', String(params.perPage))
  if (params.status && params.status !== 'all') query.set('status', params.status)
  if (params.startDate) query.set('startDate', params.startDate)
  if (params.endDate) query.set('endDate', params.endDate)
  if (params.search) query.set('search', params.search)
  const qs = query.toString()
  return await pb.send(`/backend/v1/asaas/transactions${qs ? '?' + qs : ''}`, {
    method: 'GET',
  })
}

export const consultAsaasTransaction = async (
  id: string,
): Promise<{ success: boolean; status: string; asaasStatus: string; message: string }> => {
  return await pb.send(`/backend/v1/asaas/transaction/${id}/consult`, { method: 'POST' })
}

export const cancelAsaasTransaction = async (
  id: string,
): Promise<{ success: boolean; status: string; message: string }> => {
  return await pb.send(`/backend/v1/asaas/transaction/${id}/cancel`, { method: 'POST' })
}

// =====================================================
// Legacy helpers (kept for backwards compatibility)
// =====================================================
export const syncAsaasPayment = async (id: string) => {
  return await pb.send(`/backend/v1/asaas/sync/${id}`, {
    method: 'POST',
  })
}

export const createAsaasPayment = async (data: {
  amount: number
  billingType: string
  description: string
  transactionId?: string
  split?: { walletId: string; percentage: number }
  creditCard?: any
  creditCardHolderInfo?: any
}) => {
  return await pb.send('/backend/v1/asaas/pay', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
