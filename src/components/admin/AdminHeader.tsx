import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useRealtime } from '@/hooks/use-realtime'
import defaultLogo from '@/assets/logo-v-med-c5c45.jpg'

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
      const settings = await pb.collection('system_settings').getFirstListItem('')
      if (settings.logo) {
        setLogoUrl(pb.files.getURL(settings, settings.logo))
      } else {
        setLogoUrl(defaultLogo)
      }
    } catch {
      setLogoUrl(defaultLogo)
    }
    setLoading(false)
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
        'flex flex-col lg:flex-row lg:items-center justify-between gap-6 ds-gradient-header border-none rounded-2xl p-6 shadow-md mb-6',
        className,
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        {loading ? (
          <Skeleton className="h-16 w-32 shrink-0 bg-white/20" />
        ) : (
          <div className="shrink-0 bg-white p-2 rounded-lg shadow-sm w-fit flex items-center justify-center">
            <img
              src={logoUrl || defaultLogo}
              alt="Logo V MED Brasil"
              className="h-14 w-auto max-w-[200px] object-contain"
            />
          </div>
        )}
        <div>
          <div className="text-[10px] sm:text-xs font-bold text-white/80 uppercase tracking-widest mb-1 sm:mb-2">
            V MED Brasil — Administradora de Cartões e Benefícios Ltda
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2 text-white">
            {icon && <span className="text-brandAccent">{icon}</span>}
            {title}
          </h1>
          <p className="text-white/70 mt-1 max-w-2xl">{description}</p>
        </div>
      </div>
      {rightContent && (
        <div className="flex items-center shrink-0 w-full lg:w-auto bg-white/10 backdrop-blur-sm rounded-lg p-3">
          {rightContent}
        </div>
      )}
    </div>
  )
}
