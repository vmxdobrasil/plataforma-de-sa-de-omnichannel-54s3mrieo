import { useEffect } from 'react'
import { PwaInstallPrompt } from './PwaInstallPrompt'

export function PwaAssetInitializer() {
  useEffect(() => {
    // 1. Registro seguro do Service Worker exclusivamente em ambiente de produção
    // Não registramos em dev (localhost / HMR) para não conflitar com WebSockets do Vite
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      import.meta.env.PROD &&
      window.location.protocol === 'https:'
    ) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .then((registration) => {
            console.log('[PWA] Service Worker registrado com sucesso:', registration.scope)

            // Checagem periódica por novas versões
            registration.addEventListener('updatefound', () => {
              const installingWorker = registration.installing
              if (installingWorker) {
                installingWorker.addEventListener('statechange', () => {
                  if (
                    installingWorker.state === 'installed' &&
                    navigator.serviceWorker.controller
                  ) {
                    console.log('[PWA] Nova versão do V MED BRASIL disponível!')
                  }
                })
              }
            })
          })
          .catch((err) => {
            console.warn('[PWA] Falha ao registrar Service Worker:', err)
          })
      })
    }
  }, [])

  return <PwaInstallPrompt />
}
