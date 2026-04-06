import pb from '@/lib/pocketbase/client'

export const getPatientHealthGoals = async (patientId: string) => {
  return pb.collection('health_goals').getFullList({
    filter: `patient_id = "${patientId}"`,
    sort: '-created',
  })
}

export const createHealthGoal = async (data: any) => {
  return pb.collection('health_goals').create(data)
}

export const completeHealthGoal = async (id: string) => {
  return pb.collection('health_goals').update(id, { status: 'completed' })
}
