import pb from '@/lib/pocketbase/client'

export const getEmployees = async (companyId: string) => {
  return pb.collection('users').getFullList({
    filter: `company_id = "${companyId}"`,
    sort: 'name',
  })
}

export const linkEmployee = async (
  email: string,
  healthAllowance: number,
  allowanceType: string,
  medicationAllowance: number = 0,
) => {
  const user = await pb.collection('users').getFirstListItem(`email = "${email}"`)
  return pb.collection('users').update(user.id, {
    health_allowance: healthAllowance,
    allowance_type: allowanceType,
    medication_allowance: medicationAllowance,
    company_id: pb.authStore.record?.id,
  })
}

export const registerEmployee = async (
  companyId: string,
  name: string,
  email: string,
  healthAllowance: number,
  allowanceType: string,
  medicationAllowance: number = 0,
) => {
  const password = Math.random().toString(36).slice(-8) + 'A1!'
  return pb.collection('users').create({
    name,
    email,
    password,
    passwordConfirm: password,
    role: 'patient',
    company_id: companyId,
    health_allowance: healthAllowance,
    allowance_type: allowanceType,
    medication_allowance: medicationAllowance,
  })
}

export const updateEmployeeBenefit = async (
  id: string,
  healthAllowance: number,
  allowanceType: string,
  medicationAllowance: number = 0,
) => {
  return pb.collection('users').update(id, {
    health_allowance: healthAllowance,
    allowance_type: allowanceType,
    medication_allowance: medicationAllowance,
  })
}

export const getCompanyTransactions = async (companyId: string) => {
  return pb.collection('benefit_transactions').getFullList({
    filter: `company_id = "${companyId}"`,
  })
}

export const executeRenewal = async () => {
  return pb.send('/backend/v1/company/execute-renewal', {
    method: 'POST',
  })
}
