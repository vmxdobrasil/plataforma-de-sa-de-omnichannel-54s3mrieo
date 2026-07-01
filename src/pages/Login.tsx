import { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { HeartPulse, Stethoscope, ArrowRight, RefreshCcw, WifiOff } from 'lucide-react'
import logoUrl from '@/assets/1002440441png1782862869065-a785f.png'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { cn } from '@/lib/utils'
import pb from '@/lib/pocketbase/client'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('patient')
  const [crmNumber, setCrmNumber] = useState('')
  const [crmState, setCrmState] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isConnected, setIsConnected] = useState(true)
  const [isCheckingConnection, setIsCheckingConnection] = useState(false)

  const { signIn, signUp, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // State Sanitization: Clear any potentially corrupted data
    if (!user) {
      const keysToClear = [
        'lastVisitedPath',
        'last_visited_route',
        'navigation_state',
        'redirect_url',
        'returnTo',
        'last_path',
        'redirect_to',
        'currentRoute',
        'current_route',
      ]
      keysToClear.forEach((key) => {
        try {
          localStorage.removeItem(key)
          sessionStorage.removeItem(key)
        } catch (e) {
          console.error('Erro ao limpar cache', e)
        }
      })
    }
  }, [user])

  const checkConnection = async () => {
    setIsCheckingConnection(true)
    try {
      await pb.health.check()
      setIsConnected(true)
    } catch (e) {
      setIsConnected(false)
    } finally {
      setIsCheckingConnection(false)
    }
  }

  useEffect(() => {
    checkConnection()
  }, [])

  if (user) {
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />
    } else if (user.role === 'medical_director') {
      return <Navigate to="/admin/supervision" replace />
    } else if (user.role === 'company') {
      return <Navigate to="/company/employees" replace />
    } else if (user.role === 'professional') {
      return <Navigate to="/professional" replace />
    } else {
      return <Navigate to="/" replace />
    }
  }

  const validateLogin = () => {
    let isValid = true
    if (!email) {
      setEmailError('O e-mail é obrigatório.')
      isValid = false
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Insira um e-mail válido.')
      isValid = false
    } else {
      setEmailError('')
    }

    if (!password) {
      setPasswordError('A senha é obrigatória.')
      isValid = false
    } else if (password.length < 8) {
      setPasswordError('A senha deve ter no mínimo 8 caracteres.')
      isValid = false
    } else {
      setPasswordError('')
    }
    return isValid
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateLogin()) return

    if (!isConnected) {
      toast.error('Sem conexão com o servidor. Verifique sua rede.')
      return
    }

    setIsLoading(true)
    const { error } = await signIn(email, password)
    setIsLoading(false)

    if (error) {
      if (error?.status === 0 || error?.isAbort) {
        setIsConnected(false)
        toast.error('Falha de conexão com o servidor. Tente novamente.')
      } else {
        toast.error(error.message || 'Erro no login. Verifique suas credenciais.')
      }
    } else {
      toast.success('Bem-vindo de volta!')
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) {
      toast.error('Preencha todos os campos.')
      return
    }
    if (role === 'professional' && (!crmNumber || !crmState)) {
      toast.error('Preencha os campos de CRM obrigatórios.')
      return
    }

    if (!isConnected) {
      toast.error('Sem conexão com o servidor. Verifique sua rede.')
      return
    }

    setIsLoading(true)
    const { error } = await signUp(email, password, name, role, crmNumber, crmState)
    setIsLoading(false)

    if (error) {
      if (error?.status === 0 || error?.isAbort) {
        setIsConnected(false)
        toast.error('Falha de conexão com o servidor. Tente novamente.')
      } else {
        const errs = extractFieldErrors(error)
        const msg = Object.values(errs)[0] || 'Erro ao criar conta.'
        toast.error(msg)
      }
    } else {
      toast.success('Conta criada com sucesso!')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-muted/50 to-muted/10 p-4 sm:p-8">
      <div className="w-full max-w-md flex flex-col items-center text-center mb-6 animate-fade-in-up">
        <div className="rounded-3xl shadow-xl mb-6 border-4 border-white/20 overflow-hidden bg-primary flex items-center justify-center">
          <img
            src={logoUrl}
            alt="V MED Brasil Logo"
            className="w-24 h-24 sm:w-32 sm:h-32 object-cover transition-transform duration-500 hover:scale-105"
          />
        </div>
        <div className="ds-gradient-header w-full p-6 rounded-2xl shadow-md">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
            Boas-vindas à <span className="text-brandAccent">V MED Brasil</span>
          </h1>
          <p className="text-white/80 text-sm sm:text-base max-w-sm mx-auto">
            Sua plataforma integrada de saúde, cuidado contínuo e gestão de tratamentos.
          </p>
        </div>
      </div>

      {!isConnected && (
        <Alert
          variant="destructive"
          className="w-full max-w-md mb-6 animate-fade-in bg-destructive/5"
        >
          <WifiOff className="h-4 w-4" />
          <AlertTitle>Sem conexão com o servidor</AlertTitle>
          <AlertDescription className="flex flex-col gap-3 mt-2">
            Não conseguimos conectar à plataforma. Verifique sua internet ou tente novamente.
            <Button
              variant="outline"
              size="sm"
              onClick={checkConnection}
              disabled={isCheckingConnection}
              className="w-fit bg-background text-foreground"
            >
              <RefreshCcw className={cn('mr-2 h-4 w-4', isCheckingConnection && 'animate-spin')} />
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card
        className="w-full max-w-md shadow-xl border-primary/5 rounded-2xl overflow-hidden animate-fade-in-up"
        style={{ animationDelay: '100ms' }}
      >
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-none h-14 bg-muted/50">
            <TabsTrigger
              value="login"
              className="rounded-none data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all"
            >
              Acessar
            </TabsTrigger>
            <TabsTrigger
              value="signup"
              className="rounded-none data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all"
            >
              Criar Conta
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="p-6 sm:p-8 mt-0">
            <form onSubmit={handleLogin} className="space-y-5" noValidate>
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className={cn('text-foreground/80', emailError && 'text-destructive')}
                >
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (emailError) setEmailError('')
                  }}
                  className={cn(
                    'h-11 bg-muted/30 focus-visible:ring-primary/50',
                    emailError && 'border-destructive',
                  )}
                  required
                />
                {emailError && (
                  <p className="text-sm text-destructive animate-fade-in">{emailError}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className={cn('text-foreground/80', passwordError && 'text-destructive')}
                >
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (passwordError) setPasswordError('')
                  }}
                  className={cn(
                    'h-11 bg-muted/30 focus-visible:ring-primary/50',
                    passwordError && 'border-destructive',
                  )}
                  required
                />
                {passwordError && (
                  <p className="text-sm text-destructive animate-fade-in">{passwordError}</p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full h-11 text-base group"
                disabled={isLoading || !isConnected}
              >
                {isLoading ? (
                  <>
                    <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    Entrar na Plataforma
                    <ArrowRight
                      className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
                      strokeWidth={1.5}
                    />
                  </>
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="p-6 sm:p-8 mt-0">
            <form onSubmit={handleSignup} className="space-y-5">
              <div className="space-y-3">
                <Label className="text-foreground/80">Como você quer usar a plataforma?</Label>
                <RadioGroup
                  defaultValue="patient"
                  onValueChange={setRole}
                  className="grid grid-cols-2 gap-3"
                >
                  <div className="relative">
                    <RadioGroupItem value="patient" id="r1" className="peer sr-only" />
                    <Label
                      htmlFor="r1"
                      className="flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:bg-muted/50"
                    >
                      <HeartPulse className="h-6 w-6 text-primary mb-2" strokeWidth={1.5} />
                      <span className="font-medium text-sm">Paciente</span>
                    </Label>
                  </div>
                  <div className="relative">
                    <RadioGroupItem value="professional" id="r2" className="peer sr-only" />
                    <Label
                      htmlFor="r2"
                      className="flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:bg-muted/50"
                    >
                      <Stethoscope className="h-6 w-6 text-primary mb-2" strokeWidth={1.5} />
                      <span className="font-medium text-sm">Profissional</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-name" className="text-foreground/80">
                  Nome Completo
                </Label>
                <Input
                  id="signup-name"
                  placeholder="João Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 bg-muted/30 focus-visible:ring-primary/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-foreground/80">
                  E-mail
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 bg-muted/30 focus-visible:ring-primary/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-foreground/80">
                  Senha (mín. 8 caracteres)
                </Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 bg-muted/30 focus-visible:ring-primary/50"
                  required
                  minLength={8}
                />
              </div>

              {role === 'professional' && (
                <div
                  className="grid grid-cols-2 gap-4 animate-fade-in-up"
                  style={{ animationDuration: '200ms' }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="crm-number" className="text-foreground/80">
                      CRM
                    </Label>
                    <Input
                      id="crm-number"
                      placeholder="Ex: 123456"
                      value={crmNumber}
                      onChange={(e) => setCrmNumber(e.target.value)}
                      className="h-11 bg-muted/30 focus-visible:ring-primary/50"
                      required={role === 'professional'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="crm-state" className="text-foreground/80">
                      UF
                    </Label>
                    <Select
                      value={crmState}
                      onValueChange={setCrmState}
                      required={role === 'professional'}
                    >
                      <SelectTrigger
                        id="crm-state"
                        className="h-11 bg-muted/30 focus-visible:ring-primary/50"
                      >
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          'AC',
                          'AL',
                          'AP',
                          'AM',
                          'BA',
                          'CE',
                          'DF',
                          'ES',
                          'GO',
                          'MA',
                          'MT',
                          'MS',
                          'MG',
                          'PA',
                          'PB',
                          'PR',
                          'PE',
                          'PI',
                          'RJ',
                          'RN',
                          'RS',
                          'RO',
                          'RR',
                          'SC',
                          'SP',
                          'SE',
                          'TO',
                        ].map((uf) => (
                          <SelectItem key={uf} value={uf}>
                            {uf}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 text-base group"
                disabled={isLoading || !isConnected}
              >
                {isLoading ? (
                  <>
                    <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    Criar Conta
                    <ArrowRight
                      className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
                      strokeWidth={1.5}
                    />
                  </>
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </Card>

      <p
        className="mt-8 text-sm text-muted-foreground text-center max-w-sm animate-fade-in-up"
        style={{ animationDelay: '200ms' }}
      >
        Dica: Para testar, faça login com{' '}
        <strong className="text-foreground">valterpmendonca@gmail.com</strong> e senha{' '}
        <strong className="text-foreground">Skip@Pass</strong>.
      </p>
    </div>
  )
}
