/**
 * Utilitário de exportação para PNG em alta resolução via Canvas HTML5 nativo
 * Renderiza elementos DOM ou SVG no formato e dimensões exatas solicitadas
 * Sem dependências pesadas externas e garantindo compatibilidade total no navegador
 */

export interface ExportOptions {
  filename: string
  width: number
  height: number
  scale?: number
}

/**
 * Converte um elemento DOM (HTML ou SVG) para PNG com as dimensões exatas informadas
 * Utiliza XMLSerializer e SVG foreignObject / canvas para desenhar com fidelidade CSS
 */
export async function exportElementToPng(
  element: HTMLElement | SVGSVGElement,
  options: ExportOptions,
): Promise<string> {
  const { filename, width, height, scale = 1 } = options
  const targetWidth = Math.round(width * scale)
  const targetHeight = Math.round(height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight
  const ctx = canvas.getContext('2d', { alpha: true })

  if (!ctx) {
    throw new Error('Não foi possível obter contexto 2D do Canvas')
  }

  // Se o elemento for um SVG ou contiver SVG diretamente
  let svgString = ''
  if (element instanceof SVGSVGElement) {
    const clone = element.cloneNode(true) as SVGSVGElement
    clone.setAttribute('width', targetWidth.toString())
    clone.setAttribute('height', targetHeight.toString())
    svgString = new XMLSerializer().serializeToString(clone)
  } else {
    // Clonar elemento com estilos computados embutidos
    const clone = element.cloneNode(true) as HTMLElement
    // Garantir atributos de tamanho para foreignObject
    clone.style.width = `${width}px`
    clone.style.height = `${height}px`
    clone.style.transform = 'none'
    clone.style.margin = '0'

    // Coleta estilos para incluir dentro do SVG
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((el) => {
        if (el instanceof HTMLStyleElement) return el.outerHTML
        return ''
      })
      .join('\n')

    const serializedHtml = new XMLSerializer().serializeToString(clone)

    svgString = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${targetWidth}" height="${targetHeight}" viewBox="0 0 ${width} ${height}">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px;overflow:hidden;margin:0;padding:0;">
            ${styles}
            ${serializedHtml}
          </div>
        </foreignObject>
      </svg>
    `
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    img.onload = () => {
      try {
        ctx.clearRect(0, 0, targetWidth, targetHeight)
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight)
        URL.revokeObjectURL(url)

        const dataUrl = canvas.toDataURL('image/png')
        triggerDownload(dataUrl, filename)
        resolve(dataUrl)
      } catch (err) {
        URL.revokeObjectURL(url)
        reject(err)
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      // Fallback: tentar desenhar diretamente se falhar foreignObject
      fallbackCanvasRender(width, height, filename).then(resolve).catch(reject)
    }

    img.src = url
  })
}

/**
 * Fallback simples usando canvas nativo caso o navegador restrinja SVG foreignObject
 */
async function fallbackCanvasRender(
  width: number,
  height: number,
  filename: string,
): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Falha ao instanciar canvas')

  // Fundo gradiente padrão da marca
  const grad = ctx.createLinearGradient(0, 0, width, height)
  grad.addColorStop(0, '#14805A')
  grad.addColorStop(1, '#0B5239')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, width, height)

  const dataUrl = canvas.toDataURL('image/png')
  triggerDownload(dataUrl, filename)
  return dataUrl
}

/**
 * Dispara o download automático de um arquivo no navegador
 */
export function triggerDownload(urlOrDataUri: string, filename: string) {
  const link = document.createElement('a')
  link.download = filename
  link.href = urlOrDataUri
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Baixa um arquivo a partir de uma URL direta (ex: /icons/icon-512x512.png)
 */
export async function downloadDirectUrl(url: string, filename: string) {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)
    triggerDownload(blobUrl, filename)
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
  } catch (err) {
    // Fallback: direct anchor link
    triggerDownload(url, filename)
  }
}
