import pb from '@/lib/pocketbase/client'

export type PrescriptionType =
  | 'simples'
  | 'controlado_azul'
  | 'controlado_amarelo'
  | 'exame'
  | 'atestado'

export type PrescriptionStatus = 'rascunho' | 'assinada' | 'enviada'

export interface PrescriptionRecord {
  id: string
  patient_id: string
  professional_id: string
  appointment_id?: string
  medications: string
  pharmacy_instructions?: string
  memed_prescription_id?: string
  document_validation_url?: string
  prescription_type?: PrescriptionType
  status?: PrescriptionStatus
  signed_at?: string
  created: string
  updated: string
  expand?: {
    professional_id?: {
      id: string
      name: string
      specialty?: string
      document_id?: string
      email?: string
      phone?: string
      crm_number?: string
      crm_state?: string
    }
    patient_id?: {
      id: string
      name: string
      document_id?: string
      tax_id?: string
      phone?: string
      email?: string
    }
    appointment_id?: {
      id: string
      dateTime: string
      type?: string
      status?: string
    }
  }
}

export const getPatientPrescriptions = async (patientId: string): Promise<PrescriptionRecord[]> => {
  return pb.collection('prescriptions').getFullList({
    filter: `patient_id = "${patientId}"`,
    sort: '-created',
    expand: 'professional_id,patient_id,appointment_id',
  })
}

export const getDoctorPrescriptions = async (
  professionalId: string,
): Promise<PrescriptionRecord[]> => {
  return pb.collection('prescriptions').getFullList({
    filter: `professional_id = "${professionalId}"`,
    sort: '-created',
    expand: 'patient_id,appointment_id',
  })
}

export const createPrescription = async (data: {
  patient_id: string
  professional_id: string
  appointment_id?: string
  medications: string
  pharmacy_instructions?: string
  memed_prescription_id?: string
  document_validation_url?: string
  prescription_type?: PrescriptionType
  status?: PrescriptionStatus
  signed_at?: string
}): Promise<PrescriptionRecord> => {
  return pb.collection('prescriptions').create(data)
}

export const updatePrescription = async (
  id: string,
  data: Partial<{
    medications: string
    pharmacy_instructions: string
    memed_prescription_id: string
    document_validation_url: string
    prescription_type: PrescriptionType
    status: PrescriptionStatus
    signed_at: string
  }>,
): Promise<PrescriptionRecord> => {
  return pb.collection('prescriptions').update(id, data)
}
