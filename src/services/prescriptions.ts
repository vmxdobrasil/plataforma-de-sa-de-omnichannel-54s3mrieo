import pb from '@/lib/pocketbase/client'

export const getPatientPrescriptions = async (patientId: string) => {
  return pb.collection('prescriptions').getFullList({
    filter: `patient_id = "${patientId}"`,
    sort: '-created',
    expand: 'professional_id',
  })
}

export const createPrescription = async (data: {
  patient_id: string
  professional_id: string
  medications: string
  pharmacy_instructions?: string
}) => {
  return pb.collection('prescriptions').create(data)
}
