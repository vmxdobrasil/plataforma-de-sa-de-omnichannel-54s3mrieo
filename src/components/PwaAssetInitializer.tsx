import { useEffect } from 'react'

export function PwaAssetInitializer() {
  useEffect(() => {
    // Check if canvas is available
    if (typeof window === 'undefined' || !document.createElement) return

    // We can verify if icons exist or test generation in browser if needed
  }, [])

  return null
}
