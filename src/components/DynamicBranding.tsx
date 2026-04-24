import { useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'

function hexToHsl(hex: string) {
  let r = 0,
    g = 0,
    b = 0
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16)
    g = parseInt(hex[2] + hex[2], 16)
    b = parseInt(hex[3] + hex[3], 16)
  } else if (hex.length === 7) {
    r = parseInt(hex[1] + hex[2], 16)
    g = parseInt(hex[3] + hex[4], 16)
    b = parseInt(hex[5] + hex[6], 16)
  }
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b)
  let h = 0,
    s = 0,
    l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

export function DynamicBranding() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      // Revert to default if logged out
      document.documentElement.style.removeProperty('--primary')
      document.documentElement.style.removeProperty('--ring')
      return
    }

    const applyBranding = async () => {
      try {
        let colorToApply = ''
        if (user.role === 'company') {
          const settings = await pb.collection('system_settings').getFirstListItem('')
          if (settings?.primary_color) {
            colorToApply = settings.primary_color
          }
        } else if (user.role === 'professional') {
          const kit = await pb.collection('brand_kits').getFirstListItem(`user_id="${user.id}"`)
          if (kit?.primary_color) {
            colorToApply = kit.primary_color
          }
        }

        if (colorToApply && colorToApply.startsWith('#')) {
          const hsl = hexToHsl(colorToApply)
          document.documentElement.style.setProperty('--primary', hsl)
          document.documentElement.style.setProperty('--ring', hsl)
        }
      } catch (error) {
        // Silently ignore if no config is found
      }
    }

    applyBranding()
  }, [user])

  return null
}
