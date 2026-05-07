import pb from '@/lib/pocketbase/client'

export const getProfessionals = async () => {
  try {
    return await pb.collection('users').getFullList({
      filter: 'role = "professional"',
      sort: 'name',
    })
  } catch (err) {
    console.error('Error fetching professionals:', err)
    return []
  }
}

export const updateUser = async (id: string, data: any) => {
  return await pb.collection('users').update(id, data)
}
