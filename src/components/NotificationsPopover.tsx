import { useEffect, useState } from 'react'
import { Bell, Check, Paperclip } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { getUnreadNotifications, markAsRead } from '@/services/messages'

export function NotificationsPopover() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<any[]>([])
  const [open, setOpen] = useState(false)

  const loadNotifications = async () => {
    if (!user) return
    try {
      const data = await getUnreadNotifications(user.id)
      setNotifications(data)
    } catch (e) {
      console.error('Failed to load notifications', e)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [user])

  useRealtime('messages', (e) => {
    if (e.record.receiver_id === user?.id) {
      if (e.action === 'create' || e.action === 'update') {
        loadNotifications()
      } else if (e.action === 'delete') {
        setNotifications((prev) => prev.filter((n) => n.id !== e.record.id))
      }
    }
  })

  const handleMarkAsRead = async (id: string) => {
    try {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      await markAsRead(id)
    } catch (e) {
      console.error('Failed to mark notification as read', e)
      loadNotifications() // Revert on failure
    }
  }

  if (!user) return null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-primary"
        >
          <Bell className="h-5 w-5" />
          {notifications.length > 0 && (
            <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-background">
              {notifications.length > 9 ? '9+' : notifications.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="font-semibold text-sm">Notificações</h4>
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {notifications.length} não lidas
          </span>
        </div>
        <ScrollArea className="h-[350px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[200px] p-6 text-center text-muted-foreground">
              <div className="bg-muted p-3 rounded-full mb-3">
                <Bell className="h-6 w-6 opacity-40" />
              </div>
              <p className="text-sm font-medium">Você não possui novas notificações</p>
              <p className="text-xs mt-1 opacity-70">Suas atualizações aparecerão aqui.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="group flex gap-3 p-4 border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => handleMarkAsRead(notif.id)}
                >
                  <div className="mt-1 bg-primary/10 p-1.5 rounded-full text-primary shrink-0">
                    <Bell className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm leading-snug">{notif.content}</p>
                    {notif.file && (
                      <span className="text-xs font-medium text-blue-600 flex items-center gap-1">
                        <Paperclip className="h-3 w-3" /> Anexo incluído
                      </span>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(notif.created).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    title="Marcar como lida"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMarkAsRead(notif.id)
                    }}
                  >
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
