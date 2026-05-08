import pb from '@/lib/pocketbase/client'

export const getProfessionals = async () => {
  try {
    return await pb.collection('users').getFullList({
      filter: 'role = "professional" && is_blocked != true',
      sort: 'name',
    })
  } catch (err) {
    console.error('Error fetching professionals:', err)
    return []
  }
}

export const getAdminProfessionals = async () => {
  try {
    return await pb.collection('users').getFullList({
      filter: 'role = "professional"',
      sort: '-created',
    })
  } catch (err) {
    console.error('Error fetching admin professionals:', err)
    return []
  }
}

export const updateUser = async (id: string, data: any) => {
  return await pb.collection('users').update(id, data)
}

export const verifyProfessional = async (id: string, isVerified: boolean | any = true) => {
  const updateData = typeof isVerified === 'object' ? isVerified : { is_verified: isVerified }
  return await pb.collection('users').update(id, updateData)
}

export const getDependents = async (parentId?: string) => {
  try {
    const id = parentId || pb.authStore.record?.id
    if (!id) return []
    return await pb.collection('users').getFullList({
      filter: `dependent_of = "${id}"`,
      sort: '-created',
    })
  } catch (err) {
    console.error('Error fetching dependents:', err)
    return []
  }
}

export const createDependent = async (data: any) => {
  return await pb.collection('users').create(data)
}
