import pb from '@/lib/pocketbase/client'

export interface CrmMetrics {
  newClients: number
  earnedValues: number
  completedTasks: number
}

export interface PipelineStage {
  label: string
  value: number
  count: number
  color: string
}

export const mockLeads = [
  {
    id: 'mock-1',
    name: 'TechHealth Solutions',
    email: 'contato@techhealth.com',
    phone: '(11) 3456-7890',
    tax_id: '12.345.678/0001-90',
    type: 'company',
    employee_count: 150,
    benefit_intention: 'Plano Saúde Empresarial',
    status: 'pending',
    created: new Date().toISOString(),
    metadata: { segment: 'Tecnologia', source: 'Website' },
  },
  {
    id: 'mock-2',
    name: 'Indústria MedBrasil',
    email: 'rh@indmedbrasil.com',
    phone: '(11) 9876-5432',
    tax_id: '98.765.432/0001-10',
    type: 'company',
    employee_count: 300,
    benefit_intention: 'Benefícios Flexíveis',
    status: 'contacted',
    created: new Date().toISOString(),
    metadata: { segment: 'Indústria', source: 'Indicação' },
  },
  {
    id: 'mock-3',
    name: 'Grupo Vida Plena',
    email: 'contato@vidaplena.com',
    phone: '(21) 2345-6789',
    tax_id: '45.678.901/0001-23',
    type: 'company',
    employee_count: 75,
    benefit_intention: 'Vale-Saúde',
    status: 'converted',
    created: new Date().toISOString(),
    metadata: { segment: 'Saúde', source: 'LinkedIn' },
  },
]

export const getCrmMetrics = async (): Promise<CrmMetrics> => {
  try {
    const [companies, convertedLeads, transactions, completedAppts] = await Promise.all([
      pb.collection('users').getList(1, 1, { filter: 'role="company"' }),
      pb.collection('registration_leads').getList(1, 1, { filter: 'status="converted"' }),
      pb.collection('benefit_transactions').getFullList({ filter: 'type="credit"' }),
      pb.collection('appointments').getList(1, 1, { filter: 'status="completed"' }),
    ])
    const earned = transactions.reduce((sum, t) => sum + (t.amount || 0), 0)
    return {
      newClients: companies.totalItems + convertedLeads.totalItems,
      earnedValues: earned,
      completedTasks: completedAppts.totalItems,
    }
  } catch {
    return { newClients: 0, earnedValues: 0, completedTasks: 0 }
  }
}

export const getCrmLeads = async (filters?: { status?: string; type?: string }) => {
  const parts: string[] = []
  if (filters?.status && filters.status !== 'all') parts.push(`status="${filters.status}"`)
  if (filters?.type && filters.type !== 'all') parts.push(`type="${filters.type}"`)
  return pb.collection('registration_leads').getList(1, 100, {
    filter: parts.join(' && ') || '',
    sort: '-created',
  })
}

export const createCrmLead = async (data: {
  name: string
  email: string
  phone: string
  tax_id?: string
  type: string
  employee_count?: number
  benefit_intention?: string
  status: string
  metadata: Record<string, any>
}) => {
  return pb.collection('registration_leads').create(data)
}

export const getPipelineData = async (): Promise<PipelineStage[]> => {
  const leads = await pb.collection('registration_leads').getFullList({ sort: '-created' })
  const stages: PipelineStage[] = [
    { label: 'Qualificação', value: 0, count: 0, color: 'hsl(var(--chart-3))' },
    { label: 'Proposta de Valor', value: 0, count: 0, color: 'hsl(var(--chart-2))' },
    { label: 'Negociação', value: 0, count: 0, color: 'hsl(var(--chart-1))' },
  ]
  const stageMap: Record<string, number> = { pending: 0, contacted: 1, converted: 2 }
  leads.forEach((l) => {
    const idx = stageMap[l.status] ?? 0
    stages[idx].value += (l.employee_count || 10) * 500
    stages[idx].count++
  })
  if (stages.every((s) => s.count === 0)) {
    stages[0] = { ...stages[0], value: 45000, count: 3 }
    stages[1] = { ...stages[1], value: 82000, count: 2 }
    stages[2] = { ...stages[2], value: 120000, count: 1 }
  }
  return stages
}
