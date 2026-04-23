import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HeartPulse, Stethoscope } from 'lucide-react'
import logoUrl from '@/assets/image-editing1-ddf9f.png'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
    navigate(user.role === 'professional' ? '/professional' : '/')
    return null
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const { error } = await signIn(email, password)
    setIsLoading(false)

    if (error) {
      toast.error('Erro no login. Verifique suas credenciais.')
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
      <div className="mb-8 w-full max-w-md px-4 flex justify-center">
        <img
          src={logoUrl}
          alt="MED Logo"
          className="w-4/5 h-auto max-h-40 object-contain mix-blend-multiply dark:mix-blend-normal dark:bg-white dark:p-4 dark:rounded-2xl"
        />
      </div>

      <Card className="w-full max-w-md shadow-xl border-primary/10">
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Criar Conta</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <CardHeader>
              <CardTitle>Acesse sua conta</CardTitle>
              <CardDescription>
                Gerencie sua saúde de forma integrada em um só lugar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Entrando...' : 'Entrar na Plataforma'}
                </Button>
              </form>
            </CardContent>
          </TabsContent>

          <TabsContent value="signup">
            <CardHeader>
              <CardTitle>Junte-se à MED</CardTitle>
              <CardDescription>Crie sua conta para começar sua jornada.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label>Qual é o seu perfil?</Label>
                  <RadioGroup
                    defaultValue="patient"
                    onValueChange={setRole}
                    className="flex gap-4 pt-2"
                  >
                    <div className="flex items-center space-x-2 border rounded-md p-3 flex-1 cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="patient" id="r1" />
                      <Label htmlFor="r1" className="cursor-pointer flex items-center gap-2">
                        <HeartPulse className="h-4 w-4 text-emerald-500" /> Paciente
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-md p-3 flex-1 cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="professional" id="r2" />
                      <Label htmlFor="r2" className="cursor-pointer flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 text-blue-500" /> Profissional
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome Completo</Label>
                  <Input
                    id="signup-name"
                    placeholder="João Silva"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">E-mail</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha (mín. 8 caracteres)</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>

                {role === 'professional' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="crm-number">Número do CRM</Label>
                      <Input
                        id="crm-number"
                        placeholder="Ex: 123456"
                        value={crmNumber}
                        onChange={(e) => setCrmNumber(e.target.value)}
                        required={role === 'professional'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="crm-state">UF do CRM</Label>
                      <Select
                        value={crmState}
                        onValueChange={setCrmState}
                        required={role === 'professional'}
                      >
                        <SelectTrigger id="crm-state">
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

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Criando...' : 'Criar Conta'}
                </Button>
              </form>
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>

      <p className="mt-8 text-sm text-muted-foreground text-center max-w-sm">
        Dica: Para testar, faça login com <strong>valterpmendonca@gmail.com</strong> e senha{' '}
        <strong>Skip@Pass</strong>.
      </p>
    </div>
  )
}
