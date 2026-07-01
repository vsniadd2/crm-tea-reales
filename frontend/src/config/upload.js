/** Максимальный размер загружаемого фото (до сжатия), МБ */
export const MAX_IMAGE_UPLOAD_MB = 2

export const MAX_IMAGE_UPLOAD_BYTES = MAX_IMAGE_UPLOAD_MB * 1024 * 1024

/** Приблизительный размер бинарных данных из data URL (как на сервере) */
export function getDataUrlDecodedBytes(dataStr) {
  if (!dataStr || typeof dataStr !== 'string') return 0
  const comma = dataStr.indexOf(',')
  const header = comma === -1 ? '' : dataStr.slice(0, comma)
  const base64Part =
    comma !== -1 && /^data:[^;]+;base64/i.test(header)
      ? dataStr.slice(comma + 1).replace(/\s/g, '')
      : dataStr.replace(/\s/g, '')
  return Math.floor((base64Part.length * 3) / 4)
}

/** Проверка размера после сжатия (декодированные байты ≤ 2 МБ) */
export function validateImageDataUrlSize(dataUrl) {
  if (!dataUrl) return null
  if (getDataUrlDecodedBytes(dataUrl) > MAX_IMAGE_UPLOAD_BYTES) {
    return `Изображение превышает ${MAX_IMAGE_UPLOAD_MB} МБ. Уменьшите файл или сожмите фото.`
  }
  return null
}
