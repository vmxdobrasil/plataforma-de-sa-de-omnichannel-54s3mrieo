import pb from '@/lib/pocketbase/client'

export const getPatientAppointments = async (patientId: string) => {
  return pb.collection('appointments').getFullList({
    filter: `patient_id = "${patientId}"`,
    sort: 'dateTime',
    expand: 'professional_id',
  })
}

export const getProfessionalAppointments = async (professionalId: string) => {
  return pb.collection('appointments').getFullList({
    filter: `professional_id = "${professionalId}"`,
    sort: 'dateTime',
    expand: 'patient_id',
  })
}

export interface AppointmentPaymentData {
  valor?: number
  forma_pagamento?: string
  status_pagamento?: string
  repasse_pct?: number
}

export const createAppointment = async (
  data: {
    patient_id: string
    professional_id: string
    dateTime: string
    type: string
    status: string
    notes?: string
    classification?: string
  } & AppointmentPaymentData,
) => {
  return pb.collection('appointments').create(data)
}

export const updateAppointmentStatus = async (id: string, status: string) => {
  return pb.collection('appointments').update(id, { status })
}

/**
 * Finaliza uma consulta (status = completed) registrando os dados
 * financeiros que disparam o webhook -> GestãoMed.
 */
export const finalizeAppointment = async (id: string, payment: AppointmentPaymentData = {}) => {
  return pb.collection('appointments').update(id, {
    status: 'completed',
    ...payment,
  })
}
