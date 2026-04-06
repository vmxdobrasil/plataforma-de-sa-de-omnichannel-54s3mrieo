import { useState, useEffect, useRef } from 'react'
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getMessages, sendMessage } from '@/services/messages'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { Send, User as UserIcon, Paperclip, File as FileIcon, X } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
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
  const [file, setFile] = useState<File | null>(null)
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
    if ((!input.trim() && !file) || !user?.id || !peerId) return
    try {
      await sendMessage(user.id, peerId, input, file || undefined)
      setInput('')
      setFile(null)
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
                    {msg.content && <p>{msg.content}</p>}
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
            className="flex-1 rounded-full"
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
