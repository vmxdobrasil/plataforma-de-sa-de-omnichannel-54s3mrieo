import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Phone, Droplet, User as UserIcon, FileText } from 'lucide-react'

export function SOSCard({ user }: { user: any }) {
  if (!user) return null
  return (
    <Card className="border-red-500 shadow-xl overflow-hidden animate-fade-in-up h-full flex flex-col">
      <CardHeader className="bg-red-500 text-white py-4 flex flex-row items-center gap-3">
        <AlertCircle className="h-6 w-6" />
        <CardTitle className="text-xl m-0">Cartão de Emergência SOS</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4 bg-red-50/30 flex-1">
        <div className="flex items-center gap-4 border-b border-red-100 pb-3">
          <Droplet className="h-5 w-5 text-red-500 shrink-0" />
          <div>
            <span className="font-semibold text-sm block text-muted-foreground">
              Tipo Sanguíneo
            </span>
            <span className="text-lg font-bold text-foreground">
              {user.blood_type || 'Não informado'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 border-b border-red-100 pb-3">
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
          <div>
            <span className="font-semibold text-sm block text-muted-foreground">Alergias</span>
            <span className="text-lg font-bold text-foreground">
              {user.allergies || 'Nenhuma informada'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 border-b border-red-100 pb-3">
          <FileText className="h-5 w-5 text-purple-500 shrink-0" />
          <div>
            <span className="font-semibold text-sm block text-muted-foreground">
              Documento (ID)
            </span>
            <span className="text-lg font-bold text-foreground">
              {user.document_id || 'Não informado'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 border-b border-red-100 pb-3">
          <UserIcon className="h-5 w-5 text-blue-500 shrink-0" />
          <div>
            <span className="font-semibold text-sm block text-muted-foreground">
              Contato de Emergência
            </span>
            <span className="text-lg font-bold text-foreground">
              {user.emergency_contact_name || 'Não informado'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Phone className="h-5 w-5 text-emerald-500 shrink-0" />
          <div>
            <span className="font-semibold text-sm block text-muted-foreground">
              Telefone de Emergência
            </span>
            <span className="text-lg font-bold text-foreground">
              {user.emergency_contact_phone || 'Não informado'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
