/**
 * Renderizador Canvas direto para Store Assets do Google Play
 * Produz PNGs perfeitos pixel-a-pixel sem dependência de foreignObject
 * Suporta 1024x500 (banner) e 1080x1920 (screenshots mobile 9:16)
 */

export interface MobileMockupData {
  id: string
  title: string
  subtitle: string
  tag: string
  type:
    | 'booking'
    | 'records'
    | 'prescriptions'
    | 'memed'
    | 'chat'
    | 'doctor_dashboard'
    | 'home'
    | 'security'
}

export const STORE_MOCKUPS: MobileMockupData[] = [
  {
    id: '1-agende-sua-consulta',
    title: 'Agende sua consulta',
    subtitle: 'Médicos especialistas e telemedicina 24h sem complicação',
    tag: 'AGENDAMENTO INTELIGENTE',
    type: 'booking',
  },
  {
    id: '2-prontuario-digital-completo',
    title: 'Prontuário digital completo',
    subtitle: 'Seu histórico clínico, exames e dados centralizados',
    tag: 'HISTÓRICO INTEGRADO',
    type: 'records',
  },
  {
    id: '3-receitas-digitais-com-qr-code',
    title: 'Receitas digitais com QR Code',
    subtitle: 'Válidas em farmácias de todo o Brasil via Memed',
    tag: 'DISPENSAÇÃO RÁPIDA',
    type: 'prescriptions',
  },
  {
    id: '4-prescricao-com-assinatura-digital',
    title: 'Prescrição com assinatura digital',
    subtitle: 'Em conformidade com CFM, Anvisa e ICP-Brasil',
    tag: 'PADRÃO OFICIAL',
    type: 'memed',
  },
  {
    id: '5-chat-seguro-com-seu-medico',
    title: 'Chat seguro com seu médico',
    subtitle: 'Comunicação direta, dúvidas e acompanhamento clínico',
    tag: 'TELEMEDICINA',
    type: 'chat',
  },
  {
    id: '6-painel-completo-do-profissional',
    title: 'Painel completo do profissional',
    subtitle: 'Gestão de atendimentos, receitas e agenda sincronizada',
    tag: 'MÉDICOS & CLÍNICAS',
    type: 'doctor_dashboard',
  },
  {
    id: '7-sua-saude-em-um-so-lugar',
    title: 'Sua saúde em um só lugar',
    subtitle: 'Consultas, benefícios, dependentes e lembretes',
    tag: 'ECOSSISTEMA COMPLETO',
    type: 'home',
  },
  {
    id: '8-seguranca-e-privacidade-lgpd',
    title: 'Segurança e privacidade LGPD',
    subtitle: 'Criptografia de ponta a ponta e sigilo médico garantido',
    tag: 'MÁXIMA PROTEÇÃO',
    type: 'security',
  },
]

// Carrega imagem de forma assíncrona
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Falha ao carregar imagem: ${src}`))
    img.src = src
  })
}

/**
 * Desenha um retângulo com cantos arredondados
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

/**
 * Renderiza o Banner da Google Play Store (1024x500)
 */
export async function renderStoreBanner(): Promise<HTMLCanvasElement> {
  const width = 1024
  const height = 500
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Não foi possível obter contexto 2D')

  // 1. Fundo Gradiente da Marca (#14805A -> #0B5239 -> #063826)
  const bgGrad = ctx.createLinearGradient(0, 0, width, height)
  bgGrad.addColorStop(0, '#168A62')
  bgGrad.addColorStop(0.5, '#14805A')
  bgGrad.addColorStop(1, '#094731')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, width, height)

  // 2. Elementos Decorativos de Fundo (Círculos e Grade Sutil)
  ctx.save()
  // Grade sutil
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)'
  ctx.lineWidth = 1
  for (let x = 0; x < width; x += 40) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
  for (let y = 0; y < height; y += 40) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }

  // Círculos de luz
  const glow1 = ctx.createRadialGradient(150, 150, 0, 150, 150, 300)
  glow1.addColorStop(0, 'rgba(52, 211, 153, 0.25)')
  glow1.addColorStop(1, 'rgba(52, 211, 153, 0)')
  ctx.fillStyle = glow1
  ctx.fillRect(0, 0, width, height)

  const glow2 = ctx.createRadialGradient(880, 380, 0, 880, 380, 350)
  glow2.addColorStop(0, 'rgba(16, 185, 129, 0.2)')
  glow2.addColorStop(1, 'rgba(16, 185, 129, 0)')
  ctx.fillStyle = glow2
  ctx.fillRect(0, 0, width, height)
  ctx.restore()

  // 3. Tentar carregar ícone oficial de public/icons/icon-512x512.png
  let iconLoaded = false
  try {
    const iconImg = await loadImage('/icons/icon-512x512.png')
    const iconSize = 220
    const iconX = 80
    const iconY = (height - iconSize) / 2

    // Sombra do ícone
    ctx.save()
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)'
    ctx.shadowBlur = 30
    ctx.shadowOffsetY = 15
    roundRect(ctx, iconX, iconY, iconSize, iconSize, 44)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.restore()

    // Desenhar imagem com bordas arredondadas
    ctx.save()
    roundRect(ctx, iconX, iconY, iconSize, iconSize, 44)
    ctx.clip()
    ctx.drawImage(iconImg, iconX, iconY, iconSize, iconSize)
    ctx.restore()

    // Borda sutil
    ctx.save()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 3
    roundRect(ctx, iconX, iconY, iconSize, iconSize, 44)
    ctx.stroke()
    ctx.restore()

    iconLoaded = true
  } catch {
    // Se falhar carregar ícone, desenha a marca geométrica
  }

  if (!iconLoaded) {
    const iconSize = 200
    const iconX = 90
    const iconY = (height - iconSize) / 2
    roundRect(ctx, iconX, iconY, iconSize, iconSize, 40)
    ctx.fillStyle = '#0F6848'
    ctx.fill()
    ctx.strokeStyle = '#34D399'
    ctx.lineWidth = 4
    ctx.stroke()

    // Cruz médica
    ctx.fillStyle = '#FFFFFF'
    roundRect(ctx, iconX + 85, iconY + 40, 30, 120, 10)
    ctx.fill()
    roundRect(ctx, iconX + 40, iconY + 85, 120, 30, 10)
    ctx.fill()
  }

  // 4. Tipografia & Conteúdo Textual
  const textStartX = 340

  // Tag Badge
  ctx.save()
  roundRect(ctx, textStartX, 105, 210, 32, 16)
  ctx.fillStyle = 'rgba(52, 211, 153, 0.18)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.5)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.fillStyle = '#A7F3D0'
  ctx.font = '700 13px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('• ECOSSISTEMA DE SAÚDE •', textStartX + 105, 121)
  ctx.restore()

  // Nome Principal "V MED BRASIL"
  ctx.save()
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '900 58px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
  ctx.shadowBlur = 12
  ctx.shadowOffsetY = 4
  ctx.fillText('V MED BRASIL', textStartX, 195)
  ctx.restore()

  // Tagline Principal
  ctx.save()
  ctx.fillStyle = '#E6FFFA'
  ctx.font = '600 24px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('Saúde completa: consultas, prontuário digital', textStartX, 245)
  ctx.fillText('e receitas com assinatura.', textStartX, 280)
  ctx.restore()

  // 3 Selos rápidos de valor
  const pills = ['✓ Telemedicina 24h', '✓ Receitas Memed ICP-Brasil', '✓ Prontuário e Exames']
  let pillX = textStartX
  const pillY = 325

  pills.forEach((pill) => {
    ctx.save()
    ctx.font =
      '600 15px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    const tw = ctx.measureText(pill).width + 28

    roundRect(ctx, pillX, pillY, tw, 36, 18)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.fillStyle = '#FFFFFF'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(pill, pillX + 14, pillY + 18)
    ctx.restore()

    pillX += tw + 12
  })

  // Rodapé do banner: Selos de autoridade
  ctx.save()
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)'
  ctx.font = '500 14px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('Em conformidade com CFM • ICP-Brasil • Padrão LGPD', textStartX, 400)
  ctx.restore()

  return canvas
}

/**
 * Renderiza um dos 8 Mockups Mobile (1080x1920)
 */
export async function renderMobileMockup(mockup: MobileMockupData): Promise<HTMLCanvasElement> {
  const width = 1080
  const height = 1920
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Não foi possível obter contexto 2D')

  // 1. Fundo do Poster com Gradiente da Marca
  const bgGrad = ctx.createLinearGradient(0, 0, width, height)
  bgGrad.addColorStop(0, '#168A62')
  bgGrad.addColorStop(0.3, '#14805A')
  bgGrad.addColorStop(0.85, '#0B5239')
  bgGrad.addColorStop(1, '#052A1C')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, width, height)

  // Linhas e círculos de luz elegantes no fundo
  ctx.save()
  const glow = ctx.createRadialGradient(width / 2, 200, 0, width / 2, 200, 600)
  glow.addColorStop(0, 'rgba(52, 211, 153, 0.28)')
  glow.addColorStop(1, 'rgba(52, 211, 153, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, width, height)

  // Círculo decorativo
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.15)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(width / 2, 300, 380, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()

  // 2. Cabeçalho de Texto da Tela (Topo)
  // Badge de Tag
  ctx.save()
  const tagText = mockup.tag
  ctx.font = '700 24px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  const tagWidth = ctx.measureText(tagText).width + 48
  const tagX = (width - tagWidth) / 2
  const tagY = 120

  roundRect(ctx, tagX, tagY, tagWidth, 54, 27)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.fillStyle = '#A7F3D0'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(tagText, width / 2, tagY + 27)
  ctx.restore()

  // Título Curto da Tela
  ctx.save()
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '900 68px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
  ctx.shadowBlur = 18
  ctx.shadowOffsetY = 6
  ctx.fillText(mockup.title, width / 2, 260)
  ctx.restore()

  // Subtítulo
  ctx.save()
  ctx.fillStyle = '#D1FAE5'
  ctx.font = '500 32px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(mockup.subtitle, width / 2, 315)
  ctx.restore()

  // 3. Moldura do Smartphone (Celular 9:16 Estilizado)
  const phoneW = 860
  const phoneH = 1460
  const phoneX = (width - phoneW) / 2
  const phoneY = 390
  const phoneRadius = 60

  // Sombra externa profunda do aparelho
  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)'
  ctx.shadowBlur = 60
  ctx.shadowOffsetY = 30
  roundRect(ctx, phoneX, phoneY, phoneW, phoneH, phoneRadius)
  ctx.fillStyle = '#0f172a'
  ctx.fill()
  ctx.restore()

  // Borda metálica do celular (bezel escuro e elegante)
  ctx.save()
  roundRect(ctx, phoneX, phoneY, phoneW, phoneH, phoneRadius)
  ctx.fillStyle = '#1e293b'
  ctx.fill()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
  ctx.lineWidth = 4
  ctx.stroke()
  ctx.restore()

  // Tela interna (Screen Area)
  const bezel = 18
  const screenX = phoneX + bezel
  const screenY = phoneY + bezel
  const screenW = phoneW - bezel * 2
  const screenH = phoneH - bezel * 2
  const screenRadius = phoneRadius - bezel / 2

  ctx.save()
  roundRect(ctx, screenX, screenY, screenW, screenH, screenRadius)
  ctx.clip()

  // Fundo da Tela do App (Branco / Neutro Claro)
  ctx.fillStyle = '#F8FAFC'
  ctx.fillRect(screenX, screenY, screenW, screenH)

  // Status Bar do celular
  drawStatusBar(ctx, screenX, screenY, screenW)

  // App Bar superior do V MED BRASIL
  drawPhoneAppBar(ctx, screenX, screenY + 44, screenW, mockup.title)

  // Conteúdo Específico de cada Mockup (UI estilizada)
  const contentY = screenY + 150
  const contentH = screenH - 240
  drawMockupContent(ctx, mockup.type, screenX, contentY, screenW, contentH)

  // Bottom Navigation Bar
  drawBottomNav(ctx, screenX, screenY + screenH - 90, screenW, mockup.type)

  ctx.restore()

  // Speaker notch / Dynamic Island
  ctx.save()
  const notchW = 180
  const notchH = 32
  const notchX = phoneX + (phoneW - notchW) / 2
  const notchY = phoneY + 28
  roundRect(ctx, notchX, notchY, notchW, notchH, 16)
  ctx.fillStyle = '#000000'
  ctx.fill()

  // Câmera frontal dot
  ctx.beginPath()
  ctx.arc(notchX + notchW - 28, notchY + 16, 6, 0, Math.PI * 2)
  ctx.fillStyle = '#1e293b'
  ctx.fill()
  ctx.restore()

  return canvas
}

/**
 * Desenha barra de status do celular
 */
function drawStatusBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  ctx.save()
  ctx.fillStyle = '#0f172a'
  ctx.font = '700 20px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText('9:41', x + 40, y + 26)

  // Ícones de bateria e sinal no canto direito
  ctx.textAlign = 'right'
  ctx.font = '600 18px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('5G  100%', x + w - 40, y + 26)
  ctx.restore()
}

/**
 * Desenha a barra superior do aplicativo
 */
function drawPhoneAppBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  title: string,
) {
  ctx.save()
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(x, y, w, 90)
  ctx.strokeStyle = '#E2E8F0'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x, y + 90)
  ctx.lineTo(x + w, y + 90)
  ctx.stroke()

  // Logo da marca
  roundRect(ctx, x + 30, y + 20, 50, 50, 14)
  ctx.fillStyle = '#14805A'
  ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '900 22px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('+', x + 55, y + 45)

  // Título do App
  ctx.fillStyle = '#0F172A'
  ctx.font = '800 28px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('V MED BRASIL', x + 95, y + 42)

  ctx.fillStyle = '#64748B'
  ctx.font = '500 18px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('Saúde Integrada', x + 95, y + 66)

  // Avatar do usuário no topo
  ctx.beginPath()
  ctx.arc(x + w - 60, y + 45, 25, 0, Math.PI * 2)
  ctx.fillStyle = '#E2E8F0'
  ctx.fill()
  ctx.strokeStyle = '#14805A'
  ctx.lineWidth = 3
  ctx.stroke()

  ctx.fillStyle = '#14805A'
  ctx.font = '700 20px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('VM', x + w - 60, y + 47)
  ctx.restore()
}

/**
 * Desenha os detalhes da UI interna para cada tela
 */
function drawMockupContent(
  ctx: CanvasRenderingContext2D,
  type: MobileMockupData['type'],
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.save()
  const pad = 36
  const innerW = w - pad * 2

  switch (type) {
    case 'booking':
      renderBookingUI(ctx, x + pad, y + 20, innerW)
      break
    case 'records':
      renderRecordsUI(ctx, x + pad, y + 20, innerW)
      break
    case 'prescriptions':
      renderPrescriptionsUI(ctx, x + pad, y + 20, innerW)
      break
    case 'memed':
      renderMemedUI(ctx, x + pad, y + 20, innerW)
      break
    case 'chat':
      renderChatUI(ctx, x + pad, y + 20, innerW)
      break
    case 'doctor_dashboard':
      renderDoctorDashboardUI(ctx, x + pad, y + 20, innerW)
      break
    case 'home':
      renderHomeUI(ctx, x + pad, y + 20, innerW)
      break
    case 'security':
      renderSecurityUI(ctx, x + pad, y + 20, innerW)
      break
  }

  ctx.restore()
}

// 1. Tela de Agendamento
function renderBookingUI(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  // Barra de Pesquisa de Especialidade
  roundRect(ctx, x, y, w, 66, 33)
  ctx.fillStyle = '#FFFFFF'
  ctx.fill()
  ctx.strokeStyle = '#CBD5E1'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.fillStyle = '#94A3B8'
  ctx.font = '500 22px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText('🔍  Buscar especialidade ou médico...', x + 24, y + 33)

  // Filtros de Categoria (Pills horizontais)
  const cats = ['Clínica Geral', 'Cardiologia', 'Pediatria', 'Dermatologia']
  let cx = x
  const cy = y + 90
  cats.forEach((cat, idx) => {
    ctx.font =
      '600 18px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    const cw = ctx.measureText(cat).width + 36
    roundRect(ctx, cx, cy, cw, 48, 24)
    ctx.fillStyle = idx === 0 ? '#14805A' : '#FFFFFF'
    ctx.fill()
    if (idx !== 0) {
      ctx.strokeStyle = '#E2E8F0'
      ctx.lineWidth = 2
      ctx.stroke()
    }
    ctx.fillStyle = idx === 0 ? '#FFFFFF' : '#475569'
    ctx.textAlign = 'center'
    ctx.fillText(cat, cx + cw / 2, cy + 24)
    cx += cw + 14
  })

  // Card de Próxima Consulta Agendada
  const card1Y = cy + 80
  roundRect(ctx, x, card1Y, w, 240, 24)
  ctx.fillStyle = '#FFFFFF'
  ctx.fill()
  ctx.strokeStyle = '#E2E8F0'
  ctx.lineWidth = 2
  ctx.stroke()

  // Borda lateral verde
  ctx.fillStyle = '#14805A'
  roundRect(ctx, x, card1Y, 12, 240, 6)
  ctx.fill()

  // Badge Telemedicina
  roundRect(ctx, x + 30, card1Y + 24, 150, 34, 17)
  ctx.fillStyle = '#ECFDF5'
  ctx.fill()
  ctx.fillStyle = '#065F46'
  ctx.font = '700 16px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('TELEMEDICINA', x + 105, card1Y + 41)

  ctx.fillStyle = '#0F172A'
  ctx.font = '800 26px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('Dr. Rafael Oliveira', x + 30, card1Y + 95)

  ctx.fillStyle = '#64748B'
  ctx.font = '600 20px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('Cardiologista • CRM/SP 184.920', x + 30, card1Y + 130)

  ctx.fillStyle = '#14805A'
  ctx.font = '700 20px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('📅 Hoje às 15:30  •  Sala Virtual Pronta', x + 30, card1Y + 175)

  // Botão Entrar na Sala
  roundRect(ctx, x + 30, card1Y + 200, w - 60, 52, 26)
  ctx.fillStyle = '#14805A'
  ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '700 20px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Acessar Sala de Telemedicina ➔', x + w / 2, card1Y + 226)

  // Lista de Médicos Disponíveis para Agendar
  const listY = card1Y + 280
  ctx.fillStyle = '#0F172A'
  ctx.font = '800 26px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('Profissionais Disponíveis Hoje', x, listY + 20)

  const doctors = [
    { name: 'Dra. Beatriz Santos', spec: 'Clínica Geral', rating: '★ 4.9 (128)', time: '16:00' },
    { name: 'Dr. Lucas Mendes', spec: 'Pediatria', rating: '★ 5.0 (94)', time: '17:15' },
    { name: 'Dra. Camila Ramos', spec: 'Dermatologia', rating: '★ 4.8 (210)', time: '18:00' },
  ]

  doctors.forEach((doc, i) => {
    const dy = listY + 50 + i * 150
    roundRect(ctx, x, dy, w, 130, 20)
    ctx.fillStyle = '#FFFFFF'
    ctx.fill()
    ctx.strokeStyle = '#E2E8F0'
    ctx.lineWidth = 2
    ctx.stroke()

    // Avatar do médico
    ctx.beginPath()
    ctx.arc(x + 60, dy + 65, 36, 0, Math.PI * 2)
    ctx.fillStyle = '#E0F2FE'
    ctx.fill()
    ctx.fillStyle = '#0369A1'
    ctx.font =
      '700 24px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(doc.name[4], x + 60, dy + 73)

    ctx.fillStyle = '#0F172A'
    ctx.font =
      '800 22px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(doc.name, x + 120, dy + 45)

    ctx.fillStyle = '#64748B'
    ctx.font =
      '500 18px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText(doc.spec + ' • ' + doc.rating, x + 120, dy + 75)

    ctx.fillStyle = '#14805A'
    ctx.font =
      '700 18px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText('Horário mais próximo: ' + doc.time, x + 120, dy + 105)

    // Botão Agendar
    roundRect(ctx, x + w - 160, dy + 45, 130, 44, 22)
    ctx.fillStyle = '#14805A'
    ctx.fill()
    ctx.fillStyle = '#FFFFFF'
    ctx.font =
      '700 16px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Agendar', x + w - 95, dy + 67)
  })
}

// 2. Tela de Prontuário Digital Completo
function renderRecordsUI(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  // Card Resumo do Paciente
  roundRect(ctx, x, y, w, 180, 24)
  ctx.fillStyle = '#FFFFFF'
  ctx.fill()
  ctx.strokeStyle = '#E2E8F0'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.fillStyle = '#0F172A'
  ctx.font = '800 28px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText('Prontuário Médico Digital', x + 30, y + 45)

  ctx.fillStyle = '#64748B'
  ctx.font = '500 19px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('Paciente: Mariana Costa Silva • CPF: 028.***.***-91', x + 30, y + 85)

  // 3 Indicadores de Saúde Rápidos
  const stats = [
    { label: 'Tipo Sanguíneo', val: 'O Positivo' },
    { label: 'Alergias', val: 'Penicilina' },
    { label: 'Consultas', val: '14 Registros' },
  ]
  const sw = (w - 60) / 3
  stats.forEach((s, i) => {
    const sx = x + 30 + i * sw
    ctx.fillStyle = '#F1F5F9'
    roundRect(ctx, sx, y + 115, sw - 12, 48, 12)
    ctx.fill()

    ctx.fillStyle = '#64748B'
    ctx.font =
      '600 13px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText(s.label + ':', sx + 10, y + 134)
    ctx.fillStyle = '#0F172A'
    ctx.font =
      '700 15px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText(s.val, sx + 10, y + 152)
  })

  // Linha do Tempo Clínica (Timeline)
  const timeY = y + 215
  ctx.fillStyle = '#0F172A'
  ctx.font = '800 26px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('Histórico de Atendimentos', x, timeY + 20)

  const records = [
    {
      date: '24/09/2026',
      title: 'Teleconsulta - Cardiologia',
      doc: 'Dr. Rafael Oliveira (CRM 184920/SP)',
      desc: 'Check-up de rotina. Pressão arterial 120/80 mmHg. Solicitado ECG e hemograma.',
      badge: 'Concluído',
    },
    {
      date: '10/08/2026',
      title: 'Emissão de Receita Contínua',
      doc: 'Dra. Beatriz Santos (CRM 132456/SP)',
      desc: 'Renovação de Losartana Potássica 50mg. Prescrição assinada via Memed.',
      badge: 'Assinada',
    },
    {
      date: '15/06/2026',
      title: 'Exame Laboratorial',
      doc: 'Lab. Diagnósticos V MED',
      desc: 'Hemograma completo e perfil lipídico liberados com laudo assinado.',
      badge: 'Laudo Pronto',
    },
    {
      date: '02/04/2026',
      title: 'Consulta Presencial',
      doc: 'Dr. Roberto Duarte (CRM 98711/SP)',
      desc: 'Avaliação clínica geral e atualização de vacinas.',
      badge: 'Arquivado',
    },
  ]

  records.forEach((rec, i) => {
    const ry = timeY + 60 + i * 190
    roundRect(ctx, x, ry, w, 170, 20)
    ctx.fillStyle = '#FFFFFF'
    ctx.fill()
    ctx.strokeStyle = '#E2E8F0'
    ctx.lineWidth = 2
    ctx.stroke()

    // Ponto na Timeline
    ctx.beginPath()
    ctx.arc(x + 36, ry + 36, 12, 0, Math.PI * 2)
    ctx.fillStyle = '#14805A'
    ctx.fill()

    ctx.fillStyle = '#14805A'
    ctx.font =
      '700 16px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(rec.date, x + 60, ry + 36)

    // Badge status
    roundRect(ctx, x + w - 140, ry + 20, 110, 32, 16)
    ctx.fillStyle = '#ECFDF5'
    ctx.fill()
    ctx.fillStyle = '#065F46'
    ctx.font =
      '700 14px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(rec.badge, x + w - 85, ry + 36)

    ctx.fillStyle = '#0F172A'
    ctx.font =
      '800 22px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(rec.title, x + 30, ry + 80)

    ctx.fillStyle = '#475569'
    ctx.font =
      '600 17px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText(rec.doc, x + 30, ry + 110)

    ctx.fillStyle = '#64748B'
    ctx.font =
      '400 16px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText(rec.desc, x + 30, ry + 140)
  })
}

// 3. Tela de Receitas Digitais com QR Code Ilustrativo
function renderPrescriptionsUI(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  // Card Destaque da Receita Principal
  roundRect(ctx, x, y, w, 440, 24)
  ctx.fillStyle = '#FFFFFF'
  ctx.fill()
  ctx.strokeStyle = '#34D399'
  ctx.lineWidth = 3
  ctx.stroke()

  // Faixa de cabeçalho da receita
  roundRect(ctx, x, y, w, 70, 24)
  ctx.fillStyle = '#14805A'
  ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '800 24px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText('RECEITA MÉDICA DIGITAL OFICIAL', x + 30, y + 35)

  // QR Code Ilustrativo Decorativo no lado direito
  const qrX = x + w - 210
  const qrY = y + 100
  const qrSize = 170

  roundRect(ctx, qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 16)
  ctx.fillStyle = '#F8FAFC'
  ctx.fill()
  ctx.strokeStyle = '#CBD5E1'
  ctx.lineWidth = 2
  ctx.stroke()

  drawDecorativeQrCode(ctx, qrX, qrY, qrSize)

  ctx.fillStyle = '#065F46'
  ctx.font = '700 14px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('DISPENSÁVEL EM FARMÁCIA', qrX + qrSize / 2, qrY + qrSize + 25)

  // Informações da Receita (Lado Esquerdo)
  ctx.fillStyle = '#0F172A'
  ctx.font = '800 24px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('Losartana Potássica 50mg', x + 30, y + 120)

  ctx.fillStyle = '#475569'
  ctx.font = '500 18px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('Tomar 1 comprimido pela manhã por 90 dias', x + 30, y + 155)

  ctx.fillStyle = '#0F172A'
  ctx.font = '800 22px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('Rosuvastatina Cálcica 10mg', x + 30, y + 205)

  ctx.fillStyle = '#475569'
  ctx.font = '500 18px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('Tomar 1 comprimido à noite diariamente', x + 30, y + 235)

  ctx.fillStyle = '#14805A'
  ctx.font = '700 17px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('✓ Assinado digitalmente por Dr. Rafael Oliveira', x + 30, y + 285)
  ctx.fillText('✓ Certificação ICP-Brasil & Memed Integrado', x + 30, y + 315)

  // Botões de Ação na Receita
  roundRect(ctx, x + 30, y + 360, (w - 80) / 2, 54, 27)
  ctx.fillStyle = '#14805A'
  ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '700 18px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Apresentar na Farmácia', x + 30 + (w - 80) / 4, y + 387)

  roundRect(ctx, x + 50 + (w - 80) / 2, y + 360, (w - 80) / 2, 54, 27)
  ctx.fillStyle = '#F1F5F9'
  ctx.fill()
  ctx.strokeStyle = '#CBD5E1'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.fillStyle = '#0F172A'
  ctx.fillText('Comprar com Desconto', x + 50 + (w - 80) * 0.75, y + 387)

  // Lista de outras receitas anteriores
  const listY = y + 470
  ctx.fillStyle = '#0F172A'
  ctx.font = '800 26px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('Receitas Salvas no Aplicativo', x, listY + 25)

  const pastPrescriptions = [
    { title: 'Amoxicilina 500mg (Antibiótico)', doc: 'Dra. Beatriz Santos', status: 'Finalizado' },
    { title: 'Dipirona Monoidratada 500mg', doc: 'Dr. Lucas Mendes', status: 'Ativo' },
    { title: 'Colecalciferol (Vit D) 50.000 UI', doc: 'Dra. Camila Ramos', status: 'Ativo' },
  ]

  pastPrescriptions.forEach((item, i) => {
    const py = listY + 60 + i * 115
    roundRect(ctx, x, py, w, 95, 18)
    ctx.fillStyle = '#FFFFFF'
    ctx.fill()
    ctx.strokeStyle = '#E2E8F0'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.fillStyle = '#0F172A'
    ctx.font =
      '700 21px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(item.title, x + 24, py + 38)

    ctx.fillStyle = '#64748B'
    ctx.font =
      '500 17px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText('Prescrito por ' + item.doc, x + 24, py + 68)

    roundRect(ctx, x + w - 130, py + 30, 106, 36, 18)
    ctx.fillStyle = item.status === 'Ativo' ? '#ECFDF5' : '#F1F5F9'
    ctx.fill()
    ctx.fillStyle = item.status === 'Ativo' ? '#065F46' : '#475569'
    ctx.font =
      '700 15px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(item.status, x + w - 77, py + 48)
  })
}

// 4. Tela de Prescrição Memed com Assinatura Digital
function renderMemedUI(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  // Card Institucional Memed + V MED BRASIL
  roundRect(ctx, x, y, w, 150, 22)
  ctx.fillStyle = '#0F172A'
  ctx.fill()

  ctx.fillStyle = '#34D399'
  ctx.font = '700 16px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('INTEGRAÇÃO OFICIAL', x + 30, y + 40)

  ctx.fillStyle = '#FFFFFF'
  ctx.font = '800 28px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('Ecossistema V MED BRASIL + Memed', x + 30, y + 80)

  ctx.fillStyle = '#94A3B8'
  ctx.font = '500 18px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('Validação Sanitária Digital e Alertas de Interação Medicamentosa', x + 30, y + 115)

  // Card da Prescrição com Certificação
  const cardY = y + 180
  roundRect(ctx, x, cardY, w, 520, 24)
  ctx.fillStyle = '#FFFFFF'
  ctx.fill()
  ctx.strokeStyle = '#CBD5E1'
  ctx.lineWidth = 2
  ctx.stroke()

  // Selo de Assinatura Digital ICP-Brasil
  roundRect(ctx, x + 30, cardY + 30, w - 60, 70, 16)
  ctx.fillStyle = '#ECFDF5'
  ctx.fill()
  ctx.strokeStyle = '#34D399'
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.fillStyle = '#065F46'
  ctx.font = '800 20px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('🛡️ Assinado com Certificado Digital ICP-Brasil Padrão A3', x + 50, cardY + 60)
  ctx.font = '500 15px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('Identificador da Receita: MEMED-9841-BR-2026', x + 50, cardY + 84)

  // Título e Conteúdo
  ctx.fillStyle = '#0F172A'
  ctx.font = '800 24px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('Itens Prescritos e Posologia:', x + 30, cardY + 140)

  const items = [
    { name: '1. Atorvastatina 20mg - 30 comprimidos', pos: 'Uso oral diário no período noturno' },
    { name: '2. Clopidogrel 75mg - 28 comprimidos', pos: 'Uso contínuo após desjejum matinal' },
    { name: '3. Omeprazol 20mg - 30 cápsulas', pos: '1 cápsula em jejum 30 min antes da refeição' },
  ]

  items.forEach((it, i) => {
    const iy = cardY + 180 + i * 85
    roundRect(ctx, x + 30, iy, w - 60, 72, 12)
    ctx.fillStyle = '#F8FAFC'
    ctx.fill()

    ctx.fillStyle = '#0F172A'
    ctx.font =
      '700 18px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText(it.name, x + 46, iy + 30)

    ctx.fillStyle = '#64748B'
    ctx.font =
      '500 16px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText(it.pos, x + 46, iy + 54)
  })

  // Carimbo Médico Digital
  const stampY = cardY + 450
  ctx.fillStyle = '#14805A'
  ctx.font = '700 18px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('Dr. Rafael Oliveira — CRM/SP 184920', x + 30, stampY)
  ctx.fillStyle = '#64748B'
  ctx.font = '500 16px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('Documento com validade jurídica nacional garantida por lei.', x + 30, stampY + 26)

  // Botão Validar Documento
  roundRect(ctx, x, cardY + 550, w, 60, 30)
  ctx.fillStyle = '#14805A'
  ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '800 20px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Validar Assinatura Digital no Portal Memed ➔', x + w / 2, cardY + 580)
}

// 5. Tela de Chat Seguro com o Médico
function renderChatUI(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  // Cabeçalho do Chat (Médico em atendimento)
  roundRect(ctx, x, y, w, 110, 22)
  ctx.fillStyle = '#FFFFFF'
  ctx.fill()
  ctx.strokeStyle = '#E2E8F0'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(x + 55, y + 55, 34, 0, Math.PI * 2)
  ctx.fillStyle = '#14805A'
  ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '700 24px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('DR', x + 55, y + 57)

  // Ponto online verde
  ctx.beginPath()
  ctx.arc(x + 78, y + 78, 10, 0, Math.PI * 2)
  ctx.fillStyle = '#10B981'
  ctx.fill()
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 2.5
  ctx.stroke()

  ctx.fillStyle = '#0F172A'
  ctx.font = '800 24px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('Dr. Rafael Oliveira', x + 110, y + 42)

  ctx.fillStyle = '#10B981'
  ctx.font = '600 16px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('● Online agora • Canal Clínico Criptografado', x + 110, y + 72)

  // Balões de Mensagem no Chat
  const chatY = y + 140

  // 1. Mensagem do médico
  drawChatBubble(
    ctx,
    'left',
    x + 20,
    chatY,
    580,
    'Olá Mariana! Analisei os resultados do seu hemograma e seu colesterol está dentro da meta esperada. Como está se sentindo com a nova medicação?',
    '10:32',
  )

  // 2. Mensagem do paciente
  drawChatBubble(
    ctx,
    'right',
    x + w - 540,
    chatY + 150,
    520,
    'Olá Doutor! Estou me sentindo muito bem, sem nenhum sintoma adverso. Já comprei a receita na farmácia com o QR Code.',
    '10:34',
  )

  // 3. Mensagem do médico com anexo
  drawChatBubble(
    ctx,
    'left',
    x + 20,
    chatY + 280,
    600,
    'Perfeito! Enviei o plano de acompanhamento para os próximos 6 meses. Qualquer sintoma você pode me acionar por aqui 24 horas.',
    '10:36',
  )

  // Card de Anexo Seguro no Chat
  const attachY = chatY + 440
  roundRect(ctx, x + 20, attachY, 520, 90, 18)
  ctx.fillStyle = '#FFFFFF'
  ctx.fill()
  ctx.strokeStyle = '#34D399'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.fillStyle = '#14805A'
  ctx.font = '800 20px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('📄 Plano_Terapeutico_VMed.pdf', x + 40, attachY + 38)

  ctx.fillStyle = '#64748B'
  ctx.font = '500 16px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('Assinado digitalmente • 2.4 MB • Toque para abrir', x + 40, attachY + 66)

  // Barra de Digitação inferior
  const inputY = chatY + 570
  roundRect(ctx, x, inputY, w, 70, 35)
  ctx.fillStyle = '#FFFFFF'
  ctx.fill()
  ctx.strokeStyle = '#CBD5E1'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.fillStyle = '#94A3B8'
  ctx.font = '500 20px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('Digite sua mensagem segura ao médico...', x + 30, inputY + 35)

  // Botão Enviar
  ctx.beginPath()
  ctx.arc(x + w - 38, inputY + 35, 26, 0, Math.PI * 2)
  ctx.fillStyle = '#14805A'
  ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '700 20px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('➤', x + w - 38, inputY + 37)
}

function drawChatBubble(
  ctx: CanvasRenderingContext2D,
  side: 'left' | 'right',
  x: number,
  y: number,
  w: number,
  text: string,
  time: string,
) {
  roundRect(ctx, x, y, w, 110, 20)
  ctx.fillStyle = side === 'left' ? '#FFFFFF' : '#14805A'
  ctx.fill()
  if (side === 'left') {
    ctx.strokeStyle = '#E2E8F0'
    ctx.lineWidth = 2
    ctx.stroke()
  }

  ctx.fillStyle = side === 'left' ? '#0F172A' : '#FFFFFF'
  ctx.font = '500 18px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'left'

  // Quebra de texto simples em 2 linhas
  const words = text.split(' ')
  let line1 = ''
  let line2 = ''
  for (const word of words) {
    if (ctx.measureText(line1 + word).width < w - 60) {
      line1 += word + ' '
    } else {
      line2 += word + ' '
    }
  }

  ctx.fillText(line1, x + 24, y + 36)
  if (line2) ctx.fillText(line2, x + 24, y + 66)

  ctx.fillStyle = side === 'left' ? '#94A3B8' : '#A7F3D0'
  ctx.font = '600 13px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText(time + (side === 'right' ? '  ✓✓' : ''), x + w - 20, y + 96)
}

// 6. Painel do Profissional de Saúde
function renderDoctorDashboardUI(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  // Cabeçalho Dr
  roundRect(ctx, x, y, w, 130, 22)
  ctx.fillStyle = '#FFFFFF'
  ctx.fill()
  ctx.strokeStyle = '#E2E8F0'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.fillStyle = '#0F172A'
  ctx.font = '800 26px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText('Olá, Dr. Rafael Oliveira', x + 30, y + 45)

  ctx.fillStyle = '#64748B'
  ctx.font = '600 18px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('CRM/SP 184.920 • Telemedicina & Consultório Integrados', x + 30, y + 85)

  // 3 Métricas Rápidas
  const cards = [
    { label: 'Hoje', val: '8 Consultas', sub: '3 em telemedicina' },
    { label: 'Prescrições', val: '142 Emitidas', sub: '100% Memed' },
    { label: 'Avaliação', val: '★ 4.9 / 5.0', sub: '320 pacientes' },
  ]
  const cw = (w - 30) / 3
  cards.forEach((c, idx) => {
    const cx = x + idx * (cw + 15)
    roundRect(ctx, cx, y + 150, cw, 120, 18)
    ctx.fillStyle = idx === 0 ? '#14805A' : '#FFFFFF'
    ctx.fill()
    if (idx !== 0) {
      ctx.strokeStyle = '#E2E8F0'
      ctx.lineWidth = 2
      ctx.stroke()
    }

    ctx.fillStyle = idx === 0 ? '#A7F3D0' : '#64748B'
    ctx.font =
      '700 15px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText(c.label, cx + 18, y + 180)

    ctx.fillStyle = idx === 0 ? '#FFFFFF' : '#0F172A'
    ctx.font =
      '800 22px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText(c.val, cx + 18, y + 215)

    ctx.fillStyle = idx === 0 ? '#E6FFFA' : '#94A3B8'
    ctx.font =
      '500 14px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText(c.sub, cx + 18, y + 245)
  })

  // Fila de Espera de Atendimentos do Dia
  const queueY = y + 295
  ctx.fillStyle = '#0F172A'
  ctx.font = '800 26px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('Próximos Pacientes na Fila', x, queueY + 20)

  const patients = [
    { name: 'Mariana Costa Silva', time: '15:30', status: 'Na Sala Virtual', ready: true },
    { name: 'Carlos Eduardo Santos', time: '16:00', status: 'Confirmado', ready: false },
    { name: 'Fernanda Lima Souza', time: '16:30', status: 'Aguardando', ready: false },
  ]

  patients.forEach((p, idx) => {
    const py = queueY + 50 + idx * 135
    roundRect(ctx, x, py, w, 115, 20)
    ctx.fillStyle = '#FFFFFF'
    ctx.fill()
    ctx.strokeStyle = p.ready ? '#34D399' : '#E2E8F0'
    ctx.lineWidth = p.ready ? 3 : 2
    ctx.stroke()

    ctx.fillStyle = '#0F172A'
    ctx.font =
      '800 22px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(p.name, x + 30, py + 42)

    ctx.fillStyle = '#64748B'
    ctx.font =
      '600 18px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText('Horário: ' + p.time + '  •  Retorno Cardiológico', x + 30, py + 75)

    // Botão de Atender
    roundRect(ctx, x + w - 180, py + 35, 150, 48, 24)
    ctx.fillStyle = p.ready ? '#14805A' : '#F1F5F9'
    ctx.fill()
    ctx.fillStyle = p.ready ? '#FFFFFF' : '#475569'
    ctx.font =
      '700 16px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(p.ready ? 'Atender Agora' : 'Prontuário', x + w - 105, py + 59)
  })
}

// 7. Tela Principal / Home do Usuário
function renderHomeUI(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  // Banner de Boas-vindas
  roundRect(ctx, x, y, w, 220, 24)
  const bGrad = ctx.createLinearGradient(x, y, x + w, y + 220)
  bGrad.addColorStop(0, '#14805A')
  bGrad.addColorStop(1, '#0B5239')
  ctx.fillStyle = bGrad
  ctx.fill()

  ctx.fillStyle = '#A7F3D0'
  ctx.font = '700 16px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText('BEM-VINDO(A) DE VOLTA', x + 30, y + 40)

  ctx.fillStyle = '#FFFFFF'
  ctx.font = '900 32px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('Mariana Costa', x + 30, y + 80)

  ctx.fillStyle = '#E6FFFA'
  ctx.font = '500 20px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('Plano de Saúde Ativo • Limite de Benefício Disponível', x + 30, y + 120)

  // Pill com valor de crédito/benefício
  roundRect(ctx, x + 30, y + 150, 260, 44, 22)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
  ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '700 18px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('Saldo: R$ 450,00 para Farmácia', x + 45, y + 172)

  // 4 Atalhos Rápidos (Grid 2x2)
  const gridY = y + 250
  ctx.fillStyle = '#0F172A'
  ctx.font = '800 26px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('Serviços Rápidos', x, gridY + 20)

  const quick = [
    { title: 'Telemedicina', desc: 'Atendimento em 10 min', icon: '🩺' },
    { title: 'Minhas Receitas', desc: '3 prescrições ativas', icon: '📋' },
    { title: 'Rede Credenciada', desc: 'Farmácias e clínicas', icon: '📍' },
    { title: 'Dependentes', desc: 'Gerenciar família', icon: '👨‍👩‍👧' },
  ]

  const gw = (w - 20) / 2
  quick.forEach((q, idx) => {
    const col = idx % 2
    const row = Math.floor(idx / 2)
    const qx = x + col * (gw + 20)
    const qy = gridY + 50 + row * 135

    roundRect(ctx, qx, qy, gw, 115, 20)
    ctx.fillStyle = '#FFFFFF'
    ctx.fill()
    ctx.strokeStyle = '#E2E8F0'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.fillStyle = '#0F172A'
    ctx.font =
      '800 22px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(q.icon + ' ' + q.title, qx + 20, qy + 45)

    ctx.fillStyle = '#64748B'
    ctx.font =
      '500 16px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText(q.desc, qx + 20, qy + 78)
  })

  // Próxima Consulta Agendada no rodapé da tela
  const nextY = gridY + 340
  roundRect(ctx, x, nextY, w, 140, 20)
  ctx.fillStyle = '#FFFFFF'
  ctx.fill()
  ctx.strokeStyle = '#14805A'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.fillStyle = '#14805A'
  ctx.font = '800 16px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('PRÓXIMO COMPROMISSO', x + 24, nextY + 35)

  ctx.fillStyle = '#0F172A'
  ctx.font = '800 22px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('Consulta com Dr. Rafael Oliveira às 15:30', x + 24, nextY + 70)

  ctx.fillStyle = '#64748B'
  ctx.font = '500 16px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('Cardiologia • Toque para abrir a sala virtual', x + 24, nextY + 100)
}

// 8. Tela Institucional de Segurança e Privacidade LGPD
function renderSecurityUI(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  // Card Principal de Segurança
  roundRect(ctx, x, y, w, 240, 24)
  const g = ctx.createLinearGradient(x, y, x + w, y + 240)
  g.addColorStop(0, '#0F172A')
  g.addColorStop(1, '#1E293B')
  ctx.fillStyle = g
  ctx.fill()

  ctx.fillStyle = '#34D399'
  ctx.font = '800 18px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('🔒 PRIVACIDADE & CONFORMIDADE REGULATÓRIA', x + w / 2, y + 45)

  ctx.fillStyle = '#FFFFFF'
  ctx.font = '900 32px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('Seus Dados Protegidos no Mais Alto Padrão', x + w / 2, y + 95)

  ctx.fillStyle = '#94A3B8'
  ctx.font = '500 20px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText(
    'Sigilo médico, criptografia de ponta a ponta e auditoria completa',
    x + w / 2,
    y + 145,
  )
  ctx.fillText('de acordo com as exigências sanitárias do Brasil.', x + w / 2, y + 180)

  // 4 Selos Institucionais Oficiais
  const sealsY = y + 270
  const seals = [
    {
      title: 'LGPD 13.709/18',
      desc: 'Proteção Integral de Dados Sensíveis de Saúde e Consentimento Explícito.',
      icon: '🛡️',
    },
    {
      title: 'Padrão CFM & ICP-Brasil',
      desc: 'Prescrições e atestados com assinatura digital válida nacionalmente.',
      icon: '📜',
    },
    {
      title: 'Criptografia Ponta a Ponta',
      desc: 'Teleconsultas e prontuários protegidos com chaves seguras e isoladas.',
      icon: '🔐',
    },
    {
      title: 'Auditoria de Acesso',
      desc: 'Rastreabilidade de cada visualização clínica com log perpétuo.',
      icon: '👁️',
    },
  ]

  seals.forEach((s, idx) => {
    const sy = sealsY + idx * 115
    roundRect(ctx, x, sy, w, 100, 20)
    ctx.fillStyle = '#FFFFFF'
    ctx.fill()
    ctx.strokeStyle = '#E2E8F0'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.fillStyle = '#14805A'
    ctx.font =
      '800 22px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(s.icon + '  ' + s.title, x + 24, sy + 38)

    ctx.fillStyle = '#475569'
    ctx.font =
      '500 17px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText(s.desc, x + 24, sy + 70)
  })
}

/**
 * Desenha barra de navegação inferior do celular
 */
function drawBottomNav(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  activeType: MobileMockupData['type'],
) {
  ctx.save()
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(x, y, w, 90)
  ctx.strokeStyle = '#E2E8F0'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + w, y)
  ctx.stroke()

  const tabs = [
    { label: 'Início', icon: '🏠', active: activeType === 'home' },
    { label: 'Consultas', icon: '📅', active: activeType === 'booking' },
    {
      label: 'Receitas',
      icon: '📋',
      active: activeType === 'prescriptions' || activeType === 'memed',
    },
    { label: 'Histórico', icon: '📁', active: activeType === 'records' },
    {
      label: 'Perfil',
      icon: '👤',
      active:
        activeType === 'doctor_dashboard' || activeType === 'security' || activeType === 'chat',
    },
  ]

  const tw = w / tabs.length
  tabs.forEach((tab, i) => {
    const tx = x + i * tw + tw / 2
    ctx.fillStyle = tab.active ? '#14805A' : '#94A3B8'
    ctx.font =
      '700 24px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(tab.icon, tx, y + 32)

    ctx.font =
      '700 15px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText(tab.label, tx, y + 62)
  })

  // Home bar indicador
  roundRect(ctx, x + w / 2 - 70, y + 80, 140, 6, 3)
  ctx.fillStyle = '#0F172A'
  ctx.fill()
  ctx.restore()
}

/**
 * Desenha QR Code estilizado e decorativo
 */
function drawDecorativeQrCode(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save()
  ctx.fillStyle = '#0F172A'
  const count = 17
  const cell = size / count

  // Cantos de localização padrão de QR Code
  drawQrCorner(ctx, x, y, cell * 5)
  drawQrCorner(ctx, x + size - cell * 5, y, cell * 5)
  drawQrCorner(ctx, x, y + size - cell * 5, cell * 5)

  // Módulos internos pseudo-aleatórios consistentes
  const pattern = [
    [0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0],
    [1, 0, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1],
    [0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0],
    [1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 1, 1, 1],
    [0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0],
    [1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1],
    [0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0],
  ]

  for (let r = 5; r < count - 5; r++) {
    for (let c = 5; c < count - 5; c++) {
      const bit = pattern[(r - 5) % pattern.length][(c - 5) % pattern[0].length]
      if (bit === 1) {
        ctx.fillRect(x + c * cell, y + r * cell, cell - 1, cell - 1)
      }
    }
  }

  ctx.restore()
}

function drawQrCorner(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  roundRect(ctx, x, y, s, s, 6)
  ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  roundRect(ctx, x + s * 0.2, y + s * 0.2, s * 0.6, s * 0.6, 4)
  ctx.fill()
  ctx.fillStyle = '#0F172A'
  roundRect(ctx, x + s * 0.35, y + s * 0.35, s * 0.3, s * 0.3, 2)
  ctx.fill()
}
