import pb from '@/lib/pocketbase/client'

export const getTreatmentPlans = async (patientId: string) => {
  return pb.collection('treatment_plans').getFullList({ filter: `patient_id = "${patientId}"` })
}

export const updateTreatmentPlanStatus = async (id: string, status: string) => {
  return pb.collection('treatment_plans').update(id, { status })
}
