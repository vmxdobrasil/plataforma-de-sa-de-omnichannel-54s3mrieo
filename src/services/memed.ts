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

export interface MemedPrescriberSessionResponse {
  success: boolean
  isConfigured: boolean
  environment: 'sandbox' | 'production'
  scriptUrl: string
  prescriberToken: string
  hasConnectedAccount: boolean
  prescriber: {
    id: string
    name: string
    crm: string
    uf: string
    specialty: string
    email?: string
    phone?: string
  }
  patient?: {
    id: string
    idExterno: string
    nome: string
    cpf: string
    data_nascimento: string
    telefone: string
    email: string
    sexo: string
    cidade: string
    endereco: string
    alergias?: string
  } | null
  error?: string
  message?: string
}

export interface SaveSignedPrescriptionParams {
  patient_id: string
  appointment_id?: string
  memed_prescription_id?: string
  document_validation_url?: string
  prescription_type?: 'simples' | 'controlado_azul' | 'controlado_amarelo' | 'exame' | 'atestado'
  medications: string
  pharmacy_instructions?: string
  is_draft?: boolean
  channels?: ('sms' | 'email')[]
}

export interface PrescriptionDispatchResult {
  channel: 'sms' | 'email'
  status: string
  destination?: string
  details?: string
}

export interface SaveSignedPrescriptionResponse {
  success: boolean
  prescriptionId?: string
  memedPrescriptionId?: string
  documentValidationUrl?: string
  prescriptionType?: string
  status?: string
  signedAt?: string
  appointmentId?: string
  healthRecordId?: string
  dispatches?: PrescriptionDispatchResult[]
  message?: string
  error?: string
}

export interface ResendPrescriptionParams {
  prescription_id: string
  channel: 'sms' | 'email'
  destination?: string
}

export interface ResendPrescriptionResponse {
  success: boolean
  channel?: 'sms' | 'email'
  destination?: string
  status?: string
  details?: string
  message: string
  error?: string
}

/**
 * Obtém a sessão do prescritor com dados do paciente pré-preenchidos e tokens de inicialização
 */
export const getMemedPrescriberSession = async (
  patientId?: string,
): Promise<MemedPrescriberSessionResponse> => {
  const query = patientId ? `?patient_id=${encodeURIComponent(patientId)}` : ''
  return await pb.send<MemedPrescriberSessionResponse>(
    `/backend/v1/memed/prescriber-session${query}`,
    {
      method: 'GET',
    },
  )
}

/**
 * Persiste no backend a prescrição emitida/assinada pela Memed ou rascunho com salvamento resiliente
 */
export const saveMemedPrescription = async (
  data: SaveSignedPrescriptionParams,
): Promise<SaveSignedPrescriptionResponse> => {
  return await pb.send<SaveSignedPrescriptionResponse>(
    '/backend/v1/memed/prescription/save-signed',
    {
      method: 'POST',
      body: data,
    },
  )
}

/**
 * Reenvia a receita digital ao paciente por SMS ou E-mail via canais oficiais da Memed
 * Registra o envio em messages e em audit_logs
 */
export const resendMemedPrescription = async (
  data: ResendPrescriptionParams,
): Promise<ResendPrescriptionResponse> => {
  return await pb.send<ResendPrescriptionResponse>('/backend/v1/memed/prescription/resend', {
    method: 'POST',
    body: data,
  })
}
