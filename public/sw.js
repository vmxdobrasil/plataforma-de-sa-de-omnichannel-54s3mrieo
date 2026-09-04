// Service Worker para V MED BRASIL PWA
// Regras obrigatórias:
// 1. NUNCA cachear chamadas de API, PocketBase (/api/), autenticação ou dados sensíveis de saúde.
// 2. Network-first para navegações (HTML), com fallback gracioso para offline.html.
// 3. Stale-while-revalidate para recursos estáticos locais (CSS, JS do app, ícones SVG/PNG).

const CACHE_NAME = 'vmed-app-shell-v1'
const OFFLINE_URL = '/offline.html'

// Recursos essenciais do shell para cache imediato
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/icon.svg',
  '/icons/icon-maskable.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-192x192.png',
  '/icons/icon-maskable-512x512.png',
  '/apple-touch-icon.png',
  '/favicon.png',
  '/icons/shortcut-calendar.svg',
  '/icons/shortcut-sos.svg',
  '/icons/shortcut-search.svg',
]

// Instalação do SW
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Adicionar arquivos essenciais sem travar a instalação caso algum asset falhe
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[SW] Falha ao pré-cachear asset:', url, err)
          }),
        ),
      )
    }),
  )
  // Ativar imediatamente sem esperar fechamento das abas antigas
  self.skipWaiting()
})

// Ativação e limpeza de versões antigas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removendo cache obsoleto:', key)
            return caches.delete(key)
          }
        }),
      )
    }),
  )
  self.clients.claim()
})

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)

  // 1. REGRAS DE SEGURANÇA E DADOS DE SAÚDE:
  // NUNCA interceptar/cachear requisições para a API PocketBase, endpoints de autenticação,
  // websockets, ou métodos que não sejam GET.
  if (request.method !== 'GET') {
    return
  }

  // Ignorar chamadas de API, endpoints de banco e uploads/downloads de prontuários
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('internal.goskip.dev') ||
    url.hostname.includes('pocketbase') ||
    url.pathname.includes('/realtime') ||
    url.searchParams.has('skip_cache')
  ) {
    // Sempre direto na rede, sem passar pelo cache
    return
  }

  // 2. Navegação de páginas HTML (Network-first com fallback para offline.html)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Se obteve resposta com sucesso, atualiza o cache da rota caso seja '/'
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone).catch(() => {})
            })
          }
          return networkResponse
        })
        .catch(async () => {
          // Em falha de rede total, tentar o cache ou exibir a tela offline personalizada
          const cachedResponse = await caches.match(request)
          if (cachedResponse) {
            return cachedResponse
          }
          const offlineFallback = await caches.match(OFFLINE_URL)
          if (offlineFallback) {
            return offlineFallback
          }
          return new Response('Sem conexão à internet — V MED BRASIL', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          })
        }),
    )
    return
  }

  // 3. Recursos estáticos locais da mesma origem (JS, CSS, Imagens, Fontes, Ícones)
  if (url.origin === self.location.origin) {
    const isStaticAsset =
      url.pathname.startsWith('/assets/') ||
      url.pathname.startsWith('/icons/') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.svg') ||
      url.pathname.endsWith('.ico') ||
      url.pathname.endsWith('.woff2')

    if (isStaticAsset) {
      event.respondWith(
        caches.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                const responseClone = networkResponse.clone()
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, responseClone).catch(() => {})
                })
              }
              return networkResponse
            })
            .catch(() => cachedResponse)

          return cachedResponse || fetchPromise
        }),
      )
      return
    }
  }

  // Qualquer outra requisição segue o comportamento padrão do navegador
})
