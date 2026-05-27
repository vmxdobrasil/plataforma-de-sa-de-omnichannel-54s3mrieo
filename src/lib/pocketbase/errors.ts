import { ClientResponseError } from 'pocketbase'

export type FieldErrors = Record<string, string>

export function extractFieldErrors(error: unknown): FieldErrors {
  if (!(error instanceof ClientResponseError)) return {}
  const data = error.response?.data
  if (!data || typeof data !== 'object') return {}
  const errors: FieldErrors = {}
  for (const [field, detail] of Object.entries(data)) {
    if (
      detail &&
      typeof detail === 'object' &&
      'message' in detail &&
      typeof (detail as { message: unknown }).message === 'string'
    ) {
      let msg = (detail as { message: string }).message
      if (msg === 'Value must be unique.') {
        msg = 'Este valor já está cadastrado.'
      } else if (msg === 'Cannot be blank.') {
        msg = 'Campo obrigatório.'
      } else if (msg === 'Invalid email format.') {
        msg = 'Formato de e-mail inválido.'
      } else if (msg.includes('maximum allowed file size')) {
        msg = 'Arquivo muito grande.'
      }
      errors[field] = msg
    }
  }
  return errors
}

export function getErrorMessage(error: unknown): string {
  if (!(error instanceof ClientResponseError)) {
    return error instanceof Error ? error.message : 'An unexpected error occurred.'
  }
  const msgs = Object.values(extractFieldErrors(error))
  return msgs.length > 0 ? msgs.join(' ') : error.message || 'An unexpected error occurred.'
}
