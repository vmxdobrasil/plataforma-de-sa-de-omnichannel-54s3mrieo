import pb from '@/lib/pocketbase/client'

export const getApprovedPartners = async () => {
  return pb.collection('users').getFullList({
    filter: '(role = "pharmacy" || role = "laboratory") && registration_status = "approved"',
    sort: 'name',
  })
}

export const getPartnerProducts = async (partnerId: string) => {
  return pb.collection('pharmacy_products').getFullList({
    filter: `pharmacy_id = "${partnerId}"`,
    sort: 'name',
  })
}

export const validatePharmacyCredit = async (
  cpf: string,
  amount: number,
  category: string,
  description?: string,
) => {
  return pb.send('/backend/v1/validate-pharmacy-credit', {
    method: 'POST',
    body: JSON.stringify({ cpf, amount, category, description }),
    headers: { 'Content-Type': 'application/json' },
  })
}

export const getAllPartnerTransactions = async () => {
  return pb.collection('benefit_transactions').getFullList({
    sort: '-created',
    expand: 'partner_id,employee_id,company_id',
  })
}

export const getExamDocuments = async (patientId: string) => {
  return pb.collection('documents').getFullList({
    filter: `patient_id = "${patientId}" && type = "exam"`,
    sort: '-created',
    expand: 'professional_id,appointment_id',
  })
}
