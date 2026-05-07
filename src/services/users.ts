import pb from '@/lib/pocketbase/client'

export const getProfessionals = async () => {
  return pb.collection('users').getFullList({
    filter: 'role = "professional" || role = "medical_director"',
    sort: 'name',
  })
}

export const getUser = async (id: string) => {
  return pb.collection('users').getOne(id)
}

export const updateUser = async (id: string, data: any) => {
  return pb.collection('users').update(id, data)
}

export const verifyProfessional = async (id: string, isVerified: boolean) => {
  return pb.collection('users').update(id, { is_verified: isVerified })
}

export const getDependents = async (parentId: string) => {
  return pb.collection('users').getFullList({
    filter: `parent_id = "${parentId}"`,
    sort: 'name',
  })
}

export const createDependent = async (parentId: string, data: any) => {
  const randomId = Math.random().toString(36).substring(2, 10)
  const email = `dependent_${randomId}@vmed.local`
  const password = `Dep_${Math.random().toString(36)}!`

  return pb.collection('users').create({
    ...data,
    email,
    password,
    passwordConfirm: password,
    parent_id: parentId,
    role: 'patient',
  })
}
