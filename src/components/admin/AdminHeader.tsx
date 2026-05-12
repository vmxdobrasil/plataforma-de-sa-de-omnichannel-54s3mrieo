import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useRealtime } from '@/hooks/use-realtime'

interface AdminHeaderProps {
  title: React.ReactNode
  description: string
  icon?: React.ReactNode
  rightContent?: React.ReactNode
  className?: string
}

export function AdminHeader({
  title,
  description,
  icon,
  rightContent,
  className,
}: AdminHeaderProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchLogo = async () => {
    try {
      const res = await pb.collection('system_settings').getList(1, 1)
      if (res.items.length > 0 && res.items[0].logo) {
        const settings = res.items[0]
        const url = pb.files.getURL(settings, settings.logo)
        setLogoUrl(url + '?v=' + settings.updated)
      } else {
        setLogoUrl(null)
      }
    } catch (error) {
      setLogoUrl(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogo()
  }, [])

  useRealtime('system_settings', () => {
    fetchLogo()
  })

  return (
    <div
      className={cn(
        'flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-background/90 backdrop-blur-md border border-primary/20 rounded-xl p-6 shadow-sm mb-6',
        className,
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        {loading ? (
          <Skeleton className="h-16 w-32 shrink-0" />
        ) : logoUrl ? (
          <div className="shrink-0 bg-white/90 dark:bg-white p-2 rounded-lg shadow-sm w-fit flex items-center justify-center">
            <img
              src={logoUrl}
              alt="Logo VMed"
              className="h-14 w-auto max-w-[200px] object-contain mix-blend-multiply dark:mix-blend-normal"
            />
          </div>
        ) : (
          <div className="shrink-0 bg-primary/10 p-3 rounded-xl shadow-sm w-fit flex items-center justify-center gap-2 border border-primary/20">
            <div className="h-10 w-10 bg-primary text-primary-foreground flex items-center justify-center rounded-lg font-bold text-xl shadow-inner">
              VM
            </div>
            <span className="font-bold text-2xl tracking-tight text-foreground pr-2">VMed</span>
          </div>
        )}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            {icon && <span className="text-primary">{icon}</span>}
            {title}
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">{description}</p>
        </div>
      </div>
      {rightContent && (
        <div className="flex items-center shrink-0 w-full lg:w-auto">{rightContent}</div>
      )}
    </div>
  )
}
