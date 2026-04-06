import { useState, useEffect, useRef } from 'react'
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getMessages, sendMessage } from '@/services/messages'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import {
  Send,
  User as UserIcon,
  Paperclip,
  File as FileIcon,
  X,
  Video,
  Phone,
  ShieldCheck,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useNavigate, Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'

export function ChatBox({
  peerId,
  peerName,
  peerAvatar,
}: {
  peerId: string
  peerName: string
  peerAvatar?: string
}) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [peerData, setPeerData] = useState<any>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const loadMessages = async () => {
    if (!user?.id || !peerId) return
    try {
      const msgs = await getMessages(user.id, peerId)
      setMessages(msgs)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    if (peerId) {
      pb.collection('users').getOne(peerId).then(setPeerData).catch(console.error)
    }
  }, [peerId])

  useEffect(() => {
    loadMessages()
  }, [user?.id, peerId])

  useRealtime('messages', () => loadMessages())

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if ((!input.trim() && !file) || !user?.id || !peerId) return
    try {
      await sendMessage(user.id, peerId, input, file || undefined)
      setInput('')
      setFile(null)
    } catch (e) {
      console.error(e)
    }
  }

  const handleCall = async (type: 'video' | 'audio') => {
    if (!user || !peerId) return
    try {
      const patientId = user.role === 'patient' ? user.id : peerId
      const professionalId = user.role === 'professional' ? user.id : peerId

      const apt = await pb.collection('appointments').create({
        patient_id: patientId,
        professional_id: professionalId,
        dateTime: new Date().toISOString(),
        type: 'Online',
        status: 'scheduled',
        notes: `Chamada instantânea (${type})`,
      })

      const url = `/telemedicine/${apt.id}`
      await sendMessage(user.id, peerId, `📞 Chamada iniciada: ${url}`)
      navigate(url)
    } catch (e) {
      console.error('Failed to initiate call', e)
    }
  }

  const renderContent = (content: string) => {
    if (content.startsWith('📞 Chamada iniciada:')) {
      const url = content.split(' ')[3]
      return (
        <div className="flex flex-col gap-2 items-start">
          <span className="font-medium text-xs uppercase tracking-wider opacity-80">
            📞 Chamada Iniciada
          </span>
          {url && (
            <Button
              asChild
              size="sm"
              variant="secondary"
              className="w-full text-xs bg-background/50 hover:bg-background/80"
            >
              <Link to={url}>Entrar na Sala</Link>
            </Button>
          )}
        </div>
      )
    }
    return <p>{content}</p>
  }

  return (
    <Card className="flex flex-col h-[500px] shadow-sm border-0">
      <CardHeader className="py-3 border-b bg-muted/30 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={peerAvatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${peerName}`}
            />
            <AvatarFallback>
              <UserIcon className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">{peerName}</CardTitle>
              {peerData?.role === 'professional' && peerData?.is_verified && (
                <Badge
                  variant="secondary"
                  className="h-4 text-[10px] px-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                >
                  <ShieldCheck className="h-3 w-3 mr-0.5" /> Verificado
                </Badge>
              )}
            </div>
            {peerData?.role === 'professional' && (
              <span className="text-[10px] text-muted-foreground">
                {peerData.specialty || 'Profissional de Saúde'}
              </span>
            )}
          </div>
        </div>

        {((user?.role === 'professional' && peerData?.role === 'patient') ||
          (user?.role === 'patient' && peerData?.role === 'professional')) && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => handleCall('audio')}
              title="Chamada de Áudio"
            >
              <Phone className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => handleCall('video')}
              title="Chamada de Vídeo"
            >
              <Video className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden relative">
        <ScrollArea className="h-full p-4 absolute inset-0" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((msg) => {
              const isMine = msg.sender_id === user?.id
              const fileUrl = msg.file ? pb.files.getURL(msg, msg.file) : null
              const isImage =
                msg.file &&
                (msg.file.endsWith('.jpg') ||
                  msg.file.endsWith('.png') ||
                  msg.file.endsWith('.jpeg'))
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl p-3 text-sm flex flex-col gap-2 ${isMine ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted rounded-tl-sm'}`}
                  >
                    {msg.content && renderContent(msg.content)}
                    {fileUrl && (
                      <a href={fileUrl} target="_blank" rel="noreferrer" className="block mt-1">
                        {isImage ? (
                          <img
                            src={fileUrl}
                            alt="attachment"
                            className="rounded-md max-w-full h-auto max-h-48 object-cover"
                          />
                        ) : (
                          <div className="flex items-center gap-2 bg-background/20 p-2 rounded-md">
                            <FileIcon className="h-4 w-4" />
                            <span className="text-xs underline">Anexo</span>
                          </div>
                        )}
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
            {messages.length === 0 && (
              <p className="text-center text-xs text-muted-foreground mt-4">
                Nenhuma mensagem ainda.
              </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-3 border-t bg-background flex flex-col items-start gap-2">
        {file && (
          <div className="flex items-center gap-2 bg-muted p-2 rounded-md text-xs w-full justify-between">
            <span className="truncate">{file.name}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-4 w-4"
              onClick={() => setFile(null)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex w-full gap-2 items-center"
        >
          <Input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full shrink-0"
            asChild
          >
            <Label htmlFor="file-upload" className="cursor-pointer">
              <Paperclip className="h-5 w-5" />
            </Label>
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1 rounded-full bg-muted/50 border-transparent focus-visible:ring-1 focus-visible:ring-ring"
          />
          <Button
            type="submit"
            size="icon"
            className="rounded-full shrink-0"
            disabled={!input.trim() && !file}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
