import { useState, useEffect, useRef } from 'react'
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getMessages, sendMessage } from '@/services/messages'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { Send, User as UserIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
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
    loadMessages()
  }, [user?.id, peerId])
  useRealtime('messages', () => loadMessages())

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || !user?.id || !peerId) return
    try {
      await sendMessage({ sender_id: user.id, receiver_id: peerId, content: input })
      setInput('')
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <Card className="flex flex-col h-[500px] shadow-sm border-0">
      <CardHeader className="py-3 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={peerAvatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${peerName}`}
            />
            <AvatarFallback>
              <UserIcon className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-sm font-medium">{peerName}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden relative">
        <ScrollArea className="h-full p-4 absolute inset-0" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((msg) => {
              const isMine = msg.sender_id === user?.id
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl p-3 text-sm ${isMine ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted rounded-tl-sm'}`}
                  >
                    {msg.content}
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
      <CardFooter className="p-3 border-t bg-background">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex w-full gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1 rounded-full"
          />
          <Button type="submit" size="icon" className="rounded-full" disabled={!input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
