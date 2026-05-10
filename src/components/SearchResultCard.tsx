import {
  Stethoscope,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  MapPin,
  Building2,
  FlaskConical,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import pb from '@/lib/pocketbase/client'

interface SearchResultCardProps {
  r: any
  isAdmin: boolean
  onToggleStatus: (id: string, field: 'is_verified' | 'is_blocked', val: boolean) => void
}

export function SearchResultCard({ r, isAdmin, onToggleStatus }: SearchResultCardProps) {
  const getAvatarUrl = (r: any) => {
    if (r.avatar) return pb.files.getURL(r, r.avatar)
    return `https://api.dicebear.com/7.x/notionists/svg?seed=${r.id}`
  }

  const getRoleIcon = () => {
    if (r.role === 'pharmacy') return <Building2 className="h-3 w-3" />
    if (r.role === 'laboratory') return <FlaskConical className="h-3 w-3" />
    return <Stethoscope className="h-3 w-3" />
  }

  const getRoleLabel = () => {
    if (r.role === 'pharmacy') return 'Farmácia'
    if (r.role === 'laboratory') return 'Laboratório'
    return 'Profissional'
  }

  const nameInitial = (r.name || 'NA').substring(0, 2).toUpperCase()

  return (
    <Card className="hover:bg-muted/50 transition-colors">
      <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-4 flex-1 w-full">
          <Avatar className="h-14 w-14 border-2 border-primary/10">
            <AvatarImage src={getAvatarUrl(r)} />
            <AvatarFallback>{nameInitial}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-semibold text-lg leading-none truncate">
                {r.name || 'Sem nome'}
              </h3>
              {r.business_name && (
                <span
                  className="text-sm text-muted-foreground truncate max-w-[200px] hidden sm:inline-block"
                  title={r.business_name}
                >
                  ({r.business_name})
                </span>
              )}
              {r.is_verified && (
                <ShieldCheck className="h-4 w-4 text-green-500" title="Parceiro Verificado" />
              )}
              {r.is_blocked && (
                <Badge variant="destructive" className="text-[10px] h-5 px-1.5">
                  Bloqueado
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px] h-5 px-1.5 flex items-center gap-1">
                {getRoleIcon()}
                {getRoleLabel()}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap mt-2">
              {r.specialty && (
                <Badge variant="secondary" className="font-normal">
                  {r.specialty}
                </Badge>
              )}
              {r.crm_number && r.role === 'professional' && (
                <span className="text-xs">
                  CRM: {r.crm_number} {r.crm_state && `(${r.crm_state})`}
                </span>
              )}
              {(r.city || r.state) && (
                <span className="text-xs flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {[r.city, r.state].filter(Boolean).join(' - ')}
                </span>
              )}
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 mt-4 sm:mt-0">
            <Button
              variant={r.is_verified ? 'outline' : 'default'}
              size="sm"
              className="flex-1 sm:flex-none h-8 text-xs"
              onClick={() => onToggleStatus(r.id, 'is_verified', r.is_verified)}
            >
              {r.is_verified ? (
                <>
                  <XCircle className="w-3 h-3 mr-1" /> Remover Selo
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Verificar
                </>
              )}
            </Button>
            <Button
              variant={r.is_blocked ? 'outline' : 'destructive'}
              size="sm"
              className="flex-1 sm:flex-none h-8 text-xs"
              onClick={() => onToggleStatus(r.id, 'is_blocked', r.is_blocked)}
            >
              {r.is_blocked ? (
                <>
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Desbloquear
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3 h-3 mr-1" /> Bloquear
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
