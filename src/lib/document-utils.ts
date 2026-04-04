import { isBefore, addDays, startOfDay } from 'date-fns'

export function getExpiryStatus(expiryDateStr?: string) {
  if (!expiryDateStr) return null
  const expiryDate = startOfDay(new Date(expiryDateStr))
  const today = startOfDay(new Date())

  if (isBefore(expiryDate, today)) {
    return { label: 'Expirado', color: 'bg-red-100 text-red-800 border-red-200' }
  }
  if (isBefore(expiryDate, addDays(today, 30))) {
    return { label: 'Vence em breve', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
  }
  return { label: 'Válido', color: 'bg-green-100 text-green-800 border-green-200' }
}
