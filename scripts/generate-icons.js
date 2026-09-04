// Node.js script using pure JS PNG encoder (zlib / DEFLATE) to generate all required PWA PNG icons
import fs from 'fs'
import path from 'path'
import zlib from 'zlib'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

// Simple RGBA buffer to standard PNG encoder using Node's zlib
function encodePng(width, height, getPixel) {
  const rowLen = width * 4 + 1
  const rawData = Buffer.alloc(rowLen * height)

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLen
    rawData[rowOffset] = 0 // Filter type: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y)
      const pxOffset = rowOffset + 1 + x * 4
      rawData[pxOffset] = r
      rawData[pxOffset + 1] = g
      rawData[pxOffset + 2] = b
      rawData[pxOffset + 3] = a
    }
  }

  const idatData = zlib.deflateSync(rawData)

  function crc32(buf) {
    let c = 0xffffffff
    for (let i = 0; i < buf.length; i++) {
      c = (c >>> 8) ^ crcTable[(c ^ buf[i]) & 0xff]
    }
    return (c ^ 0xffffffff) >>> 0
  }

  const crcTable = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    crcTable[i] = c
  }

  function makeChunk(type, data) {
    const len = data.length
    const chunk = Buffer.alloc(4 + 4 + len + 4)
    chunk.writeUInt32BE(len, 0)
    chunk.write(type, 4, 4, 'ascii')
    data.copy(chunk, 8)
    const toCrc = chunk.subarray(4, 8 + len)
    const crcVal = crc32(toCrc)
    chunk.writeUInt32BE(crcVal, 8 + len)
    return chunk
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type: RGBA
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr)
  const idatChunk = makeChunk('IDAT', idatData)
  const iendChunk = makeChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk])
}

// Distance to rounded rectangle
function sdRoundRect(px, py, rx, ry, rw, rh, rad) {
  const dx = Math.abs(px - (rx + rw / 2)) - (rw / 2 - rad)
  const dy = Math.abs(py - (ry + rh / 2)) - (rh / 2 - rad)
  const outsideDist = Math.hypot(Math.max(dx, 0), Math.max(dy, 0))
  const insideDist = Math.min(Math.max(dx, dy), 0)
  return outsideDist + insideDist - rad
}

// Distance to segment
function sdSegment(px, py, ax, ay, bx, by) {
  const pax = px - ax,
    pay = py - ay
  const bax = bx - ax,
    bay = by - ay
  const h = Math.max(0, Math.min(1, (pax * bax + pay * bay) / (bax * bax + bay * bay)))
  const dx = pax - bax * h
  const dy = pay - bay * h
  return Math.hypot(dx, dy)
}

// Render V MED BRASIL icon (standard or maskable)
function renderVMedIcon(size, isMaskable) {
  const cx = size / 2
  const cy = size / 2

  // Color stops for gradient: #14805A to #0B5239
  const c1 = [0x14, 0x80, 0x5a]
  const c2 = [0x0b, 0x52, 0x39]

  // Safe zone scale for maskable: 0.72 inside, otherwise 0.85
  const scale = isMaskable ? 0.72 : 0.85
  const cornerRadius = isMaskable ? 0 : size * 0.22

  // Center cross coordinates relative to scaled center
  const crossCenterY = isMaskable ? cy - size * 0.08 : cy - size * 0.08
  const crossW = 46 * (size / 512) * (scale / 0.85)
  const crossL = 176 * (size / 512) * (scale / 0.85)
  const crossR = 16 * (size / 512) * (scale / 0.85)
  const innerCircleR = 32 * (size / 512) * (scale / 0.85)

  // Accent ring
  const ringR = (size / 2) * (isMaskable ? 0.68 : 0.88)
  const ringThick = Math.max(1.5, size * 0.012)

  // Typography approximations using crisp raster marks for "V MED" and "BRASIL"
  return encodePng(size, size, (x, y) => {
    // 1. Check background shape
    let bgAlpha = 1.0
    if (!isMaskable) {
      const d = sdRoundRect(x, y, 0, 0, size, size, cornerRadius)
      if (d > 0.5) return [0, 0, 0, 0]
      if (d > -0.5) bgAlpha = 0.5 - d
    }

    // Gradient background #14805A -> #0B5239
    const t = Math.max(0, Math.min(1, (x + y) / (2 * size)))
    let r = Math.round(c1[0] + (c2[0] - c1[0]) * t)
    let g = Math.round(c1[1] + (c2[1] - c1[1]) * t)
    let b = Math.round(c1[2] + (c2[2] - c1[2]) * t)

    // 2. Accent circle ring
    const distToCenter = Math.hypot(x - cx, y - cy)
    const ringDist = Math.abs(distToCenter - ringR)
    if (ringDist < ringThick) {
      const ringIntensity = (1 - ringDist / ringThick) * 0.35
      // Blend emerald #34D399 (52, 211, 153)
      r = Math.round(r * (1 - ringIntensity) + 52 * ringIntensity)
      g = Math.round(g * (1 - ringIntensity) + 211 * ringIntensity)
      b = Math.round(b * (1 - ringIntensity) + 153 * ringIntensity)
    }

    // 3. Medical Cross (white with rounded ends)
    const dVert = sdRoundRect(
      x,
      y,
      cx - crossW / 2,
      crossCenterY - crossL / 2,
      crossW,
      crossL,
      crossR,
    )
    const dHoriz = sdRoundRect(
      x,
      y,
      cx - crossL / 2,
      crossCenterY - crossW / 2,
      crossL,
      crossW,
      crossR,
    )
    const dCross = Math.min(dVert, dHoriz)

    if (dCross <= 0.5) {
      // Inner circle in center of cross: emerald green #14805A
      const distCrossCenter = Math.hypot(x - cx, y - crossCenterY)
      if (distCrossCenter <= innerCircleR) {
        // Central circle background #14805A
        let cr = 0x14,
          cg = 0x80,
          cb = 0x5a

        // Heartbeat ECG pulse line inside inner circle
        const segs = [
          [-innerCircleR * 0.7, 0, -innerCircleR * 0.35, 0],
          [-innerCircleR * 0.35, 0, -innerCircleR * 0.15, -innerCircleR * 0.55],
          [-innerCircleR * 0.15, -innerCircleR * 0.55, innerCircleR * 0.15, innerCircleR * 0.65],
          [innerCircleR * 0.15, innerCircleR * 0.65, innerCircleR * 0.35, -innerCircleR * 0.2],
          [innerCircleR * 0.35, -innerCircleR * 0.2, innerCircleR * 0.55, 0],
          [innerCircleR * 0.55, 0, innerCircleR * 0.7, 0],
        ]
        const pulseLineWidth = Math.max(1.5, size * 0.012)
        let minPulseDist = 999
        for (const [ax, ay, bx, by] of segs) {
          const sd = sdSegment(x - cx, y - crossCenterY, ax, ay, bx, by)
          if (sd < minPulseDist) minPulseDist = sd
        }
        if (minPulseDist <= pulseLineWidth) {
          const pAlpha = Math.max(0, Math.min(1, 1 - (minPulseDist - (pulseLineWidth - 0.75))))
          cr = Math.round(cr * (1 - pAlpha) + 52 * pAlpha)
          cg = Math.round(cg * (1 - pAlpha) + 211 * pAlpha)
          cb = Math.round(cb * (1 - pAlpha) + 153 * pAlpha)
        }

        r = cr
        g = cg
        b = cb
      } else {
        // Cross white body
        const edgeAlpha = dCross < -0.5 ? 1 : 0.5 - dCross
        r = Math.round(r * (1 - edgeAlpha) + 255 * edgeAlpha)
        g = Math.round(g * (1 - edgeAlpha) + 255 * edgeAlpha)
        b = Math.round(b * (1 - edgeAlpha) + 255 * edgeAlpha)
      }
    }

    // 4. "V MED" letters representation in lower half
    const textY = isMaskable ? size * 0.73 : size * 0.72
    const fontH = size * 0.12
    const subTextY = isMaskable ? size * 0.85 : size * 0.84

    // Letter V: left side
    const vCenterX = cx - size * 0.22
    const vWidth = size * 0.1
    const vLeftD = sdSegment(
      x,
      y,
      vCenterX - vWidth / 2,
      textY - fontH / 2,
      vCenterX,
      textY + fontH / 2,
    )
    const vRightD = sdSegment(
      x,
      y,
      vCenterX + vWidth / 2,
      textY - fontH / 2,
      vCenterX,
      textY + fontH / 2,
    )
    const vDist = Math.min(vLeftD, vRightD)

    // Letter M: center-left
    const mCenterX = cx - size * 0.06
    const mW = size * 0.09
    const mD1 = sdSegment(
      x,
      y,
      mCenterX - mW / 2,
      textY - fontH / 2,
      mCenterX - mW / 2,
      textY + fontH / 2,
    )
    const mD2 = sdSegment(x, y, mCenterX - mW / 2, textY - fontH / 2, mCenterX, textY + fontH * 0.1)
    const mD3 = sdSegment(x, y, mCenterX, textY + fontH * 0.1, mCenterX + mW / 2, textY - fontH / 2)
    const mD4 = sdSegment(
      x,
      y,
      mCenterX + mW / 2,
      textY - fontH / 2,
      mCenterX + mW / 2,
      textY + fontH / 2,
    )
    const mDist = Math.min(mD1, mD2, mD3, mD4)

    // Letter E: center-right
    const eCenterX = cx + size * 0.08
    const eW = size * 0.08
    const eD1 = sdSegment(
      x,
      y,
      eCenterX - eW / 2,
      textY - fontH / 2,
      eCenterX - eW / 2,
      textY + fontH / 2,
    )
    const eD2 = sdSegment(
      x,
      y,
      eCenterX - eW / 2,
      textY - fontH / 2,
      eCenterX + eW / 2,
      textY - fontH / 2,
    )
    const eD3 = sdSegment(x, y, eCenterX - eW / 2, textY, eCenterX + eW * 0.3, textY)
    const eD4 = sdSegment(
      x,
      y,
      eCenterX - eW / 2,
      textY + fontH / 2,
      eCenterX + eW / 2,
      textY + fontH / 2,
    )
    const eDist = Math.min(eD1, eD2, eD3, eD4)

    // Letter D: right
    const dCenterX = cx + size * 0.22
    const dW = size * 0.08
    const dD1 = sdSegment(
      x,
      y,
      dCenterX - dW / 2,
      textY - fontH / 2,
      dCenterX - dW / 2,
      textY + fontH / 2,
    )
    const dD2 = sdSegment(
      x,
      y,
      dCenterX - dW / 2,
      textY - fontH / 2,
      dCenterX + dW * 0.1,
      textY - fontH / 2,
    )
    const dD3 = sdSegment(
      x,
      y,
      dCenterX - dW / 2,
      textY + fontH / 2,
      dCenterX + dW * 0.1,
      textY + fontH / 2,
    )
    const dArcDist = Math.abs(Math.hypot(x - (dCenterX - dW * 0.1), y - textY) - fontH / 2)
    const dDist = Math.min(dD1, dD2, dD3, x >= dCenterX - dW * 0.1 ? dArcDist : 999)

    const textLineWidth = Math.max(1.8, size * 0.02)
    const letterDist = Math.min(vDist, mDist, eDist, dDist)

    if (letterDist <= textLineWidth) {
      const tAlpha = Math.max(0, Math.min(1, 1 - (letterDist - (textLineWidth - 0.75))))
      r = Math.round(r * (1 - tAlpha) + 255 * tAlpha)
      g = Math.round(g * (1 - tAlpha) + 255 * tAlpha)
      b = Math.round(b * (1 - tAlpha) + 255 * tAlpha)
    }

    // Subtitle BRASIL (dots)
    const dotSpacing = size * 0.055
    const dotRadius = Math.max(1.5, size * 0.012)
    for (let di = -2.5; di <= 2.5; di += 1) {
      const dotX = cx + di * dotSpacing
      const dDot = Math.hypot(x - dotX, y - subTextY)
      if (dDot <= dotRadius) {
        const dAlpha = Math.max(0, Math.min(1, 1 - (dDot - (dotRadius - 0.75))))
        r = Math.round(r * (1 - dAlpha) + 167 * dAlpha)
        g = Math.round(g * (1 - dAlpha) + 243 * dAlpha)
        b = Math.round(b * (1 - dAlpha) + 208 * dAlpha)
      }
    }

    const a = Math.round(bgAlpha * 255)
    return [r, g, b, a]
  })
}

// Render shortcut icons (96x96 default)
function renderShortcut(type, size = 96) {
  const cx = size / 2
  const cy = size / 2
  const cornerR = size * 0.23
  const isSos = type === 'sos'
  const bgColor = isSos ? [0xe1, 0x1d, 0x48] : [0x14, 0x80, 0x5a]

  return encodePng(size, size, (x, y) => {
    const d = sdRoundRect(x, y, 0, 0, size, size, cornerR)
    if (d > 0.5) return [0, 0, 0, 0]
    const alpha = d < -0.5 ? 1 : 0.5 - d

    let [r, g, b] = bgColor

    if (type === 'calendar') {
      const calW = size * 0.48
      const calH = size * 0.48
      const calX = cx - calW / 2
      const calY = cy - calH / 2 + 2
      const strokeW = Math.max(2, size * 0.035)

      const dBox = Math.abs(sdRoundRect(x, y, calX, calY, calW, calH, size * 0.05))
      const dLine = sdSegment(x, y, calX, calY + calH * 0.3, calX + calW, calY + calH * 0.3)
      let dDotMin = 999
      for (let rx = 0; rx < 3; rx++) {
        for (let ry = 0; ry < 2; ry++) {
          const ddx = calX + calW * 0.28 + rx * calW * 0.22
          const ddy = calY + calH * 0.52 + ry * calH * 0.22
          const dDot = Math.hypot(x - ddx, y - ddy)
          if (dDot < dDotMin) dDotMin = dDot
        }
      }

      if (dBox <= strokeW || dLine <= strokeW || dDotMin <= strokeW * 0.9) {
        r = 255
        g = 255
        b = 255
      }
    } else if (type === 'sos') {
      const crossW = size * 0.14
      const crossL = size * 0.5
      const dV = sdRoundRect(x, y, cx - crossW / 2, cy - crossL / 2, crossW, crossL, crossW / 2)
      const dH = sdRoundRect(x, y, cx - crossL / 2, cy - crossW / 2, crossL, crossW, crossW / 2)
      if (Math.min(dV, dH) <= 0.5) {
        r = 255
        g = 255
        b = 255
      }
    } else if (type === 'search') {
      const glassR = size * 0.18
      const glassX = cx - size * 0.06
      const glassY = cy - size * 0.06
      const strokeW = Math.max(2.5, size * 0.04)
      const dCircle = Math.abs(Math.hypot(x - glassX, y - glassY) - glassR)
      const dHandle = sdSegment(
        x,
        y,
        glassX + glassR * 0.7,
        glassY + glassR * 0.7,
        glassX + glassR * 1.5,
        glassY + glassR * 1.5,
      )
      const plusW = size * 0.035
      const plusL = size * 0.16
      const dPV = sdRoundRect(x, y, glassX - plusW / 2, glassY - plusL / 2, plusW, plusL, 1)
      const dPH = sdRoundRect(x, y, glassX - plusL / 2, glassY - plusW / 2, plusL, plusW, 1)

      if (dCircle <= strokeW || dHandle <= strokeW || Math.min(dPV, dPH) <= 0.5) {
        r = 255
        g = 255
        b = 255
      }
    }

    return [r, g, b, Math.round(alpha * 255)]
  })
}

export function generateAllPwaIcons() {
  const iconsDir = path.join(rootDir, 'public', 'icons')
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true })
  }

  // Generate Base64 or write directly
  const icon192 = renderVMedIcon(192, false)
  const icon512 = renderVMedIcon(512, false)
  const iconMask192 = renderVMedIcon(192, true)
  const iconMask512 = renderVMedIcon(512, true)
  const appleTouch = renderVMedIcon(180, false)
  const favicon = renderVMedIcon(64, false)
  const scCal = renderShortcut('calendar', 96)
  const scSos = renderShortcut('sos', 96)
  const scSearch = renderShortcut('search', 96)

  return {
    icon192: icon192.toString('base64'),
    icon512: icon512.toString('base64'),
    iconMask192: iconMask192.toString('base64'),
    iconMask512: iconMask512.toString('base64'),
    appleTouch: appleTouch.toString('base64'),
    favicon: favicon.toString('base64'),
    scCal: scCal.toString('base64'),
    scSos: scSos.toString('base64'),
    scSearch: scSearch.toString('base64'),
  }
}

// When executed directly via node:
if (process.argv[1] && process.argv[1].endsWith('generate-icons.js')) {
  const iconsDir = path.join(rootDir, 'public', 'icons')
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true })
  }
  const icons = generateAllPwaIcons()
  fs.writeFileSync(path.join(iconsDir, 'icon-192x192.png'), Buffer.from(icons.icon192, 'base64'))
  fs.writeFileSync(path.join(iconsDir, 'icon-512x512.png'), Buffer.from(icons.icon512, 'base64'))
  fs.writeFileSync(
    path.join(iconsDir, 'icon-maskable-192x192.png'),
    Buffer.from(icons.iconMask192, 'base64'),
  )
  fs.writeFileSync(
    path.join(iconsDir, 'icon-maskable-512x512.png'),
    Buffer.from(icons.iconMask512, 'base64'),
  )
  fs.writeFileSync(
    path.join(rootDir, 'public', 'apple-touch-icon.png'),
    Buffer.from(icons.appleTouch, 'base64'),
  )
  fs.writeFileSync(
    path.join(iconsDir, 'apple-touch-icon.png'),
    Buffer.from(icons.appleTouch, 'base64'),
  )
  fs.writeFileSync(
    path.join(rootDir, 'public', 'favicon.png'),
    Buffer.from(icons.favicon, 'base64'),
  )
  fs.writeFileSync(path.join(iconsDir, 'favicon.png'), Buffer.from(icons.favicon, 'base64'))
  fs.writeFileSync(path.join(iconsDir, 'shortcut-calendar.png'), Buffer.from(icons.scCal, 'base64'))
  fs.writeFileSync(path.join(iconsDir, 'shortcut-sos.png'), Buffer.from(icons.scSos, 'base64'))
  fs.writeFileSync(
    path.join(iconsDir, 'shortcut-search.png'),
    Buffer.from(icons.scSearch, 'base64'),
  )
  console.log('Icons generated successfully.')
}
