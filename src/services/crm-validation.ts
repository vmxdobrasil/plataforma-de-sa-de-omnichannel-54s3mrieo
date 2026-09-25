import { pb } from '@/lib/pocketbase/client'

export const VALID_BRAZILIAN_UFS = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
] as const

export type BrazilianUF = (typeof VALID_BRAZILIAN_UFS)[number]

export interface NormalizedCrm {
  raw: string
  crmNumber: string
  crmUf: string
  formatted: string
  isValidFormat: boolean
  validationError?: string
}

export type CrmSituacao =
  | 'ativo'
  | 'cancelado'
  | 'suspenso'
  | 'cassado'
  | 'nao_localizado'
  | 'em_analise'
  | 'invalido'

export type StatusValidacao = 'pendente' | 'validado' | 'invalidado' | 'validacao_manual'

export type FonteValidacao = 'cfm_webservice' | 'api_terceiro' | 'manual' | 'fallback_resiliente'

export interface CrmValidationResult {
  crm_numero: string
  crm_uf: string
  situacao: CrmSituacao
  especialidade?: string
  nome_cfm?: string
  divergencia_nome?: boolean
  status_validacao: StatusValidacao
  fonte_validacao: FonteValidacao
  observacoes?: string
  can_practice: boolean
}

export interface ProfessionalVerificationRecord {
  id: string
  user: string
  crm_numero: string
  crm_uf: string
  crm_situacao: CrmSituacao
  crm_especialidade?: string
  nome_cfm?: string
  divergencia_nome?: boolean
  status_validacao: StatusValidacao
  fonte_validacao: FonteValidacao
  data_validacao?: string
  resposta_bruta?: unknown
  observacoes_admin?: string
  certidao_arquivo?: string
  created: string
  updated: string
  expand?: {
    user?: {
      id: string
      name: string
      email: string
      phone?: string
      crm_number?: string
      crm_state?: string
      specialty?: string
      is_verified?: boolean
    }
  }
}

/**
 * Normaliza e valida a estrutura do CRM em tempo real:
 * - Remove espaços
 * - Converte UF para uppercase
 * - Aceita "123456/SP", "123456-SP", "123456 SP", "SP 123456", "SP-123456" ou número avulso se UF passada
 * - Valida número de 4 a 8 dígitos + UF válida
 */
export function normalizeCrmInput(crmInput: string, explicitUf?: string): NormalizedCrm {
  const raw = (crmInput || '').trim()
  if (!raw) {
    return {
      raw,
      crmNumber: '',
      crmUf: (explicitUf || '').toUpperCase().trim(),
      formatted: '',
      isValidFormat: false,
      validationError: 'Informe o número do CRM',
    }
  }

  let clean = raw.toUpperCase()
  let uf = explicitUf ? explicitUf.toUpperCase().trim() : ''

  // Padrões aceitos: "SP 123456", "SP/123456", "SP-123456"
  const prefixMatch = clean.match(/^([A-Z]{2})[\s\-/]?(\d{4,8})$/)
  if (prefixMatch) {
    uf = prefixMatch[1]
    clean = prefixMatch[2]
  } else {
    // "123456/SP", "123456-SP", "123456 SP"
    const suffixMatch = clean.match(/^(\d{4,8})[\s\-/]?([A-Z]{2})$/)
    if (suffixMatch) {
      clean = suffixMatch[1]
      uf = suffixMatch[2]
    } else {
      // Caracteres numéricos
      clean = clean.replace(/\D/g, '')
    }
  }

  const isDigitsValid = /^\d{4,8}$/.test(clean)
  const isUfValid = VALID_BRAZILIAN_UFS.includes(uf as BrazilianUF)

  let error: string | undefined
  if (!isDigitsValid) {
    error = 'O CRM deve conter entre 4 e 8 dígitos numéricos'
  } else if (!isUfValid) {
    error = 'Selecione uma Unidade Federativa (UF) válida'
  }

  const formatted = clean && uf ? `${clean}/${uf}` : clean

  return {
    raw,
    crmNumber: clean,
    crmUf: uf,
    formatted,
    isValidFormat: isDigitsValid && isUfValid,
    validationError: error,
  }
}

/**
 * Consulta a validação oficial/resiliente via endpoint seguro do backend
 * Falha de rede NUNCA quebra a aplicação: entra em fallback pendente de verificação
 */
export async function validateCrmOfficial(params: {
  crmNumber: string
  crmUf: string
  doctorName?: string
  userId?: string
  specialty?: string
}): Promise<CrmValidationResult> {
  const norm = normalizeCrmInput(params.crmNumber, params.crmUf)
  if (!norm.isValidFormat) {
    return {
      crm_numero: norm.crmNumber,
      crm_uf: norm.crmUf,
      situacao: 'invalido',
      status_validacao: 'invalidado',
      fonte_validacao: 'fallback_resiliente',
      observacoes: norm.validationError || 'Formato de CRM inválido.',
      can_practice: false,
    }
  }

  try {
    const res = await pb.send<{
      success: boolean
      data: CrmValidationResult
      error?: string
    }>('/backend/v1/crm/validate', {
      method: 'POST',
      body: {
        crm_number: norm.crmNumber,
        crm_state: norm.crmUf,
        name: params.doctorName,
        user_id: params.userId,
        specialty: params.specialty,
      },
    })

    if (res?.data) {
      return res.data
    }
  } catch (err) {
    console.warn('[CRM Client] Validação remota indisponível, usando fallback seguro:', err)
  }

  // Fallback seguro do cliente em caso de erro de conexão ou timeout
  return {
    crm_numero: norm.crmNumber,
    crm_uf: norm.crmUf,
    situacao: 'em_analise',
    status_validacao: 'pendente',
    fonte_validacao: 'fallback_resiliente',
    observacoes:
      'Serviço de validação instantânea temporariamente indisponível. Seu cadastro foi aceito e enviado para conferência automática.',
    can_practice: false,
  }
}

/**
 * Busca o histórico de validações de um profissional
 */
export async function getProfessionalVerifications(
  userId?: string,
): Promise<ProfessionalVerificationRecord[]> {
  try {
    const filter = userId ? `user = "${userId}"` : ''
    const records = await pb
      .collection('professional_verifications')
      .getList<ProfessionalVerificationRecord>(1, 50, {
        filter,
        sort: '-created',
        expand: 'user',
      })
    return records.items
  } catch (err) {
    console.warn('[CRM Service] Erro ao carregar verificações:', err)
    return []
  }
}

/**
 * Busca fila de validações pendentes ou manuais para o Admin / Diretor Médico
 */
export async function getPendingCrmVerifications(): Promise<ProfessionalVerificationRecord[]> {
  try {
    const records = await pb
      .collection('professional_verifications')
      .getList<ProfessionalVerificationRecord>(1, 100, {
        filter: 'status_validacao = "pendente" || status_validacao = "validacao_manual"',
        sort: '-created',
        expand: 'user',
      })
    return records.items
  } catch (err) {
    console.warn('[CRM Service] Erro ao buscar fila de validação:', err)
    return []
  }
}

/**
 * Aprovação ou rejeição manual justificada pelo Administrador / Diretor Médico
 */
export async function reviewCrmVerification(params: {
  verificationId: string
  approved: boolean
  userId: string
  adminNotes: string
  crmSituacao?: CrmSituacao
}): Promise<boolean> {
  try {
    const newStatus: StatusValidacao = params.approved ? 'validado' : 'invalidado'
    const newSituacao: CrmSituacao = params.approved ? params.crmSituacao || 'ativo' : 'suspenso'

    // Atualiza registro da verificação
    await pb.collection('professional_verifications').update(params.verificationId, {
      status_validacao: newStatus,
      crm_situacao: newSituacao,
      fonte_validacao: 'manual',
      data_validacao: new Date().toISOString(),
      observacoes_admin: params.adminNotes,
    })

    // Atualiza status do médico no usuário
    await pb.collection('users').update(params.userId, {
      is_verified: params.approved,
      crm_situacao: newSituacao,
      block_reason: params.approved
        ? ''
        : `Registro profissional não aprovado: ${params.adminNotes}`,
    })

    return true
  } catch (err) {
    console.error('[CRM Service] Falha na revisão manual:', err)
    throw err
  }
}
