import pb from '@/lib/pocketbase/client'
import { getAvailabilitySlots } from '@/services/availability'

export function sanitize(str: string): string {
  return str.replace(/["\\]/g, '')
}

export function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '')
  if (cleaned.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cleaned)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i]) * (10 - i)
  let digit = 11 - (sum % 11)
  if (digit >= 10) digit = 0
  if (digit !== parseInt(cleaned[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(cleaned[i]) * (11 - i)
  digit = 11 - (sum % 11)
  if (digit >= 10) digit = 0
  return digit === parseInt(cleaned[10])
}

export async function logAudit(
  action: string,
  resourceType: string,
  resourceId: string,
  details?: any,
) {
  const userId = pb.authStore.record?.id
  if (!userId) return
  try {
    await pb.collection('audit_logs').create({
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details: details || {},
    })
  } catch (e) {
    console.error('Audit log failed:', e)
  }
}

export async function getClinicStats() {
  const today = new Date().toISOString().split('T')[0]
  const [patients, doctors, apptsToday, pending] = await Promise.all([
    pb.collection('users').getList(1, 1, { filter: 'role = "patient"' }),
    pb
      .collection('users')
      .getList(1, 1, { filter: 'role = "professional" && professional_status = "active"' }),
    pb
      .collection('appointments')
      .getList(1, 1, {
        filter: `dateTime >= "${today} 00:00:00" && dateTime <= "${today} 23:59:59"`,
      }),
    pb.collection('appointments').getList(1, 1, { filter: 'status = "scheduled"' }),
  ])
  return {
    patients: patients.totalItems,
    doctors: doctors.totalItems,
    apptsToday: apptsToday.totalItems,
    pending: pending.totalItems,
  }
}

export async function getPatients(page: number, search: string) {
  let filter = 'role = "patient"'
  if (search) {
    const s = sanitize(search)
    filter += ` && (name ~ "${s}" || document_id ~ "${s}" || phone ~ "${s}")`
  }
  return pb
    .collection('users')
    .getList(page, 20, { filter, sort: '-created', expand: 'company_id' })
}

export async function updatePatientStatus(id: string, status: string) {
  await pb.collection('users').update(id, { registration_status: status })
  await logAudit('update', 'users', id, { registration_status: status })
}

export async function getDoctors(page: number, search: string) {
  let filter = 'role = "professional"'
  if (search) {
    const s = sanitize(search)
    filter += ` && (name ~ "${s}" || crm_number ~ "${s}" || specialty ~ "${s}")`
  }
  return pb.collection('users').getList(page, 20, { filter, sort: '-created' })
}

export async function updateDoctorStatus(id: string, status: string) {
  await pb.collection('users').update(id, { professional_status: status })
  await logAudit('update', 'users', id, { professional_status: status })
}

export async function getStaff(page: number, search: string) {
  let filter = '(role = "admin" || role = "medical_director")'
  if (search) {
    const s = sanitize(search)
    filter += ` && (name ~ "${s}" || email ~ "${s}")`
  }
  return pb.collection('users').getList(page, 20, { filter, sort: '-created' })
}

export async function updateStaffStatus(id: string, blocked: boolean) {
  await pb.collection('users').update(id, { is_blocked: blocked })
  await logAudit('update', 'users', id, { is_blocked: blocked })
}

export async function getAppointments(
  page: number,
  search: string,
  filters: Record<string, string>,
) {
  const parts: string[] = []
  if (search) {
    const s = sanitize(search)
    const users = await pb.collection('users').getList(1, 20, { filter: `name ~ "${s}"` })
    if (users.items.length > 0) {
      const idFilter = users.items
        .map((u) => `patient_id = "${u.id}" || professional_id = "${u.id}"`)
        .join(' || ')
      parts.push(`(${idFilter})`)
    } else {
      return { items: [], totalItems: 0, page, perPage: 20, totalPages: 0 }
    }
  }
  if (filters.status) parts.push(`status = "${filters.status}"`)
  if (filters.classification) parts.push(`classification = "${filters.classification}"`)
  if (filters.date)
    parts.push(`dateTime >= "${filters.date} 00:00:00" && dateTime <= "${filters.date} 23:59:59"`)
  const filter = parts.length > 0 ? parts.join(' && ') : '1 = 1'
  return pb
    .collection('appointments')
    .getList(page, 20, {
      filter,
      sort: '-dateTime',
      expand: 'patient_id,professional_id,cancelled_by',
    })
}

export async function checkDoubleBooking(doctorId: string, dateTime: string) {
  const existing = await pb.collection('appointments').getList(1, 1, {
    filter: `professional_id = "${doctorId}" && dateTime = "${dateTime}" && status != "cancelled"`,
  })
  return existing.totalItems > 0
}

export async function cancelAppointment(id: string, reason: string) {
  const userId = pb.authStore.record?.id
  await pb.collection('appointments').update(id, {
    status: 'cancelled',
    cancellation_reason: reason,
    cancelled_by: userId,
  })
  await logAudit('update', 'appointments', id, { action: 'cancel', reason })
}

export { getAvailabilitySlots }
