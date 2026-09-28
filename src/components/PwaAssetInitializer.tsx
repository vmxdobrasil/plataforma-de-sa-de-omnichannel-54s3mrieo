import { useEffect } from 'react'
import { PwaInstallPrompt } from './PwaInstallPrompt'

export function PwaAssetInitializer() {
  useEffect(() => {
    // Registro e monitoramento seguro do Service Worker
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      (window.location.protocol === 'https:' || window.location.hostname === 'localhost')
    ) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('[PWA] Service Worker registrado com sucesso:', registration.scope)

          // Checagem periódica por novas versões
          registration.addEventListener('updatefound', () => {
            const installingWorker = registration.installing
            if (installingWorker) {
              installingWorker.addEventListener('statechange', () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[PWA] Nova versão do V MED BRASIL disponível!')
                }
              })
            }
          })
        })
        .catch((err) => {
          console.warn('[PWA] Falha ao registrar Service Worker:', err)
        })
    }
  }, [])

  return <PwaInstallPrompt />
}
