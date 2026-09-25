import pb from '@/lib/pocketbase/client'

export type MemedConnectionStatus = 'desconectado' | 'conectando' | 'conectado' | 'erro'

export interface MemedIntegrationRecord {
  id: string
  doctor_id: string
  connection_status: MemedConnectionStatus
  memed_account_id?: string
  connected_at?: string
  last_sync?: string
  error_log?: Record<string, unknown>
  created: string
  updated: string
  expand?: {
    doctor_id?: {
      id: string
      name: string
      email?: string
      crm_number?: string
      crm_state?: string
    }
  }
}

export interface MemedStatusResponse {
  success: boolean
  isConfigured: boolean
  environment: 'sandbox' | 'production'
  connectionStatus: MemedConnectionStatus
  memedAccountId?: string
  connectedAt?: string
  lastSync?: string
  hasErrorLog?: boolean
  errorLog?: Record<string, unknown> | null
  hasAccessToken?: boolean
}

export interface MemedAuthorizeUrlResponse {
  success: boolean
  isConfigured: boolean
  authorizeUrl?: string
  state?: string
  environment?: string
  error?: string
  message?: string
}

export interface MemedCallbackResponse {
  success: boolean
  message: string
  connectedAt?: string
  memedAccountId?: string
  error?: string
}

export interface MemedRefreshResponse {
  success: boolean
  message: string
  lastSync?: string
  error?: string
}

export interface MemedSandboxTestResponse {
  success: boolean
  mode: 'simulation' | 'live_sandbox'
  isConfigured: boolean
  testStatus: 'passed' | 'warning' | 'ready_for_credentials'
  message: string
  details?: {
    doctorName?: string
    crm?: string
    certificateType?: string
    environment?: string
    partnerStatus?: string
    apiSuccess?: boolean
    simulatedAt?: string
    testedAt?: string
    response?: unknown
    error?: unknown
  }
  error?: string
}

/**
 * Obtém a integração Memed do médico logado ou especificado via SDK do PocketBase
 */
export const getDoctorMemedIntegration = async (
  doctorId: string,
): Promise<MemedIntegrationRecord | null> => {
  try {
    return await pb.collection('memed_integrations').getFirstListItem(`doctor_id = "${doctorId}"`)
  } catch (err: any) {
    if (err?.status === 404) {
      return null
    }
    throw err
  }
}

/**
 * Consulta o status seguro da integração via endpoint server-side
 */
export const getMemedServerStatus = async (): Promise<MemedStatusResponse> => {
  return await pb.send<MemedStatusResponse>('/backend/v1/memed/status', {
    method: 'GET',
  })
}

/**
 * Gera a URL oficial de autorização OAuth da Memed com state anti-CSRF
 */
export const getMemedAuthorizeUrl = async (): Promise<MemedAuthorizeUrlResponse> => {
  return await pb.send<MemedAuthorizeUrlResponse>('/backend/v1/memed/oauth/authorize-url', {
    method: 'GET',
  })
}

/**
 * Envia o código OAuth recebido da Memed para troca server-to-server por tokens
 */
export const exchangeMemedOAuthCallback = async (
  code: string,
  state: string,
): Promise<MemedCallbackResponse> => {
  return await pb.send<MemedCallbackResponse>('/backend/v1/memed/oauth/callback', {
    method: 'POST',
    body: { code, state },
  })
}

/**
 * Dispara refresh silencioso do token expirado no backend
 */
export const refreshMemedToken = async (): Promise<MemedRefreshResponse> => {
  return await pb.send<MemedRefreshResponse>('/backend/v1/memed/token/refresh', {
    method: 'POST',
  })
}

/**
 * Executa validação de conta e teste de assinatura em ambiente de teste/sandbox
 */
export const testMemedSandbox = async (
  certificateType: string = 'CFM_VIDAAS',
): Promise<MemedSandboxTestResponse> => {
  return await pb.send<MemedSandboxTestResponse>('/backend/v1/memed/test-sandbox', {
    method: 'POST',
    body: { certificateType },
  })
}

/**
 * Desconecta a conta Memed com segurança no backend
 */
export const disconnectMemedAccount = async (): Promise<{ success: boolean; message: string }> => {
  return await pb.send<{ success: boolean; message: string }>('/backend/v1/memed/disconnect', {
    method: 'POST',
  })
}

/**
 * Cria ou atualiza a integração Memed de um médico (mantido para compatibilidade)
 */
export const saveDoctorMemedIntegration = async (
  doctorId: string,
  data: {
    connection_status: MemedConnectionStatus
    memed_account_id?: string
    connected_at?: string
    last_sync?: string
    error_log?: Record<string, unknown>
    access_token?: string
    refresh_token?: string
  },
): Promise<MemedIntegrationRecord> => {
  const existing = await getDoctorMemedIntegration(doctorId)

  if (existing) {
    return pb.collection('memed_integrations').update(existing.id, data)
  }

  return pb.collection('memed_integrations').create({
    doctor_id: doctorId,
    ...data,
  })
}

/**
 * Desconecta a integração Memed do médico (mantido para compatibilidade)
 */
export const disconnectDoctorMemed = async (
  doctorId: string,
): Promise<MemedIntegrationRecord | null> => {
  const existing = await getDoctorMemedIntegration(doctorId)
  if (!existing) return null

  return pb.collection('memed_integrations').update(existing.id, {
    connection_status: 'desconectado',
    access_token: '',
    refresh_token: '',
    last_sync: new Date().toISOString(),
  })
}
