import pb from '@/lib/pocketbase/client'

export const getAvailabilitySlots = async (professionalId: string) => {
  return pb.collection('availability_slots').getFullList({
    filter: `professional_id = "${professionalId}"`,
    sort: 'day_of_week,start_time',
  })
}

export const createAvailabilitySlot = async (data: {
  professional_id: string
  day_of_week: string
  start_time: string
  end_time: string
  slot_type: string
}) => {
  return pb.collection('availability_slots').create(data)
}

export const deleteAvailabilitySlot = async (id: string) => {
  return pb.collection('availability_slots').delete(id)
}
