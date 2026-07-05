import { ShieldAlert, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useNavigate } from 'react-router-dom'

export default function Forbidden() {
  const navigate = useNavigate()
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 mb-4">
            <ShieldAlert className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-3xl font-bold mb-2">403</h1>
          <p className="text-muted-foreground">Acesso Proibido</p>
        </div>
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Permissão Negada</AlertTitle>
          <AlertDescription>
            Você não tem permissão para acessar esta página. Por favor, retorne para sua área
            autorizada.
          </AlertDescription>
        </Alert>
        <Button className="w-full" onClick={() => navigate('/')}>
          <Home className="mr-2 h-4 w-4" /> Voltar ao Início
        </Button>
      </div>
    </div>
  )
}
