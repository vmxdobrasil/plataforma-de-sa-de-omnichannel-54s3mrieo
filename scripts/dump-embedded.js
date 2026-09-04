import fs from 'fs'
import path from 'path'
import { generateAllPwaIcons } from './generate-icons.js'

const icons = generateAllPwaIcons()

const outTs = `// Auto-generated icons data URIs for client fallback and PWA icon verification
export const PWA_EMBEDDED_ICONS = {
  icon192: "data:image/png;base64,${icons.icon192}",
  icon512: "data:image/png;base64,${icons.icon512}",
  iconMask192: "data:image/png;base64,${icons.iconMask192}",
  iconMask512: "data:image/png;base64,${icons.iconMask512}",
  appleTouch: "data:image/png;base64,${icons.appleTouch}",
  favicon: "data:image/png;base64,${icons.favicon}",
  scCal: "data:image/png;base64,${icons.scCal}",
  scSos: "data:image/png;base64,${icons.scSos}",
  scSearch: "data:image/png;base64,${icons.scSearch}",
} as const
`

fs.writeFileSync(path.resolve('src/lib/pwa-embedded-icons.ts'), outTs)
console.log('src/lib/pwa-embedded-icons.ts generated.')
