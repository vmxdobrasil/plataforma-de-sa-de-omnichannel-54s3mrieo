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
  department?: string,
  matricula?: string,
  job_title?: string,
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
    department: department || '',
    matricula: matricula || '',
    job_title: job_title || '',
  })
}

export const getCompanyStats = async (companyId: string) => {
  const employees = await pb.collection('users').getFullList({
    filter: `company_id = "${companyId}" && role = "patient"`,
  })

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const transactions = await pb.collection('benefit_transactions').getFullList({
    filter: `company_id = "${companyId}" && created >= "${startOfMonth.toISOString().split('T')[0]} 00:00:00"`,
  })

  const totalDebits = transactions
    .filter((t) => t.type === 'debit')
    .reduce((sum, t) => sum + (t.amount || 0), 0)

  const totalCredits = transactions
    .filter((t) => t.type === 'credit')
    .reduce((sum, t) => sum + (t.amount || 0), 0)

  return {
    employeeCount: employees.length,
    activeEmployees: employees.filter((e) => !e.is_blocked).length,
    monthlyUsage: totalDebits,
    monthlyCredits: totalCredits,
  }
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
