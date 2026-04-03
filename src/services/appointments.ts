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

export const createAppointment = async (data: {
  patient_id: string
  professional_id: string
  dateTime: string
  type: string
  status: string
  notes?: string
}) => {
  return pb.collection('appointments').create(data)
}

export const updateAppointmentStatus = async (id: string, status: string) => {
  return pb.collection('appointments').update(id, { status })
}
