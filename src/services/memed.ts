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

/**
 * Obtém a integração Memed do médico logado ou especificado
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
 * Cria ou atualiza a integração Memed de um médico
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
 * Desconecta a integração Memed do médico
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
