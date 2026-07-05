import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { CrmSidebar } from '@/components/crm/CrmSidebar'
import { CrmHeader } from '@/components/crm/CrmHeader'
import { CrmMetrics } from '@/components/crm/CrmMetrics'
import { CrmInteractionHistory } from '@/components/crm/CrmInteractionHistory'
import { CrmTaskAgenda } from '@/components/crm/CrmTaskAgenda'
import { CrmSalesFunnel } from '@/components/crm/CrmSalesFunnel'
import { CrmProfilePanel } from '@/components/crm/CrmProfilePanel'
import { CrmLeadsView } from '@/components/crm/CrmLeadsView'
import { getCrmMetrics, getPipelineData } from '@/services/crm'
import { useRealtime } from '@/hooks/use-realtime'

export default function AdminCRM() {
  const { user } = useAuth()
  const [activeView, setActiveView] = useState('dashboard')
  const [activeTab, setActiveTab] = useState('Resumo')
  const [search, setSearch] = useState('')
  const [metrics, setMetrics] = useState({ newClients: 0, earnedValues: 0, completedTasks: 0 })
  const [pipeline, setPipeline] = useState<any[]>([])
  const [selectedLead, setSelectedLead] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [m, p] = await Promise.all([getCrmMetrics(), getPipelineData()])
      setMetrics(m)
      setPipeline(p)
    } catch {
      /* ignore */
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])
  useRealtime('registration_leads', () => loadData())

  return (
    <div className="flex gap-4 min-h-[calc(100vh-10rem)]">
      <CrmSidebar activeView={activeView} onViewChange={setActiveView} />
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        <CrmHeader
          search={search}
          onSearchChange={setSearch}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userName={user?.name || 'Admin'}
          userRole={user?.role || 'admin'}
        />
        <div className="flex gap-4 flex-1">
          <div className="flex-1 min-w-0 space-y-4">
            {activeView === 'leads' ? (
              <CrmLeadsView searchQuery={search} onSelectLead={setSelectedLead} />
            ) : (
              <>
                <div className="glass-card p-5">
                  <h2 className="text-xl font-bold">Visão Geral do Cliente</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Acompanhe leads, pipeline e crescimento de clientes corporativos B2B em tempo
                    real.
                  </p>
                </div>
                <CrmMetrics metrics={metrics} loading={loading} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <CrmInteractionHistory />
                  <CrmTaskAgenda />
                </div>
                <CrmSalesFunnel data={pipeline} loading={loading} />
              </>
            )}
          </div>
          <div className="hidden xl:block w-80 shrink-0">
            <CrmProfilePanel lead={selectedLead} />
          </div>
        </div>
      </div>
    </div>
  )
}
