import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

import { AuthProvider, useAuth } from './hooks/use-auth'
import Layout from './components/Layout'
import Index from './pages/Index'
import Search from './pages/Search'
import ProfessionalDashboard from './pages/ProfessionalDashboard'
import HealthProfile from './pages/HealthProfile'
import NotFound from './pages/NotFound'
import Login from './pages/Login'
import CompanyDashboard from './pages/CompanyDashboard'
import BenefitStatement from './pages/BenefitStatement'
import HRSimulator from './pages/HRSimulator'
import Documents from './pages/Documents'
import Settings from './pages/Settings'
import AdminSettings from './pages/AdminSettings'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" />
  return <>{children}</>
}

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Index />} />
        <Route path="/search" element={<Search />} />
        <Route path="/professional" element={<ProfessionalDashboard />} />
        <Route path="/health-profile" element={<HealthProfile />} />
        <Route path="/company/dashboard" element={<CompanyDashboard />} />
        <Route path="/benefits/statement" element={<BenefitStatement />} />
        <Route path="/hr/simulator" element={<HRSimulator />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

const App = () => {
  return (
    <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <AppRoutes />
        </AuthProvider>
      </TooltipProvider>
    </BrowserRouter>
  )
}

export default App
