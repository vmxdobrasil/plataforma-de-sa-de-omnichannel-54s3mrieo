import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import pb from '@/lib/pocketbase/client'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

export default function Signup() {
  const [searchParams] = useSearchParams()
  const role = searchParams.get('role') || 'patient'
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const roleLabels: Record<string, string> = {
    patient: 'Paciente',
    professional: 'Profissional de Saúde',
    company: 'Empresa / Corporativo',
    pharmacy: 'Farmácia / Drogaria',
    laboratory: 'Laboratório',
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    const formData = new FormData(e.currentTarget)

    try {
      await pb.collection('users').create({
        role,
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        passwordConfirm: formData.get('passwordConfirm'),
      })
      toast.success('Cadastro realizado com sucesso! Faça login.')
      navigate('/login')
    } catch (err) {
      setErrors(extractFieldErrors(err))
      toast.error('Erro ao realizar cadastro. Verifique os dados.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-lg border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Cadastro: {roleLabels[role] || 'Usuário'}
          </CardTitle>
          <CardDescription>Crie sua conta na plataforma V MED BRASIL.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome Completo / Razão Social</Label>
              <Input name="name" required />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input type="email" name="email" required />
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label>Senha (mínimo 8 caracteres)</Label>
              <Input type="password" name="password" required minLength={8} />
              {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            </div>
            <div className="space-y-2">
              <Label>Confirmar Senha</Label>
              <Input type="password" name="passwordConfirm" required minLength={8} />
              {errors.passwordConfirm && (
                <p className="text-xs text-red-500">{errors.passwordConfirm}</p>
              )}
            </div>
            <Button className="w-full mt-6" disabled={loading}>
              {loading ? 'Cadastrando...' : 'Finalizar Cadastro'}
            </Button>
            <div className="text-center text-sm mt-4">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Faça login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
