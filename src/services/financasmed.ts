import pb from '@/lib/pocketbase/client'

export interface FinancasMedPatient {
  id: string
  name: string
  cpf?: string
  birth_date?: string
  phone?: string
  email?: string
  convenio?: string
  origin?: string
  status?: string
  notes?: string
  created?: string
  updated?: string
}

export interface FinancasMedListResponse {
  total: number
  medico_id?: string
  medico_email?: string
  pacientes: FinancasMedPatient[]
  error?: string
}

/**
 * Consulta pacientes de um médico cadastrados no FinançasMed.
 * Faz a chamada ao endpoint autenticado da V MED (/backend/v1/financasmed/pacientes),
 * que repassa para https://financasmed.goskip.app/api/hooks/vmed/pacientes com a X-API-Key segura.
 */
export async function getFinancasMedPacientes(medicoEmail: string): Promise<FinancasMedPatient[]> {
  if (!medicoEmail || !medicoEmail.trim()) {
    return []
  }

  try {
    const res = await pb.send<FinancasMedListResponse>(
      `/backend/v1/financasmed/pacientes?medico_email=${encodeURIComponent(medicoEmail.trim())}`,
      { method: 'GET' },
    )

    if (Array.isArray(res?.pacientes)) {
      return res.pacientes
    }
    return []
  } catch (err) {
    console.warn('[FinançasMed] falha ao buscar pacientes do FinançasMed:', err)
    return []
  }
}
