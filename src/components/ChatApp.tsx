import { useState, useEffect } from 'react'
import { getPatientAppointments, getProfessionalAppointments } from '@/services/appointments'
import { useAuth } from '@/hooks/use-auth'
import { ChatBox } from './ChatBox'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ArrowLeft } from 'lucide-react'
import pb from '@/lib/pocketbase/client'

export function ChatApp() {
  const { user } = useAuth()
  const [contacts, setContacts] = useState<any[]>([])
  const [activePeer, setActivePeer] = useState<any>(null)

  useEffect(() => {
    const loadContacts = async () => {
      if (!user) return
      try {
        if (user.role === 'patient') {
          const appts = await getPatientAppointments(user.id)
          const profsMap = new Map()
          appts.forEach((a) => {
            if (a.expand?.professional_id) profsMap.set(a.professional_id, a.expand.professional_id)
          })
          setContacts(Array.from(profsMap.values()))
        } else {
          const appts = await getProfessionalAppointments(user.id)
          const patsMap = new Map()
          appts.forEach((a) => {
            if (a.expand?.patient_id) patsMap.set(a.patient_id, a.expand.patient_id)
          })
          setContacts(Array.from(patsMap.values()))
        }
      } catch (e) {
        console.error(e)
      }
    }
    loadContacts()
  }, [user])

  if (!user) return null

  if (activePeer) {
    const avatarUrl = activePeer.avatar
      ? pb.files.getURL({ id: activePeer.id, collectionId: 'users' }, activePeer.avatar)
      : undefined
    return (
      <div className="h-full flex flex-col pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActivePeer(null)}
          className="mb-2 w-fit -ml-2 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <ChatBox peerId={activePeer.id} peerName={activePeer.name} peerAvatar={avatarUrl} />
      </div>
    )
  }

  return (
    <div className="space-y-2 mt-4">
      <h3 className="font-semibold text-sm mb-4 text-muted-foreground uppercase tracking-wider">
        Contatos
      </h3>
      {contacts.map((c) => (
        <div
          key={c.id}
          className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-border"
          onClick={() => setActivePeer(c)}
        >
          <Avatar className="h-12 w-12 border">
            <AvatarImage
              src={
                c.avatar
                  ? pb.files.getURL({ id: c.id, collectionId: 'users' }, c.avatar)
                  : `https://api.dicebear.com/7.x/notionists/svg?seed=${c.name}`
              }
            />
            <AvatarFallback>{c.name?.[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold text-sm">{c.name}</p>
            <p className="text-xs text-muted-foreground">{c.specialty || 'Paciente'}</p>
          </div>
        </div>
      ))}
      {contacts.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum contato encontrado.</p>
      )}
    </div>
  )
}
