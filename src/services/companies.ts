import pb from '@/lib/pocketbase/client'

export const getEmployees = async (companyId: string) => {
  return pb.collection('users').getFullList({
    filter: `company_id = "${companyId}"`,
    sort: 'name',
  })
}

export const linkEmployee = async (
  email: string,
  allowance: number,
  type: string,
  medAllowance: number,
) => {
  const emp = await pb.collection('users').getFirstListItem(`email="${email}"`)
  if (!emp) throw new Error('Usuário não encontrado.')

  return pb.collection('users').update(emp.id, {
    health_allowance: allowance,
    allowance_type: type,
    medication_allowance: medAllowance,
    company_id: pb.authStore.record?.id,
  })
}

export const registerEmployee = async (
  companyId: string,
  name: string,
  email: string,
  allowance: number,
  type: string,
  medAllowance: number,
) => {
  const password = `Tmp_${Math.random().toString(36)}!`
  return pb.collection('users').create({
    name,
    email,
    password,
    passwordConfirm: password,
    role: 'patient',
    company_id: companyId,
    health_allowance: allowance,
    allowance_type: type,
    medication_allowance: medAllowance,
  })
}

export const updateEmployeeBenefit = async (
  empId: string,
  allowance: number,
  type: string,
  medAllowance: number,
) => {
  return pb.collection('users').update(empId, {
    health_allowance: allowance,
    allowance_type: type,
    medication_allowance: medAllowance,
  })
}

export const getCompanyTransactions = async (companyId: string) => {
  return pb.collection('benefit_transactions').getFullList({
    filter: `company_id = "${companyId}"`,
    sort: '-created',
    expand: 'employee_id',
  })
}

export const executeRenewal = async (companyId: string) => {
  return pb.send(`/backend/v1/companies/${companyId}/renew`, { method: 'POST' })
}
