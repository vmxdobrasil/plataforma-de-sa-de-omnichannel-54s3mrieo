import pb from '@/lib/pocketbase/client'

export const getRevenueData = async (period: 'daily' | 'weekly' | 'monthly') => {
  const now = new Date()
  const days = period === 'daily' ? 7 : period === 'weekly' ? 28 : 90
  const startDate = new Date(now)
  startDate.setDate(startDate.getDate() - days)
  const startStr = startDate.toISOString().split('T')[0]

  const [transactions, logs] = await Promise.all([
    pb.collection('benefit_transactions').getFullList({
      filter: `created >= "${startStr} 00:00:00"`,
      sort: 'created',
    }),
    pb.collection('log_transacoes_asaas').getFullList({
      filter: `created >= "${startStr} 00:00:00"`,
      sort: 'created',
    }),
  ])

  const buckets: Record<string, { gross: number; net: number }> = {}
  const interval = period === 'daily' ? 1 : period === 'weekly' ? 7 : 30

  for (let d = 0; d < days; d += interval) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + d)
    const key = date.toISOString().split('T')[0]
    buckets[key] = { gross: 0, net: 0 }
  }

  transactions.forEach((t) => {
    if (t.type === 'credit') {
      const key = (t.created as string).split(' ')[0].split('T')[0]
      if (buckets[key]) buckets[key].gross += t.amount || 0
    }
  })

  logs.forEach((l) => {
    const key = (l.created as string).split(' ')[0].split('T')[0]
    if (buckets[key]) buckets[key].net += (l.amount || 0) - (l.split_amount || 0)
  })

  return Object.entries(buckets).map(([date, val]) => ({
    date,
    gross: val.gross,
    net: val.net,
  }))
}

export const getVerticalPerformance = async () => {
  const transactions = await pb.collection('benefit_transactions').getFullList({
    filter: `type = 'debit'`,
  })

  const categories: Record<string, number> = {
    health_service: 0,
    exam: 0,
    medication: 0,
    preventive_service: 0,
    emergency_service: 0,
  }

  transactions.forEach((t) => {
    const cat = t.category || 'health_service'
    if (categories[cat] !== undefined) categories[cat] += t.amount || 0
  })

  const labels: Record<string, string> = {
    health_service: 'Consultas Médicas',
    exam: 'Exames',
    medication: 'Farmácia',
    preventive_service: 'Preventivos',
    emergency_service: 'Emergência',
  }

  return Object.entries(categories)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({ name: labels[key] || key, value }))
}

export const getTopProviders = async () => {
  const logs = await pb.collection('log_transacoes_asaas').getFullList({ sort: '-split_amount' })

  const providerIds = new Set<string>()
  logs.forEach((l) => {
    try {
      const meta = JSON.parse((l.metadata as string) || '{}')
      if (meta.provider_id) providerIds.add(meta.provider_id)
    } catch {
      /* intentionally ignored */
    }
  })

  const providers: Record<string, any> = {}
  for (const id of providerIds) {
    try {
      providers[id] = await pb.collection('users').getOne(id)
    } catch {
      /* intentionally ignored */
    }
  }

  const providerMap: Record<string, { name: string; totalCommission: number; txCount: number }> = {}
  logs.forEach((l) => {
    let providerId = ''
    let providerName = 'Desconhecido'
    try {
      const meta = JSON.parse((l.metadata as string) || '{}')
      providerId = meta.provider_id || ''
      if (providerId && providers[providerId]) {
        providerName =
          providers[providerId].name || providers[providerId].business_name || 'Desconhecido'
      }
    } catch {
      /* intentionally ignored */
    }

    const key = providerId || providerName
    if (!providerMap[key]) providerMap[key] = { name: providerName, totalCommission: 0, txCount: 0 }
    providerMap[key].totalCommission += l.split_amount || 0
    providerMap[key].txCount++
  })

  return Object.values(providerMap)
    .sort((a, b) => b.totalCommission - a.totalCommission)
    .slice(0, 10)
}

export const getTransactionLogs = async (filters?: {
  status?: string
  startDate?: string
  endDate?: string
}) => {
  let filter = ''
  if (filters?.status) filter += `status = "${filters.status}"`
  if (filters?.startDate)
    filter += (filter ? ' && ' : '') + `created >= "${filters.startDate} 00:00:00"`
  if (filters?.endDate)
    filter += (filter ? ' && ' : '') + `created <= "${filters.endDate} 23:59:59"`

  return await pb.collection('log_transacoes_asaas').getList(1, 100, {
    filter: filter || undefined,
    sort: '-created',
    expand: 'appointment_id,benefit_transaction_id',
  })
}

export const exportTransactionsCSV = (data: any[]) => {
  const headers = ['Data', 'ID Asaas', 'Valor', 'Split VMX', 'Status']
  const rows = data.map((t) => [
    new Date(t.created).toLocaleString('pt-BR'),
    t.asaas_id || '-',
    (t.amount || 0).toFixed(2),
    (t.split_amount || 0).toFixed(2),
    t.status || '-',
  ])
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `transacoes_asaas_${Date.now()}.csv`
  link.click()
}
