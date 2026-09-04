// Minimal pure JavaScript PNG encoder without external native dependencies
// Produces valid standard uncompressed/DEFLATE PNG files

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) {
    c = (c >>> 8) ^ table[(c ^ bytes[i]) & 0xff]
  }
  return (c ^ 0xffffffff) >>> 0
}

const table = new Uint32Array(256)
for (let i = 0; i < 256; i++) {
  let c = i
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  }
  table[i] = c
}

function adler32(bytes: Uint8Array): number {
  let a = 1
  let b = 0
  for (let i = 0; i < bytes.length; i++) {
    a = (a + bytes[i]) % 65521
    b = (b + a) % 65521
  }
  return ((b << 16) | a) >>> 0
}

// Store-only DEFLATE block generator (RFC 1951, BTYPE 00 - uncompressed)
function createDeflateStream(data: Uint8Array): Uint8Array {
  const BLOCK_SIZE = 65535
  const numBlocks = Math.ceil(data.length / BLOCK_SIZE) || 1
  // zlib header (CMF=0x78, FLG=0x01) + blocks (5 bytes header each) + data + adler32 (4 bytes)
  const totalLength = 2 + numBlocks * 5 + data.length + 4
  const out = new Uint8Array(totalLength)
  let pos = 0

  out[pos++] = 0x78 // CMF: deflate 32K window
  out[pos++] = 0x01 // FLG: check bits

  let offset = 0
  for (let i = 0; i < numBlocks; i++) {
    const isLast = i === numBlocks - 1
    const currentBlockLen = Math.min(BLOCK_SIZE, data.length - offset)
    out[pos++] = isLast ? 0x01 : 0x00 // BFINAL + BTYPE (00)
    out[pos++] = currentBlockLen & 0xff
    out[pos++] = (currentBlockLen >>> 8) & 0xff
    const nlen = ~currentBlockLen & 0xffff
    out[pos++] = nlen & 0xff
    out[pos++] = (nlen >>> 8) & 0xff
    out.set(data.subarray(offset, offset + currentBlockLen), pos)
    pos += currentBlockLen
    offset += currentBlockLen
  }

  const adler = adler32(data)
  out[pos++] = (adler >>> 24) & 0xff
  out[pos++] = (adler >>> 16) & 0xff
  out[pos++] = (adler >>> 8) & 0xff
  out[pos++] = adler & 0xff

  return out
}

function makeChunk(type: string, data: Uint8Array): Uint8Array {
  const len = data.length
  const chunk = new Uint8Array(4 + 4 + len + 4)
  const view = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength)
  view.setUint32(0, len, false)
  for (let i = 0; i < 4; i++) {
    chunk[4 + i] = type.charCodeAt(i)
  }
  chunk.set(data, 8)
  const toCrc = chunk.subarray(4, 8 + len)
  const crcVal = crc32(toCrc)
  view.setUint32(8 + len, crcVal, false)
  return chunk
}

export function encodeRgbaToPng(
  width: number,
  height: number,
  getPixel: (x: number, y: number) => [number, number, number, number],
): Uint8Array {
  const rowLen = width * 4 + 1
  const rawData = new Uint8Array(rowLen * height)

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

  const idatData = createDeflateStream(rawData)

  const ihdr = new Uint8Array(13)
  const ihdrView = new DataView(ihdr.buffer)
  ihdrView.setUint32(0, width, false)
  ihdrView.setUint32(4, height, false)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type: RGBA
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace

  const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdrChunk = makeChunk('IHDR', ihdr)
  const idatChunk = makeChunk('IDAT', idatData)
  const iendChunk = makeChunk('IEND', new Uint8Array(0))

  const totalLen = signature.length + ihdrChunk.length + idatChunk.length + iendChunk.length
  const png = new Uint8Array(totalLen)
  let pos = 0
  png.set(signature, pos)
  pos += signature.length
  png.set(ihdrChunk, pos)
  pos += ihdrChunk.length
  png.set(idatChunk, pos)
  pos += idatChunk.length
  png.set(iendChunk, pos)

  return png
}

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = ''
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}
