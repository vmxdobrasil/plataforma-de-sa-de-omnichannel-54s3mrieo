import pb from '@/lib/pocketbase/client'

export const getEmployees = async (companyId: string) => {
  return pb.collection('users').getFullList({
    filter: `company_id = "${companyId}"`,
    sort: 'name',
  })
}

export const updateEmployeeBenefit = async (
  employeeId: string,
  health_allowance: number,
  allowance_type: string,
) => {
  return pb.collection('users').update(employeeId, {
    health_allowance,
    allowance_type,
  })
}

export const linkEmployee = async (
  email: string,
  health_allowance: number,
  allowance_type: string,
) => {
  return pb.send('/backend/v1/company/link-employee', {
    method: 'POST',
    body: JSON.stringify({ email, health_allowance, allowance_type }),
  })
}

export const registerEmployee = async (
  companyId: string,
  name: string,
  email: string,
  health_allowance: number,
  allowance_type: string,
) => {
  const password = `Skip@${Math.random().toString(36).slice(-6)}`
  return pb.collection('users').create({
    name,
    email,
    password,
    passwordConfirm: password,
    role: 'patient',
    company_id: companyId,
    health_allowance,
    allowance_type,
  })
}
