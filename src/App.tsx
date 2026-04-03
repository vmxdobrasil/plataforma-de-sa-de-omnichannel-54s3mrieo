import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

import Layout from './components/Layout'
import { useEffect } from 'react'
import { toast } from 'sonner'
import Index from './pages/Index'
import Search from './pages/Search'
import ProfessionalDashboard from './pages/ProfessionalDashboard'
import HealthProfile from './pages/HealthProfile'
import NotFound from './pages/NotFound'

const App = () => {
  useEffect(() => {
    setTimeout(() => {
      toast.info('Aviso de Sistema', {
        description:
          'Os dados atuais são simulações (mock). Para persistência real, conecte ao Skip Cloud ou Supabase.',
        duration: 8000,
      })
    }, 1500)
  }, [])

  return (
    <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/search" element={<Search />} />
            <Route path="/professional" element={<ProfessionalDashboard />} />
            <Route path="/health-profile" element={<HealthProfile />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  )
}

export default App
