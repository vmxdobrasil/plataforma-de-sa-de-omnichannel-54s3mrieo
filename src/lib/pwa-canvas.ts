// Helper to generate and download or cache PWA icon PNGs in browser
export function createPwaIconCanvas(
  size: number,
  isMaskable: boolean,
  shortcut?: 'calendar' | 'sos' | 'search',
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  const cx = size / 2
  const cy = size / 2

  // Background
  const brandGreen = '#14805A'
  const darkGreen = '#0B5239'
  const sosRed = '#E11D48'

  const grad = ctx.createLinearGradient(0, 0, size, size)
  if (shortcut === 'sos') {
    grad.addColorStop(0, '#E11D48')
    grad.addColorStop(1, '#9F1239')
  } else {
    grad.addColorStop(0, brandGreen)
    grad.addColorStop(1, darkGreen)
  }

  if (isMaskable) {
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)
  } else {
    const r = Math.round(size * 0.22)
    ctx.beginPath()
    ctx.moveTo(r, 0)
    ctx.lineTo(size - r, 0)
    ctx.quadraticCurveTo(size, 0, size, r)
    ctx.lineTo(size, size - r)
    ctx.quadraticCurveTo(size, size, size - r, size)
    ctx.lineTo(r, size)
    ctx.quadraticCurveTo(0, size, 0, size - r)
    ctx.lineTo(0, r)
    ctx.quadraticCurveTo(0, 0, r, 0)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()
  }

  // Ring halo
  ctx.beginPath()
  ctx.arc(cx, cy, size * (isMaskable ? 0.38 : 0.42), 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)'
  ctx.lineWidth = Math.max(2, size * 0.015)
  ctx.stroke()

  if (shortcut === 'calendar') {
    ctx.fillStyle = '#FFFFFF'
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = Math.max(3, size * 0.04)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    const calS = size * 0.45
    const calX = (size - calS) / 2
    const calY = (size - calS) / 2
    ctx.strokeRect(calX, calY, calS, calS)
    ctx.beginPath()
    ctx.moveTo(calX, calY + calS * 0.3)
    ctx.lineTo(calX + calS, calY + calS * 0.3)
    ctx.stroke()
    return canvas
  }

  if (shortcut === 'sos') {
    ctx.fillStyle = '#FFFFFF'
    const crossW = size * 0.16
    const crossH = size * 0.52
    ctx.fillRect(cx - crossW / 2, cy - crossH / 2, crossW, crossH)
    ctx.fillRect(cx - crossH / 2, cy - crossW / 2, crossH, crossW)
    return canvas
  }

  if (shortcut === 'search') {
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = Math.max(3, size * 0.04)
    ctx.beginPath()
    ctx.arc(cx - size * 0.06, cy - size * 0.06, size * 0.18, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(cx + size * 0.06, cy + size * 0.06)
    ctx.lineTo(cx + size * 0.22, cy + size * 0.22)
    ctx.stroke()
    return canvas
  }

  // Cross center
  const crossY = isMaskable ? size * 0.38 : size * 0.36
  const crossW = size * 0.14
  const crossH = size * 0.4
  const cornerR = Math.max(4, size * 0.03)

  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.roundRect(cx - crossW / 2, crossY - crossH / 2, crossW, crossH, cornerR)
  ctx.fill()
  ctx.beginPath()
  ctx.roundRect(cx - crossH / 2, crossY - crossW / 2, crossH, crossW, cornerR)
  ctx.fill()

  // Heart / pulse center dot
  ctx.beginPath()
  ctx.arc(cx, crossY, size * 0.07, 0, Math.PI * 2)
  ctx.fillStyle = '#14805A'
  ctx.fill()

  // Heartbeat pulse inside center
  ctx.beginPath()
  ctx.strokeStyle = '#34D399'
  ctx.lineWidth = Math.max(2, size * 0.015)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.moveTo(cx - size * 0.045, crossY)
  ctx.lineTo(cx - size * 0.02, crossY)
  ctx.lineTo(cx - size * 0.005, crossY - size * 0.03)
  ctx.lineTo(cx + size * 0.01, crossY + size * 0.035)
  ctx.lineTo(cx + size * 0.025, crossY - size * 0.01)
  ctx.lineTo(cx + size * 0.045, crossY)
  ctx.stroke()

  // Typography V MED
  ctx.fillStyle = '#FFFFFF'
  ctx.font = `900 ${Math.round(size * 0.13)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('V MED', cx, size * (isMaskable ? 0.72 : 0.71))

  // Subtitle BRASIL
  ctx.fillStyle = '#A7F3D0'
  ctx.font = `700 ${Math.round(size * 0.052)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
  ctx.fillText('BRASIL', cx, size * (isMaskable ? 0.84 : 0.83))

  return canvas
}
