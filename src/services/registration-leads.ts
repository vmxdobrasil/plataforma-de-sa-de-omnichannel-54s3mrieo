import pb from '@/lib/pocketbase/client'

export interface RegistrationLead {
  id: string
  name: string
  email: string
  phone: string
  tax_id: string
  type: 'company' | 'partner' | 'individual'
  employee_count: number
  benefit_intention: string
  status: 'pending' | 'contacted' | 'converted' | 'rejected'
  metadata: Record<string, any>
  created: string
  updated: string
}

export const createLead = async (data: Partial<RegistrationLead>) => {
  return await pb.collection('registration_leads').create({
    ...data,
    status: data.status || 'pending',
  })
}

export const getLeads = async (filter?: string) => {
  return await pb.collection('registration_leads').getFullList({
    sort: '-created',
    filter: filter || '',
  })
}

export const updateLeadStatus = async (
  id: string,
  status: 'pending' | 'contacted' | 'converted' | 'rejected',
) => {
  return await pb.collection('registration_leads').update(id, { status })
}

export const deleteLead = async (id: string) => {
  return await pb.collection('registration_leads').delete(id)
}

export const exportLeadsToCSV = (leads: RegistrationLead[]): string => {
  const headers = [
    'Nome',
    'Email',
    'Telefone',
    'CPF/CNPJ',
    'Tipo',
    'Funcionarios',
    'Intencao Beneficio',
    'Status',
    'Criado em',
  ]
  const rows = leads.map((l) => [
    l.name,
    l.email,
    l.phone,
    l.tax_id,
    l.type,
    l.employee_count?.toString() || '',
    l.benefit_intention || '',
    l.status,
    new Date(l.created).toLocaleDateString('pt-BR'),
  ])
  return [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
}
