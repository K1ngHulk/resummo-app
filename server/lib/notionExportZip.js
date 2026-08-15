import { inflateRawSync } from 'node:zlib'

const ZIP_SIGNATURES = new Set([0x04034b50, 0x06054b50, 0x08074b50])
const EOCD_SIGNATURE = 0x06054b50
const CENTRAL_SIGNATURE = 0x02014b50
const LOCAL_SIGNATURE = 0x04034b50
const DEFAULT_LIMITS = Object.freeze({
  maxArchiveBytes: 180 * 1024 * 1024,
  maxFiles: 5000,
  maxUncompressedBytes: 512 * 1024 * 1024,
  maxEntryBytes: 160 * 1024 * 1024,
  maxCompressionRatio: 200,
  maxPathDepth: 24,
  maxNestedDepth: 1,
})

const ignoredBasenames = new Set(['.DS_Store', 'Thumbs.db'])
const supportedExtensions = new Set(['.md', '.markdown', '.csv', '.png', '.jpg', '.jpeg', '.gif', '.webp'])

function createImportError(message, code = 'INVALID_NOTION_EXPORT') {
  const error = new Error(message)
  error.statusCode = 400
  error.code = code
  return error
}

function getExtension(filePath) {
  const basename = filePath.split('/').pop() || ''
  const dot = basename.lastIndexOf('.')
  return dot >= 0 ? basename.slice(dot).toLowerCase() : ''
}

function normalizeZipPath(rawName, maxPathDepth) {
  if (rawName && [...rawName].some((character) => character.charCodeAt(0) === 0)) {
    throw createImportError('El ZIP contiene una ruta de archivo inválida.')
  }
  if (!rawName || rawName.includes('\0')) {
    throw createImportError('El ZIP contiene una ruta de archivo inválida.')
  }

  const replaced = rawName.replace(/\\/g, '/')
  if (replaced.startsWith('/') || /^[a-zA-Z]:\//.test(replaced)) {
    throw createImportError('El ZIP contiene una ruta absoluta no permitida.')
  }

  const parts = replaced.split('/').filter(Boolean)
  if (parts.some((part) => part === '..')) {
    throw createImportError('El ZIP contiene una ruta que intenta salir de la carpeta de importación.')
  }
  if (parts.length > maxPathDepth) {
    throw createImportError('El ZIP excede la profundidad máxima de carpetas permitida.')
  }

  return parts.join('/') + (replaced.endsWith('/') && parts.length ? '/' : '')
}

function findEndOfCentralDirectory(buffer) {
  const minimum = Math.max(0, buffer.length - 65557)
  for (let offset = buffer.length - 22; offset >= minimum; offset -= 1) {
    if (buffer.readUInt32LE(offset) === EOCD_SIGNATURE) return offset
  }
  throw createImportError('El archivo no contiene un directorio ZIP válido.')
}

let crcTable = null
function getCrcTable() {
  if (crcTable) return crcTable
  crcTable = new Uint32Array(256)
  for (let index = 0; index < 256; index += 1) {
    let value = index
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1)
    }
    crcTable[index] = value >>> 0
  }
  return crcTable
}

function crc32(buffer) {
  const table = getCrcTable()
  let value = 0xffffffff
  for (const byte of buffer) {
    value = table[(value ^ byte) & 0xff] ^ (value >>> 8)
  }
  return (value ^ 0xffffffff) >>> 0
}

function decodeFileName(buffer, utf8) {
  return buffer.toString(utf8 ? 'utf8' : 'latin1')
}

function parseCentralDirectory(buffer, limits) {
  if (buffer.length < 4 || !ZIP_SIGNATURES.has(buffer.readUInt32LE(0))) {
    throw createImportError('El archivo seleccionado no parece ser un ZIP válido.')
  }
  if (buffer.length > limits.maxArchiveBytes) {
    throw createImportError('El ZIP supera el tamaño comprimido permitido para esta importación.')
  }

  const eocdOffset = findEndOfCentralDirectory(buffer)
  const diskNumber = buffer.readUInt16LE(eocdOffset + 4)
  const centralDisk = buffer.readUInt16LE(eocdOffset + 6)
  const entriesOnDisk = buffer.readUInt16LE(eocdOffset + 8)
  const totalEntries = buffer.readUInt16LE(eocdOffset + 10)
  const centralSize = buffer.readUInt32LE(eocdOffset + 12)
  const centralOffset = buffer.readUInt32LE(eocdOffset + 16)

  if (diskNumber !== 0 || centralDisk !== 0 || entriesOnDisk !== totalEntries) {
    throw createImportError('Los ZIP divididos en múltiples volúmenes no están permitidos.')
  }
  if (totalEntries === 0xffff || centralSize === 0xffffffff || centralOffset === 0xffffffff) {
    throw createImportError('Este ZIP usa ZIP64 y excede el formato esperado para el export de Resummo.')
  }
  if (totalEntries > limits.maxFiles) {
    throw createImportError('El ZIP contiene demasiados archivos para una importación segura.')
  }
  if (centralOffset + centralSize > buffer.length) {
    throw createImportError('El directorio ZIP está truncado o corrupto.')
  }

  const entries = []
  let offset = centralOffset
  let totalUncompressed = 0

  for (let index = 0; index < totalEntries; index += 1) {
    if (offset + 46 > buffer.length || buffer.readUInt32LE(offset) !== CENTRAL_SIGNATURE) {
      throw createImportError('El directorio ZIP contiene una entrada inválida.')
    }

    const flags = buffer.readUInt16LE(offset + 8)
    const compressionMethod = buffer.readUInt16LE(offset + 10)
    const expectedCrc = buffer.readUInt32LE(offset + 16)
    const compressedSize = buffer.readUInt32LE(offset + 20)
    const uncompressedSize = buffer.readUInt32LE(offset + 24)
    const fileNameLength = buffer.readUInt16LE(offset + 28)
    const extraLength = buffer.readUInt16LE(offset + 30)
    const commentLength = buffer.readUInt16LE(offset + 32)
    const externalAttributes = buffer.readUInt32LE(offset + 38)
    const localHeaderOffset = buffer.readUInt32LE(offset + 42)
    const nameStart = offset + 46
    const nameEnd = nameStart + fileNameLength

    if (nameEnd + extraLength + commentLength > buffer.length) {
      throw createImportError('El ZIP contiene metadata truncada.')
    }
    if ((flags & 0x1) !== 0) {
      throw createImportError('Los ZIP cifrados no están permitidos.')
    }
    if (![0, 8].includes(compressionMethod)) {
      throw createImportError('El ZIP usa un método de compresión no soportado.')
    }
    if (uncompressedSize > limits.maxEntryBytes) {
      throw createImportError('Un archivo del ZIP excede el tamaño máximo permitido.')
    }

    totalUncompressed += uncompressedSize
    if (totalUncompressed > limits.maxUncompressedBytes) {
      throw createImportError('El ZIP excede el tamaño total descomprimido permitido.')
    }
    if (uncompressedSize > 1024 * 1024) {
      if (compressedSize === 0) {
        throw createImportError('El ZIP contiene una entrada con ratio de compresión inválido.')
      }
      const ratio = uncompressedSize / compressedSize
      if (ratio > limits.maxCompressionRatio) {
        throw createImportError('El ZIP contiene una entrada con ratio de compresión sospechoso.')
      }
    }

    const rawName = decodeFileName(buffer.subarray(nameStart, nameEnd), (flags & 0x800) !== 0)
    const normalizedPath = normalizeZipPath(rawName, limits.maxPathDepth)
    const directory = normalizedPath.endsWith('/') || ((externalAttributes >>> 16) & 0x4000) !== 0

    entries.push({
      path: normalizedPath,
      directory,
      flags,
      compressionMethod,
      expectedCrc,
      compressedSize,
      uncompressedSize,
      localHeaderOffset,
    })

    offset = nameEnd + extraLength + commentLength
  }

  return entries
}

function inflateEntry(buffer, entry, limits) {
  if (entry.directory) return Buffer.alloc(0)
  const offset = entry.localHeaderOffset
  if (offset + 30 > buffer.length || buffer.readUInt32LE(offset) !== LOCAL_SIGNATURE) {
    throw createImportError('El ZIP contiene una entrada local inválida.')
  }

  const fileNameLength = buffer.readUInt16LE(offset + 26)
  const extraLength = buffer.readUInt16LE(offset + 28)
  const dataStart = offset + 30 + fileNameLength + extraLength
  const dataEnd = dataStart + entry.compressedSize
  if (dataEnd > buffer.length) {
    throw createImportError('El ZIP contiene datos truncados.')
  }

  const compressed = buffer.subarray(dataStart, dataEnd)
  if (entry.compressionMethod === 0 && entry.compressedSize !== entry.uncompressedSize) {
    throw createImportError('Una entrada sin compresión declara un tamaño descomprimido inconsistente.')
  }
  if (entry.compressionMethod === 0 && entry.compressedSize > limits.maxEntryBytes) {
    throw createImportError('Un archivo del ZIP excede el tamaño máximo permitido.')
  }

  let data
  try {
    data = entry.compressionMethod === 0
      ? Buffer.from(compressed)
      : inflateRawSync(compressed, {
          maxOutputLength: Math.max(1, Math.min(entry.uncompressedSize, limits.maxEntryBytes)),
        })
  } catch (error) {
    if (error?.code === 'ERR_BUFFER_TOO_LARGE' || error?.code === 'ERR_OUT_OF_RANGE') {
      throw createImportError('Una entrada del ZIP excede el tamaño descomprimido declarado o permitido.')
    }
    throw createImportError('No se pudo descomprimir una entrada del ZIP.')
  }

  if (data.length !== entry.uncompressedSize || crc32(data) !== entry.expectedCrc) {
    throw createImportError('Una entrada del ZIP no superó la verificación de integridad.')
  }
  return data
}

function isIgnoredEntry(filePath) {
  const parts = filePath.split('/').filter(Boolean)
  return parts.some((part) => part === '__MACOSX') || ignoredBasenames.has(parts.at(-1))
}

function materializeArchive(buffer, limits) {
  const centralEntries = parseCentralDirectory(buffer, limits)
  return centralEntries.map((entry) => ({
    ...entry,
    data: entry.directory ? null : inflateEntry(buffer, entry, limits),
  }))
}

function classifyEntries(entries) {
  const files = entries.filter((entry) => !entry.directory && !isIgnoredEntry(entry.path))
  const supported = []
  const ignored = []
  const nestedZip = []

  for (const entry of files) {
    const extension = getExtension(entry.path)
    if (supportedExtensions.has(extension)) supported.push(entry)
    else if (extension === '.zip') nestedZip.push(entry)
    else ignored.push(entry.path)
  }

  return { files, supported, ignored, nestedZip }
}

export function parseNotionExportZip(buffer, options = {}) {
  if (!Buffer.isBuffer(buffer)) {
    throw createImportError('El importador esperaba contenido ZIP binario.')
  }

  const limits = { ...DEFAULT_LIMITS, ...options.limits }
  const outerEntries = materializeArchive(buffer, limits)
  const outer = classifyEntries(outerEntries)

  if (outer.supported.length > 0) {
    if (outer.nestedZip.length > 0) {
      outer.ignored.push(...outer.nestedZip.map((entry) => entry.path))
    }
    return {
      wrapperDepth: 0,
      entries: outer.supported,
      ignoredPaths: outer.ignored,
      archiveStats: {
        totalEntries: outerEntries.length,
        totalFiles: outer.files.length,
        uncompressedBytes: outerEntries.reduce((sum, entry) => sum + entry.uncompressedSize, 0),
      },
    }
  }

  if (outer.nestedZip.length === 1 && outer.files.length === 1 && limits.maxNestedDepth >= 1) {
    const innerBuffer = outer.nestedZip[0].data
    const innerEntries = materializeArchive(innerBuffer, limits)
    const inner = classifyEntries(innerEntries)
    if (inner.nestedZip.length > 0 && inner.supported.length === 0) {
      throw createImportError('El export contiene más niveles de ZIP anidado de los permitidos.')
    }
    if (inner.supported.length === 0) {
      throw createImportError('El ZIP interior no contiene Markdown, CSV ni assets compatibles.')
    }

    return {
      wrapperDepth: 1,
      wrapperPath: outer.nestedZip[0].path,
      entries: inner.supported,
      ignoredPaths: inner.ignored.concat(inner.nestedZip.map((entry) => entry.path)),
      archiveStats: {
        totalEntries: innerEntries.length,
        totalFiles: inner.files.length,
        uncompressedBytes: innerEntries.reduce((sum, entry) => sum + entry.uncompressedSize, 0),
      },
    }
  }

  if (outer.nestedZip.length > 1) {
    throw createImportError('El wrapper contiene múltiples ZIP internos y no se puede determinar cuál es el export de Notion.')
  }

  throw createImportError('No se encontraron páginas Markdown ni assets compatibles en el ZIP seleccionado.')
}

export const notionZipLimits = DEFAULT_LIMITS
