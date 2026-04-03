import pb from '@/lib/pocketbase/client'

export const getPatientRecords = async (patientId: string) => {
  return pb.collection('health_records').getFullList({
    filter: `patient_id = "${patientId}"`,
    sort: '-created',
    expand: 'professional_id',
  })
}

export const createHealthRecord = async (data: {
  patient_id: string
  professional_id: string
  content: string
  type: string
}) => {
  return pb.collection('health_records').create(data)
}
