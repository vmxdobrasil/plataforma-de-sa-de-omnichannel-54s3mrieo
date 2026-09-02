import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { useEffect } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import pb from './lib/pocketbase/client'
import { AuthProvider, useAuth } from './hooks/use-auth'
import { useRealtime } from './hooks/use-realtime'
import { ThemeProvider } from './components/ThemeProvider'
import { DynamicBranding } from './components/DynamicBranding'
import { ErrorBoundary } from './components/ErrorBoundary'
import Layout from './components/Layout'
import Index from './pages/Index'
import Search from './pages/Search'
import ProfessionalDashboard from './pages/ProfessionalDashboard'
import HealthProfile from './pages/HealthProfile'
import NotFound from './pages/NotFound'
import Login from './pages/Login'
import Signup from './pages/Signup'
import CompanyDashboard from './pages/CompanyDashboard'
import CompanyEmployees from './pages/CompanyEmployees'
import CompanyTransactions from './pages/CompanyTransactions'
import BenefitStatement from './pages/BenefitStatement'
import HRSimulator from './pages/HRSimulator'
import Documents from './pages/Documents'
import Settings from './pages/Settings'
import ProfessionalSchedule from './pages/ProfessionalSchedule'
import AdminDashboard from './pages/AdminDashboard'
import AdminSettings from './pages/AdminSettings'
import TelemedicineRoom from './pages/TelemedicineRoom'
import AdminVerification from './pages/AdminVerification'
import AdminSupervision from './pages/AdminSupervision'
import AdminUsers from './pages/AdminUsers'
import AdminInsurance from './pages/AdminInsurance'
import AdminSpecialties from './pages/AdminSpecialties'
import AdminAudit from './pages/AdminAudit'
import AdminPharmacy from './pages/AdminPharmacy'
import AdminAI from './pages/AdminAI'
import AdminTransactions from './pages/AdminTransactions'
import AdminAsaas from './pages/AdminAsaas'
import AdminProfessionals from './pages/AdminProfessionals'
import AdminCompanies from './pages/AdminCompanies'
import AdminFinancialDashboard from './pages/AdminFinancialDashboard'
import AdminInvoices from './pages/AdminInvoices'
import SocialAI from './pages/SocialAI'
import Marketplace from './pages/dashboard/Marketplace'
import BrandKit from './pages/dashboard/BrandKit'
import Academy from './pages/dashboard/Academy'
import AgentsHub from './pages/dashboard/AgentsHub'
import AgencyDashboard from './pages/dashboard/AgencyDashboard'
import PharmacyDashboard from './pages/dashboard/PharmacyDashboard'
import LaboratoryDashboard from './pages/dashboard/LaboratoryDashboard'
import ClinicDashboard from './pages/clinic/ClinicDashboard'
import Forbidden from './pages/Forbidden'
import Pharmacy from './pages/Pharmacy'
import AdminNetwork from './pages/AdminNetwork'
import PartnerDirectory from './pages/PartnerDirectory'
import MyExams from './pages/MyExams'
import PharmacySales from './pages/PharmacySales'
import RegistrationPortal from './pages/RegistrationPortal'
import CompanyRegistration from './pages/registration/CompanyRegistration'
import PartnerRegistration from './pages/registration/PartnerRegistration'
import IndividualRegistration from './pages/registration/IndividualRegistration'
import ProfessionalRegistration from './pages/registration/ProfessionalRegistration'
import AdminLeads from './pages/AdminLeads'
import AdminCRM from './pages/AdminCRM'
import B2CLanding from './pages/B2CLanding'

const EntryPoint = () => {
  const { user, loading } = useAuth()
  const effectiveUser = pb.authStore.record || user

  if (loading) {
    return (
      <div className="flex h-full min-h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium animate-pulse">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!effectiveUser) return <Index />

  if (effectiveUser.role === 'admin') return <Navigate to="/admin" replace />
  if (effectiveUser.role === 'medical_director') return <Navigate to="/admin/supervision" replace />
  if (effectiveUser.role === 'company') return <Navigate to="/company/employees" replace />
  if (effectiveUser.role === 'professional') return <Navigate to="/professional" replace />
  if (effectiveUser.role === 'pharmacy') return <Navigate to="/dashboard/pharmacy" replace />
  if (effectiveUser.role === 'laboratory') return <Navigate to="/dashboard/laboratory" replace />

  return <Index />
}

const ProtectedOutlet = () => {
  const { user, loading } = useAuth()
  const effectiveUser = pb.authStore.record || user

  if (loading) {
    return (
      <div className="flex h-full min-h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium animate-pulse">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!effectiveUser) return <Navigate to="/login" replace />
  return (
    <ErrorBoundary>
      <Outlet />
    </ErrorBoundary>
  )
}

const AdminOutlet = () => {
  const { user, loading } = useAuth()
  const effectiveUser = pb.authStore.record || user

  if (loading) {
    return (
      <div className="flex h-full min-h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium animate-pulse">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!effectiveUser) {
    return <Navigate to="/login" replace />
  }

  if (effectiveUser?.role !== 'medical_director' && effectiveUser?.role !== 'admin') {
    return <Navigate to="/forbidden" replace />
  }

  return (
    <ErrorBoundary>
      <Outlet />
    </ErrorBoundary>
  )
}

const CompanyOutlet = () => {
  const { user, loading } = useAuth()
  const effectiveUser = pb.authStore.record || user

  if (loading) {
    return (
      <div className="flex h-full min-h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium animate-pulse">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!effectiveUser) {
    return <Navigate to="/login" replace />
  }

  if (effectiveUser?.role === 'medical_director' || effectiveUser?.role === 'admin') {
    return (
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    )
  }
  if (effectiveUser?.role !== 'company') {
    return <Navigate to="/forbidden" replace />
  }
  return (
    <ErrorBoundary>
      <Outlet />
    </ErrorBoundary>
  )
}

const CommissionNotifications = () => {
  const { user } = useAuth()

  useRealtime('users', (e) => {
    if (!user) return
    if (e.action !== 'update') return

    if (user.role === 'admin' && e.record.pending_commission_rate) {
      toast('Comissão Pendente', {
        description: `${e.record.name || 'Um parceiro'} solicitou alteração de comissão para ${e.record.pending_commission_rate}%.`,
      })
    } else if (
      (user.role === 'pharmacy' || user.role === 'laboratory') &&
      e.record.id === user.id
    ) {
      if (e.record.commission_rate && !e.record.pending_commission_rate) {
        toast.success('Comissão Aprovada!', {
          description: `Sua taxa de comissão foi atualizada para ${e.record.commission_rate}%.`,
        })
      }
    }
  })

  return null
}

const AppRoutes = () => {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <>
      <CommissionNotifications />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/landing" element={<B2CLanding />} />
        <Route path="/register" element={<RegistrationPortal />} />
        <Route path="/register/company" element={<CompanyRegistration />} />
        <Route path="/register/partner" element={<PartnerRegistration />} />
        <Route path="/register/individual" element={<IndividualRegistration />} />
        <Route path="/register/professional" element={<ProfessionalRegistration />} />

        <Route element={<Layout />}>
          {/* Entry Point / Public / Patient Dashboard */}
          <Route path="/" element={<EntryPoint />} />

          {/* Protected Routes */}
          <Route element={<ProtectedOutlet />}>
            <Route path="/search" element={<Search />} />
            <Route path="/professional" element={<ProfessionalDashboard />} />
            <Route path="/professional/schedule" element={<ProfessionalSchedule />} />
            <Route path="/health-profile" element={<HealthProfile />} />
            <Route path="/pharmacy" element={<Pharmacy />} />
            <Route path="/partners" element={<PartnerDirectory />} />
            <Route path="/my-exams" element={<MyExams />} />
            <Route path="/pharmacy-sales" element={<PharmacySales />} />

            <Route element={<CompanyOutlet />}>
              <Route path="/company/dashboard" element={<CompanyDashboard />} />
              <Route path="/company/employees" element={<CompanyEmployees />} />
              <Route path="/company/transactions" element={<CompanyTransactions />} />
            </Route>

            <Route path="/benefits/statement" element={<BenefitStatement />} />
            <Route path="/hr/simulator" element={<HRSimulator />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/settings" element={<Settings />} />

            <Route element={<AdminOutlet />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/verification" element={<AdminVerification />} />
              <Route path="/admin/supervision" element={<AdminSupervision />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/insurance" element={<AdminInsurance />} />
              <Route path="/admin/specialties" element={<AdminSpecialties />} />
              <Route path="/admin/audit" element={<AdminAudit />} />
              <Route path="/admin/pharmacy" element={<AdminPharmacy />} />
              <Route path="/admin/companies" element={<AdminCompanies />} />
              <Route path="/admin/ai" element={<AdminAI />} />
              <Route path="/admin/transactions" element={<AdminTransactions />} />
              <Route path="/admin/asaas" element={<AdminAsaas />} />
              <Route path="/admin/network" element={<AdminNetwork />} />
              <Route path="/admin/professionals" element={<AdminProfessionals />} />
              <Route path="/admin/financial" element={<AdminFinancialDashboard />} />
              <Route path="/admin/invoices" element={<AdminInvoices />} />
              <Route path="/admin/leads" element={<AdminLeads />} />
              <Route path="/admin/crm" element={<AdminCRM />} />
            </Route>
            <Route path="/telemedicine/:id" element={<TelemedicineRoom />} />
            <Route path="/dashboard/social-ai" element={<SocialAI />} />
            <Route path="/dashboard/marketplace" element={<Marketplace />} />
            <Route path="/dashboard/brand-kit" element={<BrandKit />} />
            <Route path="/dashboard/academy" element={<Academy />} />
            <Route path="/dashboard/agents" element={<AgentsHub />} />
            <Route path="/dashboard/agency" element={<AgencyDashboard />} />
            <Route path="/dashboard/pharmacy" element={<PharmacyDashboard />} />
            <Route path="/dashboard/laboratory" element={<LaboratoryDashboard />} />
            <Route path="/dashboard/clinic" element={<ClinicDashboard />} />
          </Route>
        </Route>
        <Route path="/forbidden" element={<Forbidden />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}

const App = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider defaultTheme="system" storageKey="vmed-theme">
          <TooltipProvider>
            <AuthProvider>
              <DynamicBranding />
              <Toaster />
              <Sonner />
              <AppRoutes />
            </AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
