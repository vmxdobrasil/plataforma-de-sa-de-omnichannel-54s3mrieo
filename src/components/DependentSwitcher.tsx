import { useEffect, useState } from 'react'
import { Check, Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { getDependents, createDependent } from '@/services/users'
import { useRealtime } from '@/hooks/use-realtime'

interface DependentSwitcherProps {
  activeId: string
  setActiveId: (id: string) => void
}

export function DependentSwitcher({ activeId, setActiveId }: DependentSwitcherProps) {
  const { user } = useAuth()
  const [dependents, setDependents] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newDepName, setNewDepName] = useState('')

  const loadDependents = async () => {
    if (!user) return
    try {
      const deps = await getDependents(user.id)
      setDependents(deps)
    } catch (e) {
      console.error('Failed to load dependents', e)
    }
  }

  useEffect(() => {
    loadDependents()
  }, [user])

  useRealtime('users', () => {
    loadDependents()
  })

  const handleAddDependent = async () => {
    if (!user || !newDepName.trim()) return
    try {
      await createDependent({
        name: newDepName,
        parent_id: user.id,
        company_id: user.company_id,
        role: 'patient',
      })
      toast.success('Dependente adicionado com sucesso!')
      setIsAddOpen(false)
      setNewDepName('')
    } catch (e) {
      toast.error('Erro ao adicionar dependente.')
    }
  }

  const activeName =
    activeId === user?.id ? 'Minha Saúde' : dependents.find((d) => d.id === activeId)?.name || ''

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-[200px] justify-between bg-card">
            <span className="truncate">{activeName}</span>
            <Users className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[200px] p-0" align="end">
          <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider px-3 py-2">
            Perfil Ativo
          </DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => setActiveId(user?.id || '')}
            className="flex items-center gap-2 px-3 py-2 cursor-pointer"
          >
            <div className="flex-1 truncate font-medium">Minha Saúde</div>
            {activeId === user?.id && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
          {dependents.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider px-3 py-2">
                Dependentes
              </DropdownMenuLabel>
              {dependents.map((dep) => (
                <DropdownMenuItem
                  key={dep.id}
                  onClick={() => setActiveId(dep.id)}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer"
                >
                  <div className="flex-1 truncate">{dep.name}</div>
                  {activeId === dep.id && <Check className="h-4 w-4 text-primary" />}
                </DropdownMenuItem>
              ))}
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setIsAddOpen(true)}
            className="px-3 py-2 cursor-pointer text-primary focus:text-primary focus:bg-primary/10"
          >
            <Plus className="mr-2 h-4 w-4" /> Adicionar Dependente
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Dependente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input
                placeholder="Ex: João da Silva Júnior"
                value={newDepName}
                onChange={(e) => setNewDepName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Este perfil compartilhará seus benefícios de saúde e farmácia.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddDependent} disabled={!newDepName.trim()}>
              Salvar Dependente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
