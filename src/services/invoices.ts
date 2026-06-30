import pb from '@/lib/pocketbase/client'

export const getInvoices = async (companyId?: string) => {
  const filter = companyId ? `company_id = "${companyId}"` : ''
  return await pb.collection('faturas_empresas').getList(1, 50, {
    filter: filter || undefined,
    sort: '-created',
    expand: 'company_id',
  })
}

export const getInvoice = async (id: string) => {
  return await pb.collection('faturas_empresas').getOne(id, { expand: 'company_id' })
}

export const updateInvoiceStatus = async (id: string, status: 'open' | 'paid' | 'overdue') => {
  return await pb.collection('faturas_empresas').update(id, { status })
}

export const generateInvoice = async (
  companyId: string,
  periodStart: string,
  periodEnd: string,
) => {
  return await pb.send('/backend/v1/invoices/generate', {
    method: 'POST',
    body: JSON.stringify({
      company_id: companyId,
      period_start: periodStart,
      period_end: periodEnd,
    }),
    headers: { 'Content-Type': 'application/json' },
  })
}
