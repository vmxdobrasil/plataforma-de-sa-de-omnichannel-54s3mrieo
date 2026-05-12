import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

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

  useEffect(() => {
    pb.collection('system_settings')
      .getFirstListItem('')
      .then((settings) => {
        if (settings?.logo) {
          setLogoUrl(pb.files.getURL(settings, settings.logo))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

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
          <div className="shrink-0 bg-white/90 dark:bg-white p-2 rounded-lg shadow-sm w-fit">
            <img
              src={logoUrl}
              alt="Logo"
              className="h-14 w-auto object-contain mix-blend-multiply dark:mix-blend-normal"
            />
          </div>
        ) : null}
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
