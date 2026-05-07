import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Loader2 } from 'lucide-react'

import { AuthProvider, useAuth } from './hooks/use-auth'
import { ThemeProvider } from './components/ThemeProvider'
import { DynamicBranding } from './components/DynamicBranding'
import Layout from './components/Layout'
import Index from './pages/Index'
import Search from './pages/Search'
import ProfessionalDashboard from './pages/ProfessionalDashboard'
import HealthProfile from './pages/HealthProfile'
import NotFound from './pages/NotFound'
import Login from './pages/Login'
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
import SocialAI from './pages/SocialAI'
import Marketplace from './pages/dashboard/Marketplace'
import BrandKit from './pages/dashboard/BrandKit'
import Academy from './pages/dashboard/Academy'
import AgentsHub from './pages/dashboard/AgentsHub'
import AgencyDashboard from './pages/dashboard/AgencyDashboard'

const ProtectedOutlet = () => {
  const { user, loading } = useAuth()

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

  if (!user) return <Navigate to="/login" />
  return <Outlet />
}

const AdminOutlet = () => {
  const { user } = useAuth()
  if (user?.role !== 'medical_director' && user?.role !== 'admin')
    return <Navigate to="/" replace />
  return <Outlet />
}

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<Layout />}>
        {/* Public Routes */}
        <Route path="/" element={<Index />} />

        {/* Protected Routes */}
        <Route element={<ProtectedOutlet />}>
          <Route path="/search" element={<Search />} />
          <Route path="/professional" element={<ProfessionalDashboard />} />
          <Route path="/professional/schedule" element={<ProfessionalSchedule />} />
          <Route path="/health-profile" element={<HealthProfile />} />
          <Route path="/company/dashboard" element={<CompanyDashboard />} />
          <Route path="/company/employees" element={<CompanyEmployees />} />
          <Route path="/company/transactions" element={<CompanyTransactions />} />
          <Route path="/benefits/statement" element={<BenefitStatement />} />
          <Route path="/hr/simulator" element={<HRSimulator />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/settings" element={<Settings />} />

          <Route element={<AdminOutlet />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/verification" element={<AdminVerification />} />
            <Route path="/admin/supervision" element={<AdminSupervision />} />
          </Route>
          <Route path="/telemedicine/:id" element={<TelemedicineRoom />} />
          <Route path="/dashboard/social-ai" element={<SocialAI />} />
          <Route path="/dashboard/marketplace" element={<Marketplace />} />
          <Route path="/dashboard/brand-kit" element={<BrandKit />} />
          <Route path="/dashboard/academy" element={<Academy />} />
          <Route path="/dashboard/agents" element={<AgentsHub />} />
          <Route path="/dashboard/agency" element={<AgencyDashboard />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

const App = () => {
  return (
    <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
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
  )
}

export default App
