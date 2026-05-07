import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { HeartPulse, Stethoscope, ArrowRight } from 'lucide-react'
import logoUrl from '@/assets/image-editing3-e6f7b.png'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
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

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('patient')
  const [crmNumber, setCrmNumber] = useState('')
  const [crmState, setCrmState] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { signIn, signUp, user } = useAuth()
  const navigate = useNavigate()

  if (user) {
    if (user.role === 'medical_director' || user.role === 'admin') {
      return <Navigate to="/admin" replace />
    } else if (user.role === 'company') {
      return <Navigate to="/company/dashboard" replace />
    } else if (user.role === 'professional') {
      return <Navigate to="/professional" replace />
    } else {
      return <Navigate to="/" replace />
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const { error } = await signIn(email, password)
    setIsLoading(false)

    if (error) {
      toast.error(error.message || 'Erro no login. Verifique suas credenciais.')
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
    setIsLoading(true)
    const { error } = await signUp(email, password, name, role, crmNumber, crmState)
    setIsLoading(false)

    if (error) {
      const errs = extractFieldErrors(error)
      const msg = Object.values(errs)[0] || 'Erro ao criar conta.'
      toast.error(msg)
    } else {
      toast.success('Conta criada com sucesso!')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-muted/50 to-muted/10 p-4 sm:p-8">
      {/* Brand Header */}
      <div className="w-full max-w-md flex flex-col items-center text-center mb-6 animate-fade-in-up">
        <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm mb-6 border border-primary/10">
          <img
            src={logoUrl}
            alt="V MED BRASIL Logo"
            className="w-auto h-20 sm:h-24 object-contain transition-transform duration-500 hover:scale-105"
          />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">
          Boas-vindas à <span className="text-primary">V MED BRASIL</span>
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-sm">
          Sua plataforma integrada de saúde, cuidado contínuo e gestão de tratamentos.
        </p>
      </div>

      {/* Main Card */}
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
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground/80">
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 bg-muted/30 focus-visible:ring-primary/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground/80">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 bg-muted/30 focus-visible:ring-primary/50"
                  required
                />
              </div>
              <Button type="submit" className="w-full h-11 text-base group" disabled={isLoading}>
                {isLoading ? 'Entrando...' : 'Entrar na Plataforma'}
                {!isLoading && (
                  <ArrowRight
                    className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
                    strokeWidth={1.5}
                  />
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

              <Button type="submit" className="w-full h-11 text-base group" disabled={isLoading}>
                {isLoading ? 'Criando...' : 'Criar Conta'}
                {!isLoading && (
                  <ArrowRight
                    className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
                    strokeWidth={1.5}
                  />
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
