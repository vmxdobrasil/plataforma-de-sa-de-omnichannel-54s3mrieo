import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { CRMSidebar } from '@/components/crm/CRMSidebar'
import { CRMHeader } from '@/components/crm/CRMHeader'
import { CRMDashboardView } from '@/components/crm/CRMDashboardView'
import { CRMLeadsView } from '@/components/crm/CRMLeadsView'
import { NewLeadDialog } from '@/components/crm/NewLeadDialog'

export default function AdminCRM() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [activeHeaderTab, setActiveHeaderTab] = useState('Resumo')
  const [searchQuery, setSearchQuery] = useState('')
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [showNewLead, setShowNewLead] = useState(false)

  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'medical_director') {
      navigate('/forbidden')
    }
  }, [user, navigate])

  const loadLeads = useCallback(async () => {
    try {
      const data = await pb.collection('registration_leads').getFullList({ sort: '-created' })
      setLeads(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadLeads()
  }, [loadLeads])

  useRealtime('registration_leads', () => loadLeads())

  const filteredLeads = useMemo(() => {
    if (!searchQuery.trim()) return leads
    const q = searchQuery.toLowerCase()
    return leads.filter(
      (l) =>
        l.name?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.phone?.toLowerCase().includes(q) ||
        l.type?.toLowerCase().includes(q),
    )
  }, [leads, searchQuery])

  const avatarUrl = user?.avatar
    ? pb.files.getURL({ id: user.id, collectionId: 'users' }, user.avatar)
    : ''

  return (
    <div className="rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4 lg:p-6 min-h-[calc(100vh-8rem)]">
      <div className="flex gap-4 lg:gap-6">
        <CRMSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 min-w-0">
          <CRMHeader
            activeHeaderTab={activeHeaderTab}
            onHeaderTabChange={setActiveHeaderTab}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            userName={user?.name || ''}
            userEmail={user?.email || ''}
            avatarUrl={avatarUrl}
          />

          {activeTab === 'dashboard' && (
            <CRMDashboardView leads={filteredLeads} loading={loading} />
          )}

          {activeTab === 'leads' && (
            <CRMLeadsView
              leads={filteredLeads}
              loading={loading}
              selectedLead={selectedLead}
              onSelectLead={setSelectedLead}
              onNewLead={() => setShowNewLead(true)}
            />
          )}

          {activeTab !== 'dashboard' && activeTab !== 'leads' && (
            <div className="flex flex-col items-center justify-center h-64 backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl">
              <p className="text-white/40 text-lg font-medium">Módulo em desenvolvimento</p>
              <p className="text-white/30 text-sm mt-2">Em breve: {activeTab}</p>
            </div>
          )}
        </div>
      </div>

      <NewLeadDialog open={showNewLead} onOpenChange={setShowNewLead} onSuccess={loadLeads} />
    </div>
  )
}
