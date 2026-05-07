import pb from '@/lib/pocketbase/client'

export const getEmployees = async (companyId: string) => {
  return await pb.collection('users').getFullList({
    filter: `company_id = "${companyId}" && role = "patient"`,
    sort: 'name',
  })
}

export const linkEmployee = async (
  email: string,
  health_allowance: number,
  allowance_type: string,
  medication_allowance: number,
) => {
  const companyId = pb.authStore.record?.id
  const user = await pb.collection('users').getFirstListItem(`email = "${email}"`)
  return await pb.collection('users').update(user.id, {
    company_id: companyId,
    health_allowance,
    allowance_type,
    medication_allowance,
  })
}

export const registerEmployee = async (
  companyId: string,
  name: string,
  email: string,
  document_id: string,
  health_allowance: number,
  allowance_type: string,
  medication_allowance: number,
) => {
  const password = Math.random().toString(36).slice(-8) + 'A1!'
  return await pb.collection('users').create({
    name,
    email,
    password,
    passwordConfirm: password,
    document_id,
    role: 'patient',
    company_id: companyId,
    health_allowance,
    allowance_type,
    medication_allowance,
    is_verified: true,
  })
}

export const updateEmployeeBenefit = async (
  id: string,
  health_allowance: number,
  allowance_type: string,
  medication_allowance: number,
) => {
  return await pb.collection('users').update(id, {
    health_allowance,
    allowance_type,
    medication_allowance,
  })
}

export const getCompanyTransactions = async (companyId: string) => {
  return await pb.collection('benefit_transactions').getFullList({
    filter: `company_id = "${companyId}"`,
    sort: '-created',
    expand: 'employee_id,appointment_id',
  })
}

export const executeRenewal = async (companyId?: string) => {
  return await pb.send('/backend/v1/company/renewal', {
    method: 'POST',
    body: companyId ? JSON.stringify({ company_id: companyId }) : undefined,
    headers: { 'Content-Type': 'application/json' },
  })
}
